import { act, renderHook } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { useStore } from "./useStore";
import { STORAGE_KEY } from "./domain/storage";
describe("browser autosave lifecycle", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());
  it("debounces input and restores a complete session on reopening", () => {
    const hook = renderHook(() => useStore());
    act(() =>
      hook.result.current.update((s) => ({
        ...s,
        sessions: s.sessions.map((a) => ({
          ...a,
          client: { ...a.client, business: "Saved test business" },
        })),
      })),
    );
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    act(() => vi.advanceTimersByTime(500));
    expect(hook.result.current.saving).toBe(false);
    expect(hook.result.current.lastSaved).not.toBeNull();
    hook.unmount();
    const restored = renderHook(() => useStore());
    expect(restored.result.current.store.sessions[0].client.business).toBe(
      "Saved test business",
    );
  });
  it("flushes pending input on pagehide before the debounce", () => {
    const { result } = renderHook(() => useStore());
    act(() => result.current.update((s) => ({ ...s, sessions: [] })));
    act(() => window.dispatchEvent(new Event("pagehide")));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).sessions).toEqual([]);
  });
  it("preserves pending edits when public navigation unmounts the console", () => {
    const hook = renderHook(() => useStore());
    act(() => hook.result.current.update((s) => ({
      ...s, sessions: s.sessions.map((item) => ({
        ...item, client: { ...item.client, business: "Before navigation" },
      })),
    })));
    hook.unmount();
    const reopened = renderHook(() => useStore());
    expect(reopened.result.current.store.sessions[0].client.business).toBe("Before navigation");
  });
  it("does not flush over another tab's data on console unmount", () => {
    const hook = renderHook(() => useStore());
    act(() => vi.advanceTimersByTime(500));
    const original = localStorage.getItem(STORAGE_KEY);
    act(() => hook.result.current.update((s) => ({ ...s, sessions: [] })));
    act(() => window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY })));
    hook.unmount();
    expect(localStorage.getItem(STORAGE_KEY)).toBe(original);
  });
  it("keeps corrupt stored data intact until explicit recovery", () => {
    localStorage.setItem(STORAGE_KEY, "broken-json");
    const { result } = renderHook(() => useStore());
    act(() => vi.advanceTimersByTime(600));
    expect(result.current.error).toContain("could not be loaded");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("broken-json");
  });
  it("pauses writes on a cross-tab conflict", () => {
    const { result } = renderHook(() => useStore());
    act(() => vi.advanceTimersByTime(500));
    const original = localStorage.getItem(STORAGE_KEY);
    act(() =>
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: STORAGE_KEY,
          newValue: "another-tab",
        }),
      ),
    );
    act(() => result.current.update((s) => ({ ...s, sessions: [] })));
    act(() => vi.advanceTimersByTime(600));
    expect(result.current.error).toContain("Another tab");
    expect(localStorage.getItem(STORAGE_KEY)).toBe(original);
  });
  it("reports quota failures without claiming a save", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage quota exceeded", "QuotaExceededError");
    });
    const { result } = renderHook(() => useStore());
    act(() => vi.advanceTimersByTime(500));
    expect(result.current.error).toContain("Not saved");
    expect(result.current.lastSaved).toBeNull();
  });
});
