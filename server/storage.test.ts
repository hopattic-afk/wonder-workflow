// @vitest-environment node
import { describe, it, expect } from "vitest";
import { VerifiedBlobs, StorageUnavailable, immutable } from "./storage";
import { MemoryStore } from "./testing";
describe("verified blob writes", () => {
  it("requires both a valid ETag and matching strong readback despite modified:true", async () => {
    for (const scenario of [
      { write: { modified: true, etag: "" }, read: null },
      { write: { modified: true }, read: { data: { v: 1 }, etag: "a" } },
      {
        write: { modified: true, etag: "a" },
        read: { data: { v: 2 }, etag: "a" },
      },
      {
        write: { modified: true, etag: "a" },
        read: { data: { v: 1 }, etag: "b" },
      },
      { write: { modified: true, etag: "a" }, read: null },
    ]) {
      const adapter = new VerifiedBlobs({
        setJSON: async () => scenario.write,
        getWithMetadata: async () => scenario.read,
        list: async () => ({ blobs: [] }),
      } as never);
      await expect(adapter.cas("key", { v: 1 }, null)).rejects.toBeInstanceOf(
        StorageUnavailable,
      );
    }
  });
  it("uses onlyIfNew and onlyIfMatch, returns false on conflicts, and verifies content", async () => {
    let options: unknown;
    const adapter = new VerifiedBlobs({
      setJSON: async (_k: string, _v: unknown, o: unknown) => {
        options = o;
        return { modified: true, etag: "a" };
      },
      getWithMetadata: async () => ({ data: { v: 1 }, etag: "a" }),
      list: async () => ({ blobs: [] }),
    } as never);
    expect(await adapter.cas("key", { v: 1 }, null)).toBe(true);
    expect(options).toEqual({ onlyIfNew: true });
    expect(await adapter.cas("key", { v: 1 }, "old")).toBe(true);
    expect(options).toEqual({ onlyIfMatch: "old" });
    const conflict = new VerifiedBlobs({
      setJSON: async () => ({ modified: false }),
      getWithMetadata: async () => null,
      list: async () => ({ blobs: [] }),
    } as never);
    expect(await conflict.cas("key", {}, null)).toBe(false);
  });
  it("does not replace an immutable value under the same key", async () => {
    const store = new MemoryStore();
    await immutable(store, "key", { value: "original" });
    await immutable(store, "key", { value: "original" });
    await expect(
      immutable(store, "key", { value: "different" }),
    ).rejects.toThrow("Conflicting");
    expect((await store.read<{ value: string }>("key"))?.value.value).toBe(
      "original",
    );
  });
});
