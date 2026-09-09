import { useCallback, useEffect, useRef, useState } from "react";
import type { Store } from "./domain/types";
import { defaultSettings, demoSession } from "./domain/defaults";
import { loadStore, saveStore, STORAGE_KEY } from "./domain/storage";
export function useStore() {
  const [initial] = useState(() => {
    try {
      const found = loadStore();
      const settings = defaultSettings();
      return {
        data: found ?? {
          version: 1 as const,
          settings,
          sessions: [demoSession(settings)],
          lastExport: null,
          lastSaved: null,
        },
        error: "",
      };
    } catch (error) {
      return {
        data: {
          version: 1 as const,
          settings: defaultSettings(),
          sessions: [],
          lastExport: null,
          lastSaved: null,
        },
        error: `Local data could not be loaded. ${error instanceof Error ? error.message : "Browser storage is unavailable."} The saved copy has not been changed.`,
      };
    }
  });
  const [store, setStore] = useState<Store>(initial.data);
  const [blocked, setBlocked] = useState(initial.error);
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(store.lastSaved);
  const latest = useRef(store);
  latest.current = store;
  const blockedRef = useRef(blocked);
  blockedRef.current = blocked;
  const dirty = useRef(!store.lastSaved && !initial.error);
  const flush = useCallback(() => {
    if (!dirty.current || blockedRef.current) return;
    try {
      const timestamp = new Date().toISOString();
      saveStore({ ...latest.current, lastSaved: timestamp });
      dirty.current = false;
      setLastSaved(timestamp);
      setSaving(false);
      setSaveError("");
    } catch (error) {
      setSaving(false);
      setSaveError(
        `Not saved: ${error instanceof Error ? error.message : "Browser storage is full or unavailable."} Export a backup before leaving.`,
      );
    }
  }, []);
  useEffect(() => {
    if (blocked) return;
    setSaving(dirty.current);
    const id = setTimeout(flush, 450);
    return () => clearTimeout(id);
  }, [store, blocked, flush]);
  useEffect(() => {
    const before = (event: BeforeUnloadEvent) => {
      flush();
      if (dirty.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const changed = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) {
        const warning =
          "Another tab changed local data. Export this tab’s work, then reload to use the latest saved copy. Saving is paused to prevent overwriting it.";
        blockedRef.current = warning;
        setBlocked(warning);
      }
    };
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", before);
    window.addEventListener("storage", changed);
    return () => {
      // Public-site navigation can unmount the console without a pagehide event.
      flush();
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", before);
      window.removeEventListener("storage", changed);
    };
  }, [flush]);
  const update = useCallback((change: Store | ((old: Store) => Store)) => {
    setStore((old) => {
      const next = typeof change === "function" ? change(old) : change;
      latest.current = next;
      return next;
    });
    dirty.current = true;
    setSaving(true);
  }, []);
  const replace = useCallback(
    (next: Store) => {
      blockedRef.current = "";
      setBlocked("");
      setSaveError("");
      update(next);
    },
    [update],
  );
  return {
    store,
    update,
    replace,
    flush,
    lastSaved,
    saving,
    blocked,
    error: blocked || saveError,
  };
}
