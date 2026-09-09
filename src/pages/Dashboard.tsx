import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  ArrowUpRight,
  Copy,
  Archive,
  Trash2,
  FolderOpen,
  ArrowRight,
  Download,
} from "lucide-react";
import { calculate, money } from "../domain/calculations";
import { STATUSES, type Store, type Session } from "../domain/types";
type Props = {
  store: Store;
  onCreate: () => void;
  onDuplicate: (s: Session) => void;
  onChange: (s: Session) => void;
  onDelete: (s: Session) => void;
  onExport: (s?: Session) => void;
};
export function Dashboard({
  store,
  onCreate,
  onDuplicate,
  onChange,
  onDelete,
  onExport,
}: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [archived, setArchived] = useState(false);
  const active = store.sessions.filter((s) => !s.archived);
  const rows = store.sessions
    .filter(
      (s) =>
        s.archived === archived &&
        (!status || s.status === status) &&
        `${s.client.business} ${s.client.contact}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const draftCount = active.filter(
    (s) => s.status === "Recommendation Draft" || s.status === "Proposal Draft",
  ).length;
  return (
    <div className="dashboard">
      <header className="page-heading">
        <div>
          <div className="eyebrow">YOUR OPERATIONS WORKSPACE</div>
          <h1>
            Client audits<span className="gold">.</span>
          </h1>
          <p className="muted">
            Find the repetitive work. Quantify the opportunity. Define the next
            step.
          </p>
        </div>
        <button className="button primary" onClick={onCreate}>
          <Plus size={18} />
          New audit
        </button>
      </header>
      <div className="overview-grid">
        <div className="overview-stat">
          <span>ACTIVE AUDITS</span>
          <strong>{active.length.toString().padStart(2, "0")}</strong>
          <small>Client sessions in progress</small>
        </div>
        <div className="overview-stat">
          <span>READY TO REFINE</span>
          <strong>{draftCount.toString().padStart(2, "0")}</strong>
          <small>Recommendation & proposal drafts</small>
        </div>
        <div className="overview-stat">
          <span>PROPOSALS SENT</span>
          <strong>
            {active
              .filter((s) => s.status === "Proposal Sent")
              .length.toString()
              .padStart(2, "0")}
          </strong>
          <small>Awaiting the next conversation</small>
        </div>
        <div className="overview-stat backup-stat">
          <span>YOUR DATA, YOUR BROWSER</span>
          <strong>
            <FolderOpen size={28} />
            <span>Local only</span>
          </strong>
          <button className="text-button gold" onClick={() => onExport()}>
            Back up workspace <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
      <section className="panel audit-list">
        <div className="panel-heading">
          <div>
            <h2>
              Audit register <span className="count">{rows.length}</span>
            </h2>
            <p className="muted">
              One connected record, from first conversation to signed scope.
            </p>
          </div>
          <label className="check-label">
            <input
              type="checkbox"
              checked={archived}
              onChange={(e) => setArchived(e.target.checked)}
            />
            Show archived
          </label>
        </div>
        <div className="table-tools">
          <label className="search-field">
            <Search size={17} />
            <input
              aria-label="Search audits"
              placeholder="Search business or contact…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <select
            aria-label="Filter by status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="audit-table">
          <div className="audit-table-head">
            <span>BUSINESS / CONTACT</span>
            <span>STAGE</span>
            <span>EST. ANNUAL SAVINGS</span>
            <span>PROJECT PRICE</span>
            <span />
          </div>
          {rows.length === 0 ? (
            <div className="empty-state">
              <FolderOpen size={28} />
              <h3>
                {query || status
                  ? "No matching audits"
                  : "A clear starting point"}
              </h3>
              <p className="muted">
                {query || status
                  ? "Adjust your search or status filter."
                  : "Create an audit to begin capturing the client’s workflow."}
              </p>
              {!query && !status && (
                <button className="button secondary" onClick={onCreate}>
                  <Plus size={16} />
                  Create an audit
                </button>
              )}
            </div>
          ) : (
            rows.map((s) => {
              const calc = calculate(s);
              return (
                <article className="audit-row" key={s.id}>
                  <div className="business-cell">
                    <div className="business-avatar">
                      {(s.client.business || "N").slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <Link
                        className="business-name"
                        to={`/audit/${s.id}/worksheet`}
                      >
                        {s.client.business || "Untitled business"}{" "}
                        <ArrowUpRight size={13} />
                      </Link>
                      <span className="row-subtitle">
                        {s.client.contact || "Contact not established"} ·{" "}
                        {s.client.industry || "Industry not established"}
                      </span>
                      <small>
                        {s.client.auditDate || "Date not established"}{" "}
                        {s.demo && <span className="demo-tag">Demo Data</span>}
                      </small>
                    </div>
                  </div>
                  <div>
                    <span className="status-pill">{s.status}</span>
                    <small className="row-updated">
                      Updated {new Date(s.updatedAt).toLocaleDateString()}
                    </small>
                  </div>
                  <div className="row-financial">
                    <span className="mobile-label">Est. annual savings</span>
                    <strong>{money(calc.net, s.client.currency)}</strong>
                    <small>{s.client.currency} · recurring net estimate</small>
                  </div>
                  <div className="row-financial">
                    <span className="mobile-label">Project price</span>
                    <strong>
                      {calc.finalPrice === null
                        ? "Not entered"
                        : money(calc.finalPrice, s.client.currency)}
                    </strong>
                    <small>Manually scoped</small>
                  </div>
                  <div className="row-actions">
                    <Link
                      className="icon-button"
                      aria-label={`Open ${s.client.business || "audit"}`}
                      to={`/audit/${s.id}/worksheet`}
                    >
                      <ArrowRight size={17} />
                    </Link>
                    <details className="actions-menu">
                      <summary
                        aria-label={`More actions for ${s.client.business || "audit"}`}
                      >
                        •••
                      </summary>
                      <div>
                        <button onClick={() => onDuplicate(s)}>
                          <Copy size={14} />
                          Duplicate audit
                        </button>
                        <button
                          onClick={() =>
                            onChange({ ...s, archived: !s.archived })
                          }
                        >
                          <Archive size={14} />
                          {s.archived
                            ? "Restore from archive"
                            : "Archive audit"}
                        </button>
                        <button onClick={() => onExport(s)}>
                          <Download size={14} />
                          Export audit
                        </button>
                        <button
                          className="danger-text"
                          onClick={() => onDelete(s)}
                        >
                          <Trash2 size={14} />
                          Delete audit
                        </button>
                      </div>
                    </details>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
      <div className="dashboard-bottom">
        <section className="panel call-map">
          <div className="eyebrow">A FOCUSED 30-MINUTE CONVERSATION</div>
          <h2>From friction to a practical first step.</h2>
          <div className="mini-steps">
            {[
              ["01", "Understand", "Objective & team"],
              ["02", "Walk through", "Process & cost"],
              ["03", "Evaluate", "Fit & human review"],
              ["04", "Recommend", "One practical pilot"],
            ].map(([n, title, sub]) => (
              <div key={n}>
                <span>{n}</span>
                <strong>{title}</strong>
                <small>{sub}</small>
              </div>
            ))}
          </div>
        </section>
        <section className="panel scope-note">
          <div className="eyebrow">THE SERVICE BOUNDARY</div>
          <h2>Internal operations first.</h2>
          <p className="muted">
            Administrative work, documents, internal knowledge, reporting, and
            software costs.
          </p>
          <p className="scope-referral">
            Marketing or lead generation?
            <br />
            <strong>Refer to Justin.</strong>
          </p>
        </section>
      </div>
    </div>
  );
}
