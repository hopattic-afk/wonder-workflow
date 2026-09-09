import { createHash } from "node:crypto";
import { getStore } from "@netlify/blobs";

export interface Stored<T = unknown> {
  value: T;
  etag: string;
}
export interface DurableStore {
  read<T = unknown>(key: string): Promise<Stored<T> | null>;
  cas(key: string, value: unknown, etag: string | null): Promise<boolean>;
  keys(prefix: string, max?: number): Promise<string[]>;
}
export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
export class StorageUnavailable extends Error {
  constructor() {
    super("Durable storage could not be verified. Retry later.");
  }
}
export class Conflict extends Error {
  constructor(message = "Conflicting source data requires review.") {
    super(message);
  }
}
export async function immutable(
  store: DurableStore,
  key: string,
  value: unknown,
): Promise<void> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const existing = await store.read(key);
    if (existing) {
      if (canonical(existing.value) !== canonical(value)) throw new Conflict();
      return;
    }
    if (await store.cas(key, value, null)) return;
  }
  throw new StorageUnavailable();
}
export async function mutate<T>(
  store: DurableStore,
  key: string,
  update: (old: T | null) => T,
): Promise<T> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const old = await store.read<T>(key);
    const next = update(old?.value ?? null);
    if (old && canonical(next) === canonical(old.value)) return old.value;
    if (await store.cas(key, next, old?.etag ?? null)) return next;
  }
  throw new StorageUnavailable();
}

type BlobStore = Pick<
  ReturnType<typeof getStore>,
  "getWithMetadata" | "setJSON" | "list"
>;
const validEtag = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0 && value.length < 512;
export class VerifiedBlobs implements DurableStore {
  constructor(private readonly store: BlobStore) {}
  async read<T>(key: string): Promise<Stored<T> | null> {
    const item = await this.store.getWithMetadata(key, {
      type: "json",
      consistency: "strong",
    });
    if (!item) return null;
    if (!validEtag(item.etag)) throw new StorageUnavailable();
    return { value: item.data as T, etag: item.etag };
  }
  async cas(
    key: string,
    value: unknown,
    etag: string | null,
  ): Promise<boolean> {
    const written = await this.store.setJSON(
      key,
      value,
      etag === null ? { onlyIfNew: true } : { onlyIfMatch: etag },
    );
    if (!written.modified) return false;
    // Do not trust modified:true: SDK issue #741 reports this on some 5xx failures.
    if (!validEtag(written.etag)) throw new StorageUnavailable();
    const readback = await this.read(key);
    if (
      !readback ||
      readback.etag !== written.etag ||
      canonical(readback.value) !== canonical(value)
    )
      throw new StorageUnavailable();
    return true;
  }
  async keys(prefix: string, max = 500): Promise<string[]> {
    const keys: string[] = [];
    for await (const page of this.store.list({ prefix, paginate: true })) {
      for (const blob of page.blobs) {
        if (!blob.key.startsWith(prefix)) throw new StorageUnavailable();
        keys.push(blob.key);
        if (keys.length > max)
          throw new Error("Inbox capacity requires operator review.");
      }
    }
    return keys.sort();
  }
}
export function productionStore(): DurableStore {
  return new VerifiedBlobs(
    getStore({ name: "mccann-operations-bridge-v1", consistency: "strong" }),
  );
}
