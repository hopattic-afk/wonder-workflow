import { useState } from "react";
import { DEFAULT_ACCENT } from "../domain/constants";
import { Download, Upload, RotateCcw, Trash2, ShieldCheck } from "lucide-react";
import type { Settings, Store } from "../domain/types";
import { defaultSettings } from "../domain/defaults";
import { settingsSchema } from "../domain/validation";
import { parseImport, MAX_IMPORT_BYTES } from "../domain/storage";
import { BookingImport } from "../components/BookingImport";
import { meetingIdentity } from "../domain/meetingIdentity";
type Props = {
  store: Store;
  onChange: (s: Store) => void;
  onReplace: (s: Store) => void;
  onExport: () => void;
  lastSaved: string | null;
  blocked?: boolean;
};
function luminance(hex: string) {
  const values = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
}
export function SettingsPage({
  store,
  onChange,
  onReplace,
  onExport,
  lastSaved,
  blocked,
}: Props) {
  const [draft, setDraft] = useState(store.settings);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState<Store | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  function update(key: keyof Settings, value: string | number) {
    const next = { ...draft, [key]: value };
    setDraft(next);
    const checked = settingsSchema.safeParse(next);
    if (!checked.success) {
      setError(
        checked.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(" "),
      );
      return;
    }
    const lum = luminance(next.accent);
    if (
      (lum + 0.05) / (luminance("#0B0B0B") + 0.05) < 4.5 ||
      (lum + 0.05) / 0.05 < 4.5
    ) {
      setError(
        `Choose an accent color with enough contrast against the dark background (for example ${DEFAULT_ACCENT}).`,
      );
      return;
    }
    setError("");
    onChange({ ...store, settings: next });
  }
  async function importFile(file?: File) {
    if (!file) return;
    try {
      if (file.size > MAX_IMPORT_BYTES)
        throw new Error("Backup is too large (25 MB maximum).");
      const parsed = parseImport(await file.text());
      setPending(parsed);
      setError("");
      setNotice("Backup validated. Choose how to restore it below.");
    } catch (e) {
      setPending(null);
      setError(
        `Import rejected. ${e instanceof Error ? e.message : "Invalid backup."} Existing data was not changed.`,
      );
    }
  }
  async function logo(file?: File) {
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 500_000
    ) {
      setError("Use a PNG, JPEG, or WebP image up to 500 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => update("logo", String(reader.result));
    reader.onerror = () => setError("The local logo could not be read.");
    reader.readAsDataURL(file);
  }
  function restore(mode: "merge" | "replace") {
    if (!pending) return;
    if (
      !confirm(
        mode === "replace"
          ? `Replace this workspace with ${pending.sessions.length} imported audits and the imported settings? Current data not in the backup will be removed. Export a backup first.`
          : "Merge imported audits? Matching audit IDs will be replaced by the imported records; current company settings will be kept.",
      )
    )
      return;
    const next =
      mode === "replace"
        ? pending
        : {
            ...store,
            dismissedMeetings: [
              ...new Set([
                ...(store.dismissedMeetings ?? []),
                ...(pending.dismissedMeetings ?? []),
              ]),
            ],
            sessions: [
              ...store.sessions.filter(
                (s) => !pending.sessions.some((p) => p.id === s.id),
              ),
              ...pending.sessions,
            ],
          };
    onReplace(next);
    setDraft(next.settings);
    setPending(null);
    setNotice("Validated backup restored.");
    setError("");
  }
  const definitions: [keyof Settings, string, string][] = [
    ["company", "Company name", "text"],
    ["service", "Service line", "text"],
    ["consultant", "Consultant name", "text"],
    ["email", "Consultant email", "email"],
    ["phone", "Consultant phone", "text"],
    ["address", "Business address", "textarea"],
    ["currency", "Default currency", "select"],
    ["weeks", "Default working weeks", "number"],
    ["stabilization", "Default stabilization period", "text"],
    ["accent", "Gold accent color", "text"],
    ["footer", "Document footer text", "textarea"],
  ];
  return (
    <div className="settings-page">
      <header className="page-heading">
        <div>
          <div className="eyebrow">WORKSPACE PREFERENCES</div>
          <h1>Settings & backup</h1>
          <p className="muted">
            Your company details, document defaults, and local data.
          </p>
        </div>
      </header>
      {error && (
        <div className="notice danger" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="notice" role="status">
          {notice}
        </div>
      )}
      <div className="settings-layout">
        <div>
          <section className="panel">
            <div className="panel-heading">
              <h2>Company & document defaults</h2>
            </div>
            <p className="muted">
              Currency, working weeks, and stabilization defaults apply to new
              audits. Existing audit assumptions are preserved.
            </p>
            <div className="form-grid">
              {definitions.map(([key, label, type]) => (
                <div
                  className={`field ${type === "textarea" ? "wide" : ""}`}
                  key={key}
                >
                  <label htmlFor={`settings-${key}`}>{label}</label>
                  {type === "textarea" ? (
                    <textarea
                      id={`settings-${key}`}
                      rows={3}
                      value={String(draft[key])}
                      onChange={(e) => update(key, e.target.value)}
                      maxLength={12000}
                    />
                  ) : type === "select" ? (
                    <select
                      id={`settings-${key}`}
                      value={draft.currency}
                      onChange={(e) => update(key, e.target.value)}
                    >
                      <option>USD</option>
                      <option>CAD</option>
                    </select>
                  ) : (
                    <input
                      id={`settings-${key}`}
                      type={type}
                      min={type === "number" ? 1 : undefined}
                      max={type === "number" ? 52 : undefined}
                      value={String(draft[key])}
                      onChange={(e) =>
                        update(
                          key,
                          type === "number"
                            ? Number(e.target.value)
                            : e.target.value,
                        )
                      }
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="logo-upload">
              <label htmlFor="logo-upload">Optional local logo</label>
              <p className="muted">
                PNG, JPEG, or WebP · up to 500 KB · stored in this browser and
                included in print.
              </p>
              <input
                id="logo-upload"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => void logo(e.target.files?.[0])}
              />
              {draft.logo && (
                <div className="logo-preview">
                  <img alt="Uploaded company logo" src={draft.logo} />
                  <button
                    className="button secondary small"
                    onClick={() => {
                      if (confirm("Remove the locally stored logo?"))
                        update("logo", "");
                    }}
                  >
                    Remove logo
                  </button>
                </div>
              )}
            </div>
            <button
              className="button secondary"
              onClick={() => {
                if (
                  confirm(
                    "Restore the company settings to their defaults? Client audits are preserved.",
                  )
                ) {
                  const next = defaultSettings();
                  setDraft(next);
                  onChange({ ...store, settings: next });
                  setError("");
                  setNotice("Default settings restored.");
                }
              }}
            >
              <RotateCcw size={16} />
              Restore default settings
            </button>
          </section>
        </div>
        <aside>
          <BookingImport store={store} onChange={onChange} blocked={blocked} />
          <section className="panel backup-panel">
            <ShieldCheck size={25} className="gold" />
            <h2>Keep a copy of your work.</h2>
            <p className="muted">
              Data is saved in this browser on this device. Clearing site data,
              changing browsers, or using a different address can make it
              unavailable.
            </p>
            <dl className="financial-lines">
              <div>
                <dt>Saved audits</dt>
                <dd>{store.sessions.length}</dd>
              </div>
              <div>
                <dt>Last autosave</dt>
                <dd>
                  {lastSaved
                    ? new Date(lastSaved).toLocaleString()
                    : "Not yet saved"}
                </dd>
              </div>
              <div>
                <dt>Last full JSON export</dt>
                <dd>
                  {store.lastExport
                    ? new Date(store.lastExport).toLocaleString()
                    : "Not exported yet"}
                </dd>
              </div>
              <div>
                <dt>Backup format</dt>
                <dd>Version {store.version}</dd>
              </div>
            </dl>
            <button className="button primary full-width" onClick={onExport}>
              <Download size={16} />
              Export all data
            </button>
            <label
              className="button secondary full-width import-button"
              htmlFor="backup-import"
            >
              <Upload size={16} />
              Import all data
              <input
                id="backup-import"
                type="file"
                accept="application/json,.json"
                onChange={(e) => {
                  void importFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
            <p className="muted small-text">
              Backups contain client information. Keep them in a private
              location.
            </p>
            {pending && (
              <div className="import-preview">
                <h3>Validated backup</h3>
                <p>
                  {pending.sessions.length} audits · {pending.settings.currency}{" "}
                  · version {pending.version}
                </p>
                <div className="inline-actions">
                  <button
                    className="button secondary small"
                    onClick={() => restore("merge")}
                  >
                    Merge sessions
                  </button>
                  <button
                    className="button secondary small"
                    onClick={() => restore("replace")}
                  >
                    Replace workspace
                  </button>
                  <button
                    className="text-button"
                    onClick={() => setPending(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>
          <section className="panel danger-zone">
            <h2>Delete local data</h2>
            <p className="muted">
              Permanently remove every audit and reset this app’s settings in
              this browser. Downloaded backups remain on your device.
            </p>
            {!deleteOpen ? (
              <button
                className="button danger"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 size={16} />
                Delete all local data
              </button>
            ) : (
              <div className="delete-confirm">
                <label htmlFor="delete-confirm">Type DELETE to confirm</label>
                <input
                  id="delete-confirm"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  autoComplete="off"
                />
                <div className="inline-actions">
                  <button
                    className="button danger"
                    disabled={confirmation !== "DELETE"}
                    onClick={() => {
                      const next: Store = {
                        version: 1,
                        sessions: [],
                        dismissedMeetings: [
                          ...new Set([
                            ...(store.dismissedMeetings ?? []),
                            ...store.sessions
                              .filter((session) => session.intake)
                              .map((session) =>
                                meetingIdentity(session.intake!.packet),
                              ),
                          ]),
                        ],
                        settings: defaultSettings(),
                        lastExport: null,
                        lastSaved: null,
                      };
                      onReplace(next);
                      setDraft(next.settings);
                      setPending(null);
                      setDeleteOpen(false);
                      setConfirmation("");
                      setNotice(
                        "All local app data deleted. No demo audit will be recreated.",
                      );
                    }}
                  >
                    Permanently delete
                  </button>
                  <button
                    className="text-button"
                    onClick={() => {
                      setDeleteOpen(false);
                      setConfirmation("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
