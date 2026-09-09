import { useState } from "react";
import { Link } from "react-router-dom";
import type { Store } from "../domain/types";
import type { useMeetingInbox } from "../useMeetingInbox";

export function Meetings({
  store,
  inbox,
}: {
  store: Store;
  inbox: ReturnType<typeof useMeetingInbox>;
}) {
  const [key, setKey] = useState("");
  const [rememberDevice, setRememberDevice] = useState(false);
  const meetings = store.sessions
    .filter((session) => session.intake && !session.archived)
    .sort(
      (a, b) =>
        Date.parse(b.intake!.packet.startsAt) -
        Date.parse(a.intake!.packet.startsAt),
    );
  return (
    <div className="settings-page meetings-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">BEFORE THE CALL</span>
          <h1>Prepared meetings</h1>
          <p className="muted">
            Assessment answers, business context, and useful questions in one
            place.
          </p>
        </div>
      </div>
      <section className="panel">
        <h2>Booking connection</h2>
        {inbox.state === "unavailable" ? (
          <>
            <p>
              The connection is prepared locally. Hosting and GoHighLevel setup
              are still pending.
            </p>
            <Link className="button secondary" to="/assessment">
              Preview the assessment
            </Link>
          </>
        ) : inbox.state === "locked" ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const accessKey = key;
              setKey("");
              setRememberDevice(false);
              void inbox.connect(accessKey, rememberDevice);
            }}
          >
            <p>
              Sign in to bring booked calls and their assessment answers into
              this browser.
            </p>
            <label className="field">
              Meeting inbox access key
              <input
                type="password"
                value={key}
                onChange={(event) => setKey(event.target.value)}
                autoComplete="current-password"
                required
                maxLength={512}
              />
            </label>
            <label className="check-label">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(event) => setRememberDevice(event.target.checked)}
                aria-describedby="remember-device-hint"
                disabled={inbox.busy}
              />
              Remember this device for 30 days
            </label>
            <p className="muted" id="remember-device-hint">
              Use only on your own computer. Leave unchecked for an 8-hour
              connection.
            </p>
            <button
              className="button primary"
              disabled={inbox.busy || !key.trim()}
            >
              Connect meetings
            </button>
          </form>
        ) : (
          <p>
            {inbox.state === "checking"
              ? "Checking the booking connection…"
              : inbox.state === "connected"
                ? "Connected. Booked calls are imported when you open this workspace."
                : "The latest meeting check could not be completed."}
          </p>
        )}
        <div className="actions">
          <button
            className="button secondary"
            onClick={() => void inbox.refresh()}
            disabled={inbox.busy}
          >
            {inbox.busy ? "Checking…" : "Check for meetings"}
          </button>
          {!["locked", "checking"].includes(inbox.state) && (
            <button
              className="button secondary"
              onClick={() => void inbox.disconnect()}
              disabled={inbox.busy}
            >
              Sign out
            </button>
          )}
        </div>
        {inbox.notice && (
          <p role={inbox.state === "error" ? "alert" : "status"}>
            {inbox.notice}
          </p>
        )}
        {inbox.state === "connected" && inbox.crmNotice && (
          <p role="status"><strong>CRM enrichment: </strong>{inbox.crmNotice}</p>
        )}
      </section>
      <section className="panel">
        <h2>Meetings in this workspace</h2>
        {!meetings.length ? (
          <p className="muted">
            Your prepared calls will appear here once the connection is active.
          </p>
        ) : (
          <ul className="meeting-list">
            {meetings.map((session) => (
              <li key={session.id}>
                <div>
                  <strong>
                    {session.client.business || "Untitled business"}
                  </strong>
                  <p className="muted">
                    {session.client.contact} ·{" "}
                    {new Intl.DateTimeFormat("en-CA", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: session.intake!.packet.timezone,
                    }).format(new Date(session.intake!.packet.startsAt))}{" "}
                    ({session.intake!.packet.timezone})
                  </p>
                  <span>{session.intake!.packet.bookingStatus}</span>
                </div>
                <Link
                  className="button secondary"
                  to={`/audit/${session.id}/worksheet`}
                >
                  Open prepared audit
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
