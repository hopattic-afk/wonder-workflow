import { useState } from "react";
import { Link } from "react-router-dom";
import {
  applyIntakePacket,
  parseIntakePacket,
  MAX_INTAKE_BYTES,
} from "../domain/intake";
import type { IntakePacket } from "../domain/intakeSchema";
import type { Store } from "../domain/types";

export function BookingImport({
  store,
  onChange,
  blocked = false,
}: {
  store: Store;
  onChange: (next: Store) => void;
  blocked?: boolean;
}) {
  const [pending, setPending] = useState<IntakePacket | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [sessionId, setSessionId] = useState("");
  async function read(file?: File) {
    if (!file) return;
    setPending(null);
    setNotice("");
    setSessionId("");
    try {
      if (file.size > MAX_INTAKE_BYTES)
        throw new Error("Use a meeting file smaller than 512 KB.");
      const packet = parseIntakePacket(await file.text());
      setPending(packet);
      setError("");
    } catch (e) {
      setError(
        `Meeting file rejected. ${e instanceof Error ? e.message : "Invalid file."}`,
      );
    }
  }
  function apply() {
    if (!pending || blocked) return;
    try {
      const result = applyIntakePacket(store, pending);
      if (result.outcome === "created" || result.outcome === "updated")
        onChange(result.store);
      setSessionId(result.sessionId);
      setNotice(
        result.outcome === "duplicate"
          ? "This meeting information is already in your workspace."
          : result.outcome === "stale"
            ? "This file is older than the saved meeting information. Your audit was kept."
            : `Meeting information ${result.outcome === "created" ? "added" : "updated"}.${result.conflicts.length ? " Your edits were kept; review the incoming changes in Before the call." : ""}`,
      );
      setPending(null);
      setError("");
    } catch (e) {
      setError(
        `Import was not applied. ${e instanceof Error ? e.message : "Check the meeting file."}`,
      );
    }
  }
  return (
    <section className="panel booking-import">
      <h2>Meeting file import</h2>
      <p className="muted">
        Use Prepared meetings for the booking connection. You can also import a
        prepared meeting file here during setup or recovery.
      </p>
      <details className="optional-details">
        <summary>Test a prepared meeting file</summary>
        <div>
          <p className="muted">
            Load a meeting file during setup to review its answers and prefill
            an audit locally. Existing call notes, pricing, and document edits
            are preserved.
          </p>
          <label className="field" htmlFor="meeting-import">
            Prepared meeting file (JSON, up to 512 KB)
            <input
              id="meeting-import"
              type="file"
              accept="application/json,.json"
              disabled={blocked}
              onChange={(e) => {
                void read(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          {blocked && (
            <p className="notice danger">
              Resolve the workspace storage warning before importing meeting
              information.
            </p>
          )}
          {error && (
            <p role="alert" className="notice danger">
              {error}
            </p>
          )}
          {pending && (
            <div className="import-preview">
              <h3>Review meeting information</h3>
              <p>
                {pending.contact?.business ||
                  pending.contact?.name ||
                  "Discovery call"}
              </p>
              <p className="muted">
                {new Intl.DateTimeFormat(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: pending.timezone,
                }).format(new Date(pending.startsAt))}{" "}
                · {pending.timezone}
              </p>
              <p>
                {pending.assessment
                  ? `${pending.assessment.answers.length} original assessment answers`
                  : "Assessment missing — no answers will be invented"}
              </p>
              <div className="inline-actions">
                <button
                  className="button primary small"
                  onClick={apply}
                  disabled={blocked}
                >
                  Add or update audit
                </button>
                <button
                  className="text-button"
                  onClick={() => setPending(null)}
                >
                  Cancel meeting import
                </button>
              </div>
            </div>
          )}
          {notice && (
            <p role="status" className="notice">
              {notice}
            </p>
          )}
          {sessionId && (
            <Link
              className="button secondary"
              to={`/audit/${sessionId}/worksheet`}
            >
              Open prepared audit
            </Link>
          )}
        </div>
      </details>
    </section>
  );
}
