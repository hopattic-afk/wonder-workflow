import { useState } from "react";
import {
  Link,
  NavLink,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  LayoutDashboard,
  SlidersHorizontal,
  ShieldCheck,
  ChevronRight,
  Download,
  ArrowLeft,
  MessageSquare,
  CheckCircle2,
  Circle,
  AlertTriangle,
  CalendarDays,
} from "lucide-react";
import { useStore } from "./useStore";
import { newSession } from "./domain/defaults";
import { exportStore } from "./domain/storage";
import { riskWarnings } from "./domain/calculations";
import { STATUSES, type Session, type Store } from "./domain/types";
import { Dashboard } from "./pages/Dashboard";
import { Worksheet } from "./pages/Worksheet";
import { Calculator } from "./pages/Calculator";
import { Documents } from "./pages/Documents";
import { SettingsPage } from "./pages/Settings";
import { Timer } from "./components/Timer";
import { Meetings } from "./pages/Meetings";
import { useMeetingInbox } from "./useMeetingInbox";
import { meetingIdentity } from "./domain/meetingIdentity";
export function downloadText(text: string, filename: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
type Manager = ReturnType<typeof useStore>;
export default function App() {
  const manager = useStore();
  const { store, update } = manager;
  const inbox = useMeetingInbox(store, update, !!manager.blocked);
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  function changeSession(session: Session) {
    update((old) => ({
      ...old,
      sessions: old.sessions.map((s) =>
        s.id === session.id
          ? { ...session, updatedAt: new Date().toISOString() }
          : s,
      ),
    }));
  }
  function create() {
    const session = newSession(
      store.settings,
      new URLSearchParams(window.location.search),
    );
    update({ ...store, sessions: [session, ...store.sessions] });
    navigate(`/audit/${session.id}/worksheet`, {
      replace: !!window.location.search,
    });
  }
  function duplicate(source: Session) {
    const session = structuredClone(source);
    const now = new Date().toISOString();
    session.id = crypto.randomUUID();
    delete session.intake;
    session.client.business = `${source.client.business || "Untitled business"} (copy)`;
    session.createdAt = now;
    session.updatedAt = now;
    session.archived = false;
    session.status = source.proposal.generatedAt
      ? "Proposal Draft"
      : "Audit In Progress";
    session.timer = {
      ...session.timer,
      runningSince: null,
      remainingSeconds: 1800,
    };
    session.proposal.clientSignName = "";
    session.proposal.clientSignDate = "";
    session.proposal.representativeDate = "";
    update({ ...store, sessions: [session, ...store.sessions] });
    navigate(
      `/audit/${session.id}/${source.proposal.generatedAt ? "proposal" : "worksheet"}`,
    );
    setMessage("Audit duplicated with an independent proposal.");
  }
  function remove(session: Session) {
    if (
      !confirm(
        `Permanently delete “${session.client.business || "Untitled business"}” and its audit, recommendation, and proposal? This cannot be undone. Export a backup first if needed.`,
      )
    )
      return;
    update({
      ...store,
      sessions: store.sessions.filter((s) => s.id !== session.id),
      dismissedMeetings: session.intake
        ? [
            ...new Set([
              ...(store.dismissedMeetings ?? []),
              meetingIdentity(session.intake.packet),
            ]),
          ]
        : store.dismissedMeetings,
    });
    setMessage("Audit permanently deleted from this workspace.");
  }
  function exportData(session?: Session) {
    const now = new Date().toISOString();
    try {
      const payload: Store = {
        ...store,
        lastSaved: manager.lastSaved,
        sessions: session ? [session] : store.sessions,
        lastExport: session ? store.lastExport : now,
      };
      downloadText(
        exportStore(payload),
        `mccann-${session ? "audit-" + session.id : "workspace"}-${now.slice(0, 10)}.json`,
      );
      if (!session) update({ ...store, lastExport: now });
      setMessage(
        session
          ? "Audit export downloaded."
          : "Full workspace backup downloaded.",
      );
    } catch (error) {
      setMessage(
        `Export failed: ${error instanceof Error ? error.message : "Check the current fields."}`,
      );
    }
  }
  const backupDue =
    !store.lastExport ||
    Date.now() - new Date(store.lastExport).getTime() > 7 * 86400000;
  return (
    <div
      className="app"
      style={{ "--gold": store.settings.accent } as React.CSSProperties}
    >
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <aside className="sidebar no-print">
        <Link className="brand" to="/workspace" aria-label="Operations Audit dashboard">
          <div className="brand-mark">
            O<span>A</span>
          </div>
          <div>
            <strong>OPERATIONS</strong>
            <span>AUDIT</span>
          </div>
        </Link>
        <div className="sidebar-divider" />
        <div className="sidebar-service">AUDIT CONSOLE</div>
        <nav aria-label="Main navigation">
          <NavLink to="/workspace" end>
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>
          <NavLink to="/settings">
            <SlidersHorizontal size={18} />
            Settings & backup
          </NavLink>
          <NavLink to="/meetings">
            <CalendarDays size={18} />
            Prepared meetings
          </NavLink>
        </nav>
        <div className="sidebar-guide">
          <span className="eyebrow">THE AUDIT WORKFLOW</span>
          <ol>
            <li>Understand the work</li>
            <li>Calculate the opportunity</li>
            <li>Recommend a first pilot</li>
            <li>Define a clear scope</li>
          </ol>
        </div>
        <div className="local-badge">
          <ShieldCheck size={18} />
          <div>
            <strong>Private by design</strong>
            <span>Call notes saved in this browser</span>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar no-print">
          <span>Operations Audit Console</span>
          <div>
            <span className="live-dot" />
            INTERNAL WORKSPACE <span className="version">V1.0</span>
          </div>
        </header>
        {manager.error && (
          <div
            className="notice danger persistence-notice no-print"
            role="alert"
          >
            <AlertTriangle size={18} />
            <span>{manager.error}</span>
            <button
              className="button small secondary"
              onClick={() => exportData()}
            >
              Export current work
            </button>
            {manager.blocked && (
              <button
                className="button small secondary"
                onClick={() => window.location.reload()}
              >
                Reload saved copy
              </button>
            )}
          </div>
        )}
        {message && (
          <div className="toast no-print" role="status">
            {message}
            <button
              className="text-button"
              aria-label="Dismiss notification"
              onClick={() => setMessage("")}
            >
              ×
            </button>
          </div>
        )}
        <main id="main-content">
          <Routes>
            <Route
              path="/meetings"
              element={<Meetings store={store} inbox={inbox} />}
            />
            <Route
              path={window.location.pathname === "/" ? "/" : "/workspace"}
              element={
                <Dashboard
                  store={store}
                  onCreate={create}
                  onDuplicate={duplicate}
                  onChange={changeSession}
                  onDelete={remove}
                  onExport={exportData}
                />
              }
            />
            <Route
              path="/settings"
              element={
                <SettingsPage
                  store={store}
                  onChange={update}
                  onReplace={manager.replace}
                  onExport={() => exportData()}
                  lastSaved={manager.lastSaved}
                  blocked={!!manager.blocked}
                />
              }
            />
            <Route
              path="/audit/:id/:view"
              element={
                <ClientWorkspace
                  manager={manager}
                  onChange={changeSession}
                  onDuplicate={duplicate}
                  onExport={exportData}
                />
              }
            />
            <Route
              path="*"
              element={
                <div className="empty-state">
                  <h1>Page not found</h1>
                  <Link to="/workspace" className="button primary">
                    Return to dashboard
                  </Link>
                </div>
              }
            />
          </Routes>
        </main>
        <footer className="privacy-footer no-print">
          <ShieldCheck size={15} />
          <p>
            Client information is stored in this browser. Do not enter
            passwords, API keys, or unnecessary sensitive records.
          </p>
          {backupDue && (
            <button className="text-button gold" onClick={() => exportData()}>
              Backup recommended <Download size={13} />
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
function ClientWorkspace({
  manager,
  onChange,
  onDuplicate,
  onExport,
}: {
  manager: Manager;
  onChange: (s: Session) => void;
  onDuplicate: (s: Session) => void;
  onExport: (s: Session) => void;
}) {
  const { id, view } = useParams();
  const session = manager.store.sessions.find((s) => s.id === id);
  const [notesOpen, setNotesOpen] = useState(false);
  if (!session)
    return (
      <div className="empty-state">
        <h1>Audit not found</h1>
        <p>This session may have been deleted or belongs to another browser.</p>
        <Link to="/workspace" className="button primary">
          Return to dashboard
        </Link>
      </div>
    );
  const steps = [
    ["worksheet", "Audit"],
    ["calculator", "Calculator"],
    ["recommendation", "Recommendation"],
    ["proposal", "Proposal"],
  ];
  return (
    <div className="client-workspace">
      <div className="client-summary no-print">
        <div className="client-identity">
          <Link
            className="back-link"
            to="/workspace"
            aria-label="Back to client dashboard"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2>
              {session.client.business || "Untitled business"}
              {session.demo && <span className="demo-tag">Demo Data</span>}
            </h2>
            <p>
              {session.client.contact || "Contact not established"}
              <span>·</span>
              {session.client.auditDate || "Date not established"}
              <span>·</span>
              {session.client.currency}
            </p>
          </div>
        </div>
        <div className="summary-actions">
          <label className="sr-only" htmlFor="audit-status">
            Audit status
          </label>
          <select
            id="audit-status"
            value={session.status}
            onChange={(e) =>
              onChange({
                ...session,
                status: e.target.value as Session["status"],
              })
            }
          >
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <div
            className={`save-status ${manager.error ? "danger-text" : ""}`}
            role="status"
          >
            {manager.error ? (
              <AlertTriangle size={13} />
            ) : manager.saving ? (
              <Circle size={13} />
            ) : (
              <CheckCircle2 size={13} />
            )}
            <span>
              {manager.error
                ? "Not saved"
                : manager.saving
                  ? "Saving…"
                  : "Saved locally"}
            </span>
          </div>
          <button
            className="icon-button"
            aria-label="Export this audit"
            onClick={() => onExport(session)}
          >
            <Download size={17} />
          </button>
        </div>
      </div>
      <div className="step-bar no-print">
        <nav aria-label="Audit steps">
          {steps.map(([path, label], i) => (
            <NavLink key={path} to={`/audit/${id}/${path}`}>
              <span className="step-number">{i + 1}</span>
              {label}
              {i < 3 && <ChevronRight className="step-chevron" size={14} />}
            </NavLink>
          ))}
        </nav>
        <Timer session={session} onChange={onChange} />
      </div>
      <div className="workspace-content">
        {view === "calculator" &&
          riskWarnings(session).filter((w) => w.hardStop).length > 0 && (
            <div
              className="notice danger calculator-risk no-print"
              role="alert"
            >
              <AlertTriangle size={16} />
              <div>
                <strong>Human review and scope checks</strong>
                {riskWarnings(session)
                  .filter((w) => w.hardStop)
                  .map((w) => (
                    <p key={w.code}>{w.message}</p>
                  ))}
              </div>
            </div>
          )}
        {view === "worksheet" ? (
          <Worksheet key={id} session={session} onChange={onChange} />
        ) : view === "calculator" ? (
          <Calculator key={id} session={session} onChange={onChange} />
        ) : view === "recommendation" || view === "proposal" ? (
          <Documents
            key={`${id}-${view}`}
            kind={view}
            session={session}
            settings={manager.store.settings}
            onChange={onChange}
            onDuplicate={() => onDuplicate(session)}
          />
        ) : (
          <div className="empty-state">
            <h1>Section not found</h1>
            <Link to={`/audit/${id}/worksheet`}>Return to audit</Link>
          </div>
        )}
      </div>
      <div className={`call-notes no-print ${notesOpen ? "open" : ""}`}>
        <button
          className="notes-toggle"
          onClick={() => setNotesOpen(!notesOpen)}
          aria-expanded={notesOpen}
          aria-controls="call-notes-panel"
        >
          <MessageSquare size={16} />
          Call notes{session.callNotes && <span className="notes-dot" />}
          <span>{notesOpen ? "−" : "+"}</span>
        </button>
        {notesOpen && (
          <div id="call-notes-panel">
            <label htmlFor="call-notes-input">
              Notes for this conversation · internal only
            </label>
            <textarea
              id="call-notes-input"
              value={session.callNotes}
              maxLength={12000}
              rows={7}
              onChange={(e) =>
                onChange({ ...session, callNotes: e.target.value })
              }
              placeholder="Capture a question, a detail, or the agreed next step…"
            />
            <small>
              Saved with this audit. Excluded from client documents.
            </small>
          </div>
        )}
      </div>
    </div>
  );
}
