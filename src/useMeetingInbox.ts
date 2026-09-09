import { useCallback, useEffect, useRef, useState } from "react";
import { applyIntakePacket, parseIntakePacket } from "./domain/intake";
import type { IntakePacket } from "./domain/intakeSchema";
import type { Store } from "./domain/types";
import { meetingIdentity } from "./domain/meetingIdentity";

type InboxState = "checking" | "unavailable" | "locked" | "connected" | "error";
const MAX_RESPONSE_BYTES = 10_000_000;

async function readJson(response: Response): Promise<unknown> {
  if (!response.headers.get("content-type")?.includes("application/json"))
    throw new Error("The booking connection is not available at this address.");
  const reader = response.body?.getReader();
  if (!reader)
    throw new Error("The booking connection returned an empty response.");
  const decoder = new TextDecoder();
  let size = 0;
  let body = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_RESPONSE_BYTES)
        throw new Error("The meeting inbox is too large to load safely.");
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
    return JSON.parse(body);
  } finally {
    await reader.cancel();
  }
}

export function useMeetingInbox(
  store: Store,
  onChange: (next: Store) => void,
  blocked: boolean,
) {
  const latest = useRef({ store, onChange, blocked });
  latest.current = { store, onChange, blocked };
  const [state, setState] = useState<InboxState>("checking");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [crmNotice, setCrmNotice] = useState("");
  const active = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    const timeout = setTimeout(() => controller.abort(), 30000);
    setBusy(true);
    setNotice("");
    setCrmNotice("");
    try {
      const packets: IntakePacket[] = [];
      const cursors = new Set<string>();
      let cursor = "";
      let crmSummaryNotice = "";
      do {
        const response = await fetch(
          `/api/inbox${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`,
          {
            credentials: "same-origin",
            cache: "no-store",
            signal: controller.signal,
          },
        );
        if (response.status === 401) {
          setState("locked");
          return;
        }
        if (
          [404, 503].includes(response.status) ||
          !response.headers.get("content-type")?.includes("application/json")
        ) {
          setState("unavailable");
          return;
        }
        if (!response.ok)
          throw new Error(
            "Meetings could not be checked. Try again in a moment.",
          );
        const page = (await readJson(response)) as {
          packets?: unknown;
          next_cursor?: unknown;
          crm_sync?: unknown;
        };
        if (!page || !Array.isArray(page.packets))
          throw new Error("The meeting inbox returned an invalid response.");
        if (!cursor && page.crm_sync && typeof page.crm_sync === "object") {
          const summary = page.crm_sync as Record<string, unknown>;
          if (summary.enabled === false) {
            crmSummaryNotice = "CRM enrichment is not enabled. Saved assessments and booking preparation continue separately.";
          } else if (summary.enabled === true) {
            const counts = [summary.pending, summary.review_required, summary.synced];
            if (summary.available !== true || counts.some((count) =>
              !Number.isSafeInteger(count) || Number(count) < 0 || Number(count) > 500)) {
              crmSummaryNotice = "CRM enrichment status needs review. Saved assessments have not been removed.";
            } else {
              const review = Number(summary.pending) + Number(summary.review_required);
              crmSummaryNotice = `${summary.synced} assessment${summary.synced === 1 ? "" : "s"} synchronized to CRM. ${review
                ? `${review} pending or requiring operator review. Do not resubmit saved assessments; follow the CRM reconciliation runbook.`
                : summary.truncated === true ? "No pending reviews in this sample." : "No pending CRM reviews."} ${summary.truncated === true
                  ? "Only a sample of up to 25 status records was checked; additional records require operator review. " : ""}Assessment capture is tracked separately.`;
            }
          }
        }
        packets.push(...page.packets.map(parseIntakePacket));
        if (packets.length > 2000)
          throw new Error(
            "This inbox needs to be split into smaller batches before importing.",
          );
        cursor = page.next_cursor === undefined ? "" : String(page.next_cursor);
        if (
          cursor &&
          (typeof page.next_cursor !== "string" ||
            cursor.length > 4096 ||
            cursors.has(cursor) ||
            cursors.size >= 50)
        )
          throw new Error(
            "The meeting inbox returned an invalid page sequence.",
          );
        cursors.add(cursor);
      } while (cursor);
      if (controller.signal.aborted) return;
      if (latest.current.blocked)
        throw new Error(
          "Resolve the local storage warning before importing meetings.",
        );
      let next = latest.current.store;
      let changes = 0;
      for (const packet of packets) {
        if (
          next.dismissedMeetings?.includes(meetingIdentity(packet)) &&
          !next.sessions.some(
            (session) =>
              session.intake &&
              meetingIdentity(session.intake.packet) ===
                meetingIdentity(packet),
          )
        )
          continue;
        const result = applyIntakePacket(next, packet);
        next = result.store;
        if (["created", "updated"].includes(result.outcome)) changes++;
      }
      if (changes) latest.current.onChange(next);
      setState("connected");
      setCrmNotice(crmSummaryNotice);
      setNotice(
        changes
          ? `${changes} meeting${changes === 1 ? "" : "s"} prepared. Your call edits were kept.`
          : "Your meetings are up to date.",
      );
    } catch (error) {
      if (active.current !== controller) return;
      setState("error");
      setNotice(
        controller.signal.aborted
          ? "The connection took too long. Your saved audits were kept."
          : error instanceof Error
            ? error.message
            : "Meetings could not be loaded. Your saved audits were kept.",
      );
    } finally {
      clearTimeout(timeout);
      if (active.current === controller) {
        active.current = null;
        setBusy(false);
      }
    }
  }, []);

  useEffect(() => {
    void refresh();
    return () => {
      active.current?.abort();
      active.current = null;
    };
  }, [refresh]);

  async function connect(accessKey: string, rememberDevice = false) {
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/session", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_key: accessKey,
          remember_device: rememberDevice,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok)
        throw new Error(
          response.status === 401
            ? "The access key was not accepted."
            : response.status === 429
              ? "Too many attempts. Wait before trying again."
              : "The booking connection is not available yet.",
        );
      await refresh();
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "The booking connection could not be opened.",
      );
      setBusy(false);
    }
  }

  async function disconnect() {
    active.current?.abort();
    active.current = null;
    setBusy(true);
    try {
      const response = await fetch("/api/session", {
        method: "DELETE",
        credentials: "same-origin",
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok)
        throw new Error("Sign out could not be completed. Try again.");
      setState("locked");
      setNotice(
        "Signed out of the booking connection. Imported audits remain in this browser.",
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Sign out could not be completed.",
      );
    } finally {
      setBusy(false);
    }
  }

  return { state, busy, notice, crmNotice, refresh, connect, disconnect };
}
