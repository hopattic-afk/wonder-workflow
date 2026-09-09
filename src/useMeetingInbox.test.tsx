import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useMeetingInbox } from "./useMeetingInbox";
import { defaultSettings } from "./domain/defaults";
import type { Store } from "./domain/types";
import fixture from "../docs/examples/prepared-meeting.example.json";
import { meetingIdentity } from "./domain/meetingIdentity";

const empty = (): Store => ({
  version: 1,
  settings: defaultSettings(),
  sessions: [],
  lastSaved: null,
  lastExport: null,
});
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
afterEach(() => vi.unstubAllGlobals());

describe("protected meeting inbox", () => {
  it("shows separate sanitized CRM review counts without blocking saved meeting import", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => json({ packets: [fixture],
      crm_sync: { enabled: true, available: true, synced: 2, pending: 1, review_required: 1,
        private_payload: "must-not-render" } })));
    const update = vi.fn();
    const hook = renderHook(() => useMeetingInbox(empty(), update, false));
    await waitFor(() => expect(hook.result.current.state).toBe("connected"));
    expect(update).toHaveBeenCalledOnce();
    expect(hook.result.current.crmNotice).toContain("2 assessments synchronized");
    expect(hook.result.current.crmNotice).toContain("2 pending or requiring operator review");
    expect(hook.result.current.crmNotice).not.toContain("must-not-render");
    expect(hook.result.current.notice).toContain("meeting");
  });
  it("treats malformed CRM counts as review without losing saved meetings", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ packets: [],
      crm_sync: { enabled: true, available: true, synced: "private-text", pending: 0, review_required: 0 } })));
    const hook = renderHook(() => useMeetingInbox(empty(), vi.fn(), false));
    await waitFor(() => expect(hook.result.current.state).toBe("connected"));
    expect(hook.result.current.crmNotice).toContain("status needs review");
    expect(hook.result.current.crmNotice).not.toContain("private-text");
  });
  it("does not resurrect a deleted imported meeting", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(json({ packets: [fixture] })),
    );
    const store = { ...empty(), dismissedMeetings: [meetingIdentity(fixture)] };
    const update = vi.fn();
    const hook = renderHook(() => useMeetingInbox(store, update, false));
    await waitFor(() => expect(hook.result.current.state).toBe("connected"));
    expect(update).not.toHaveBeenCalled();
  });
  it("imports on opening with no polling and replays without duplicates", async () => {
    const fetcher = vi
      .fn()
      .mockImplementation(async () => json({ packets: [fixture] }));
    vi.stubGlobal("fetch", fetcher);
    let saved = empty();
    const update = vi.fn((next: Store) => {
      saved = next;
    });
    const hook = renderHook(
      ({ store }) => useMeetingInbox(store, update, false),
      { initialProps: { store: saved } },
    );
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    hook.rerender({ store: saved });
    await act(() => hook.result.current.refresh());
    expect(update).toHaveBeenCalledTimes(1);
    expect(saved.sessions).toHaveLength(1);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("uses edits made while a request is in flight", async () => {
    let resolve!: (response: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((r) => {
            resolve = r;
          }),
      ),
    );
    const update = vi.fn();
    const hook = renderHook(
      ({ store }) => useMeetingInbox(store, update, false),
      { initialProps: { store: empty() } },
    );
    const revised = empty();
    revised.settings.consultant = "Edited during fetch";
    hook.rerender({ store: revised });
    await act(async () => resolve(json({ packets: [fixture] })));
    await waitFor(() => expect(update).toHaveBeenCalled());
    expect(update.mock.calls[0][0].settings.consultant).toBe(
      "Edited during fetch",
    );
  });

  it("rejects the whole batch when a later page is invalid", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          json({ packets: [fixture], next_cursor: "page2" }),
        )
        .mockResolvedValueOnce(
          json({ packets: [{ ...fixture, locationId: "wrong" }] }),
        ),
    );
    const update = vi.fn();
    const hook = renderHook(() => useMeetingInbox(empty(), update, false));
    await waitFor(() => expect(hook.result.current.state).toBe("error"));
    expect(update).not.toHaveBeenCalled();
  });

  it("does not import while storage is blocked", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(json({ packets: [fixture] })),
    );
    const update = vi.fn();
    const hook = renderHook(() => useMeetingInbox(empty(), update, true));
    await waitFor(() => expect(hook.result.current.state).toBe("error"));
    expect(update).not.toHaveBeenCalled();
  });

  it.each([undefined, false, true])(
    "sends remember-device choice %j without persisting the access key",
    async (rememberDevice) => {
      const fetcher = vi
        .fn()
        .mockResolvedValueOnce(json({}, 401))
        .mockResolvedValueOnce(json({ ok: true }))
        .mockResolvedValueOnce(json({ packets: [] }));
      vi.stubGlobal("fetch", fetcher);
      const persist = vi.spyOn(Storage.prototype, "setItem");
      const hook = renderHook(() => useMeetingInbox(empty(), vi.fn(), false));
      await waitFor(() => expect(hook.result.current.state).toBe("locked"));
      await act(() =>
        hook.result.current.connect("fictional-test-key", rememberDevice),
      );
      expect(hook.result.current.state).toBe("connected");
      expect(fetcher.mock.calls[1][1].credentials).toBe("same-origin");
      expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({
        access_key: "fictional-test-key",
        remember_device: rememberDevice ?? false,
      });
      expect(persist).not.toHaveBeenCalled();
    },
  );

  it("treats the static preview as unavailable without importing data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("<html>app</html>", {
          headers: { "Content-Type": "text/html" },
        }),
      ),
    );
    const update = vi.fn();
    const hook = renderHook(() => useMeetingInbox(empty(), update, false));
    await waitFor(() => expect(hook.result.current.state).toBe("unavailable"));
    expect(update).not.toHaveBeenCalled();
  });
});
