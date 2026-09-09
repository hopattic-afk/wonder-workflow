import { storeSchema } from "./validation";
import type { Store } from "./types";
import { DEFAULT_ACCENT, LEGACY_DEFAULT_ACCENT } from "./constants";

export const STORAGE_KEY = "mccann-ai-operations-audit:v1";
export const MAX_IMPORT_BYTES = 25_000_000;
type LocalStore = Pick<Storage, "getItem" | "setItem">;
export function parseImport(text: string): Store {
  if (
    typeof text !== "string" ||
    text.length > MAX_IMPORT_BYTES ||
    new TextEncoder().encode(text).byteLength > MAX_IMPORT_BYTES
  )
    throw new Error("Import is too large. Maximum backup size is 25 MB.");
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON. Choose an exported audit backup.");
  }
  const result = storeSchema.safeParse(data);
  if (!result.success)
    throw new Error(
      `Invalid audit backup: ${result.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join(".") || "data"}: ${i.message}`)
        .join("; ")}`,
    );
  // Refresh the original brand preset while retaining custom colors and audit inputs.
  if (result.data.settings.accent.toUpperCase() === LEGACY_DEFAULT_ACCENT) {
    result.data.settings.accent = DEFAULT_ACCENT;
  }
  return result.data;
}
export function exportStore(store: Store): string {
  const text = JSON.stringify(storeSchema.parse(store), null, 2);
  if (new TextEncoder().encode(text).byteLength > MAX_IMPORT_BYTES)
    throw new Error(
      "Backup exceeds the 25 MB import limit. Reduce stored data before exporting.",
    );
  return text;
}
export function loadStore(storage?: LocalStore): Store | null {
  const raw = (storage ?? window.localStorage).getItem(STORAGE_KEY);
  return raw === null ? null : parseImport(raw);
}
export function saveStore(store: Store, storage?: LocalStore): void {
  // Validate and serialize before the sole write; failures preserve the existing backup.
  const serialized = exportStore(store);
  (storage ?? window.localStorage).setItem(STORAGE_KEY, serialized);
}
