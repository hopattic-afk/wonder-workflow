import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import {
  DEFAULT_ACCENT,
  LEGACY_DEFAULT_COMPANY,
  OPERATIONS_TITLE,
  displayCompany,
} from "../domain/constants";
import { Copy, FileText, Printer, RefreshCw, Plus, Trash2 } from "lucide-react";
import type {
  Session,
  Settings,
  Recommendation,
  Proposal,
  Amount,
} from "../domain/types";
import {
  generateRecommendation,
  generateProposal,
  sourceFingerprint,
  proposalSourceFingerprint,
} from "../domain/documents";
import { calculate, money, riskWarnings } from "../domain/calculations";
import { newSession } from "../domain/defaults";
import "../styles/documents.css";

type Props = {
  kind: "recommendation" | "proposal";
  session: Session;
  settings: Settings;
  onChange: (session: Session) => void;
  onDuplicate: () => void;
};
type Section = { title: string; text: string };
const requiredFooter =
  "Estimates are based on information provided during the audit and should be validated during implementation.";
const established = (value: string) => value.trim() || "Not established";
const amount = (value: string): Amount => (value === "" ? null : Number(value));
const recFields: [keyof Recommendation, string, number][] = [
  ["objective", "Business Objective", 180],
  ["bottleneck", "Current Operational Bottleneck", 240],
  ["baseline", "Current Baseline", 400],
  ["opportunity", "Recommended First AI Opportunity", 280],
  ["trigger", "Trigger", 100],
  ["action", "AI or automation action", 160],
  ["review", "Human review", 160],
  ["output", "Final output", 100],
  ["impact", "Estimated Operational Impact", 400],
  ["pilot", "Proposed Pilot Scope", 380],
  ["risks", "Risks and Controls", 280],
  ["nextStep", "Recommended Next Step", 200],
];

function EditorSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="panel document-editor-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function NumericInput({
  value,
  onChange,
  integer = false,
  label,
}: {
  value: Amount;
  onChange: (value: Amount) => void;
  integer?: boolean;
  label?: string;
}) {
  const [draft, setDraft] = useState(value === null ? "" : String(value));
  const id = useId();
  useEffect(() => setDraft(value === null ? "" : String(value)), [value]);
  const parsed = amount(draft);
  const invalid =
    parsed !== null &&
    (!Number.isFinite(parsed) ||
      parsed < 0 ||
      (integer && !Number.isInteger(parsed)));
  return (
    <>
      <input
        aria-label={label}
        type="number"
        min="0"
        step={integer ? "1" : "any"}
        value={draft}
        aria-invalid={invalid}
        aria-describedby={invalid ? id : undefined}
        onChange={(e) => {
          const next = e.target.value;
          setDraft(next);
          const result = amount(next);
          if (
            result === null ||
            (Number.isFinite(result) &&
              result >= 0 &&
              (!integer || Number.isInteger(result)))
          )
            onChange(result);
        }}
      />
      {invalid && (
        <small id={id} role="alert" className="danger-text">
          {integer
            ? "Enter a whole number of zero or more."
            : "Enter zero or a positive amount."}{" "}
          This invalid entry has not been saved.
        </small>
      )}
    </>
  );
}

export function Documents({
  kind,
  session,
  settings,
  onChange,
  onDuplicate,
}: Props) {
  const rec = kind === "recommendation";
  const document = rec ? session.recommendation : session.proposal;
  const r = session.recommendation;
  const p = session.proposal;
  const historicalProposal =
    !rec &&
    Boolean(
      p.clientSignDate || p.representativeDate || session.status === "Won",
    );
  const company = displayCompany(settings.company, historicalProposal);
  const historicalBranding = historicalProposal && Boolean(company.trim());
  const documentIdentity = historicalBranding
    ? `${company} · ${settings.service}`
    : OPERATIONS_TITLE;
  const representativeLabel =
    historicalProposal && company === LEGACY_DEFAULT_COMPANY
      ? `${LEGACY_DEFAULT_COMPANY} representative`
      : "Consultant representative";
  const calculation = calculate(session);
  const risks = riskWarnings(session);
  const [feedback, setFeedback] = useState("");
  const [overflow, setOverflow] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const preview = useRef<HTMLDivElement>(null);
  const stale = Boolean(
    document.generatedAt &&
    document.sourceFingerprint !==
      (rec
        ? sourceFingerprint(session, settings)
        : proposalSourceFingerprint(session, settings)),
  );
  const title = rec
    ? "AI Operations Recommendation"
    : "AI Operations Implementation Proposal";
  const currency = session.client.currency;
  const cash = (v: Amount) => money(v, currency);
  const setR = (key: keyof Recommendation, value: string | boolean) =>
    onChange({ ...session, recommendation: { ...r, [key]: value } });
  const setP = (
    key: keyof Proposal,
    value: string | Amount | Proposal["deliverables"] | Proposal["milestones"],
  ) => onChange({ ...session, proposal: { ...p, [key]: value } });

  const generate = () => {
    const hasEdits = rec
      ? recFields.some(([key]) => String(r[key]).trim())
      : JSON.stringify(p) !== JSON.stringify(newSession(settings).proposal);
    if (
      (document.generatedAt || hasEdits) &&
      !window.confirm(
        "Regenerate this document from current audit inputs? This replaces all edits in this document. Cancel to keep your edits.",
      )
    )
      return;
    if (rec)
      onChange({
        ...session,
        recommendation: generateRecommendation(session, settings),
        status: "Recommendation Draft",
      });
    else
      onChange({
        ...session,
        proposal: generateProposal(session, settings),
        status: "Proposal Draft",
      });
    setFeedback("Document generated. Review and edit before sharing.");
  };

  const recommendationSections: Section[] = [
    { title: "1. Business Objective", text: r.objective },
    { title: "2. Current Operational Bottleneck", text: r.bottleneck },
    { title: "3. Current Baseline", text: r.baseline },
    { title: "4. Recommended First AI Opportunity", text: r.opportunity },
    { title: "5. Estimated Operational Impact", text: r.impact },
    { title: "6. Proposed Pilot Scope", text: r.pilot },
    { title: "7. Risks and Controls", text: r.risks },
    { title: "8. Recommended Next Step", text: r.nextStep },
    ...(r.includeInvestment
      ? [{ title: "Estimated investment", text: cash(calculation.finalPrice) }]
      : []),
    ...(r.includeRationale
      ? [
          {
            title: "Recommendation Rationale",
            text: session.worksheet.rationale,
          },
        ]
      : []),
  ];
  const remaining =
    calculation.finalPrice !== null && p.deposit !== null
      ? calculation.finalPrice - p.deposit
      : null;
  const proposalSections: Section[] = [
    {
      title: "1. Client and Project Information",
      text: `Client: ${established(p.legalName)}\nContact: ${established(p.contact)}\nProject: ${established(p.projectName)}\nProposal date: ${established(p.date)}\nExpires: ${established(p.expires)}\nCurrency: ${currency}`,
    },
    { title: "2. Project Objective", text: p.objective },
    { title: "3. Current-State Summary", text: p.currentState },
    { title: "4. Proposed Solution", text: p.solution },
    { title: "5. Scope of Work", text: p.scope },
    { title: "6. Systems and Integrations", text: p.systems },
    {
      title: "7. Deliverables",
      text: p.deliverables
        .filter((d) => d.included)
        .map((d) => `• ${established(d.text)}`)
        .join("\n"),
    },
    {
      title: "8. Success Metrics and Acceptance Criteria",
      text: `Baseline: ${established(p.baselineMetric)}\nTarget: ${established(p.targetMetric)}\nTest sample size: ${p.sampleSize ?? "Not established"}\nCompletion standard: ${established(p.standard)}\nClient testing responsibility: ${established(p.testingResponsibility)}\nAcceptance deadline: ${established(p.acceptanceDeadline)}`,
    },
    {
      title: "9. Timeline and Milestones",
      text: p.milestones
        .map(
          (m) =>
            `${established(m.name)} — ${m.days === null ? "Business-day estimate not established" : `${m.days} business days`}\n${established(m.outcome)}`,
        )
        .join("\n\n"),
    },
    {
      title: "10. Investment",
      text: `Standard implementation price: ${cash(session.calculator.price)}\nDiscount: ${cash(session.calculator.discount)}\nFinal project price: ${cash(calculation.finalPrice)}\nDeposit: ${cash(p.deposit)}\nRemaining balance: ${cash(remaining)}\nPayment arrangement: ${established(p.paymentPreset)}\nPayment schedule: ${established(p.paymentSchedule)}\nCurrency: ${currency}. No tax calculated.`,
    },
    { title: "11. Third-Party Costs", text: p.thirdParty },
    { title: "12. Client Responsibilities", text: p.responsibilities },
    { title: "13. Exclusions", text: p.exclusions },
    {
      title: "14. Data, Privacy, and AI Controls",
      text: `${established(p.privacy)}${p.privacy.includes("qualified counsel") ? "" : "\n\nThis terms template should be reviewed by qualified counsel before broad commercial use."}`,
    },
    { title: "15. Change Orders", text: p.changeOrders },
    {
      title: "16. Stabilization and Support",
      text: `Stabilization period: ${established(p.stabilization)}\nIncluded corrections: ${established(p.corrections)}\nOngoing support included: ${established(p.supportIncluded)}\nOptional monthly support: ${cash(p.monthlySupport)}\nResponse expectations: ${established(p.response)}`,
    },
    { title: "17. Case-Study Permission", text: established(p.caseStudy) },
    {
      title: "18. Approval and Signatures",
      text: `Client name: ${established(p.clientSignName)}\nClient title: ${established(p.clientSignTitle)}\nSignature: __________________________________\nDate: ${p.clientSignDate || "________________"}\n\n${representativeLabel}: ${established(p.representative)}\nSignature: __________________________________\nDate: ${p.representativeDate || "________________"}\n\nThis document is not an electronic-signature system.`,
    },
  ];
  const sections = rec ? recommendationSections : proposalSections;
  const groups = rec
    ? [sections]
    : [
        sections.slice(0, 6),
        sections.slice(6, 11),
        sections.slice(11, 14),
        sections.slice(14),
      ];
  const copy = async (markdown: boolean) => {
    const heading = markdown ? "# " : "";
    const content = `${heading}${title}\n${documentIdentity}\n${established(session.client.business)}\n\n${sections.map((s) => `${markdown ? "## " : ""}${s.title}\n${established(s.text)}${rec && s.title.startsWith("4.") ? `\n\nTrigger: ${established(r.trigger)} → AI or automation action: ${established(r.action)} → Human review: ${established(r.review)} → Final output: ${established(r.output)}` : ""}`).join("\n\n")}\n\n${requiredFooter}`;
    try {
      await navigator.clipboard.writeText(content);
      setFeedback(`Copied as ${markdown ? "Markdown" : "plain text"}.`);
    } catch {
      setFeedback(
        "Clipboard access failed. Select and copy the document preview text, or allow clipboard access in this browser.",
      );
    }
  };

  useEffect(() => {
    const measure = () => {
      if (preview.current)
        setPreviewScale(
          Math.min(1, preview.current.clientWidth / (7.2 * 96 + 4)),
        );
      const pages =
        preview.current?.querySelectorAll<HTMLElement>(".print-page");
      setOverflow(
        Boolean(
          pages &&
          [...pages].some((page) => page.scrollHeight > page.clientHeight + 2),
        ),
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (preview.current) observer.observe(preview.current);
    documentFontReady(measure);
    return () => observer.disconnect();
  }, [session, settings, kind]);

  const field = (
    key: keyof Proposal,
    label: string,
    type = "textarea",
    hint?: string,
  ) => (
    <label className="field" key={key}>
      <span>{label}</span>
      {type === "textarea" ? (
        <textarea
          aria-label={label}
          rows={3}
          value={String(p[key] ?? "")}
          onChange={(e) => setP(key, e.target.value)}
        />
      ) : type === "number" ? (
        <NumericInput
          label={label}
          value={p[key] as Amount}
          integer={key === "sampleSize"}
          onChange={(value) => setP(key, value)}
        />
      ) : (
        <input
          aria-label={label}
          type={type}
          value={String(p[key] ?? "")}
          onChange={(e) => setP(key, e.target.value)}
        />
      )}
      {hint && <small>{hint}</small>}
    </label>
  );
  const select = (key: keyof Proposal, label: string, options: string[]) => (
    <label className="field">
      <span>{label}</span>
      <select
        value={String(p[key] ?? "")}
        onChange={(e) => {
          const value = e.target.value;
          if (
            key === "paymentPreset" &&
            ["Paid in full", "50% deposit / 50% at completion"].includes(value)
          ) {
            const deposit =
              calculation.finalPrice === null
                ? null
                : value === "Paid in full"
                  ? calculation.finalPrice
                  : Math.round(calculation.finalPrice * 50) / 100;
            onChange({
              ...session,
              proposal: {
                ...p,
                paymentPreset: value,
                deposit,
                paymentSchedule:
                  value === "Paid in full"
                    ? "Full payment due before work begins; confirm the payment date with the client."
                    : "50% deposit before work begins; remaining 50% due at completion and client acceptance.",
              },
            });
          } else setP(key, value);
        }}
      >
        <option value="">Not established — choose an option</option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );

  return (
    <div
      className="documents-page"
      style={
        {
          "--document-gold": settings.accent || DEFAULT_ACCENT,
        } as CSSProperties
      }
    >
      <div className="document-editor">
        <div className="page-title">
          <div>
            <p className="eyebrow">
              {rec ? "03 / RECOMMENDATION" : "04 / PROPOSAL"}
            </p>
            <h1>
              {rec
                ? "Your first recommendation"
                : "Define the work. Agree the terms."}
            </h1>
            <p className="muted">
              {rec
                ? "An editable, one-page decision document for your client."
                : "An editable scope of work built from the same audit and financial assumptions."}
            </p>
          </div>
          <FileText aria-hidden="true" size={32} />
        </div>
        <div className="document-toolbar">
          <button className="button primary" onClick={generate}>
            <RefreshCw size={16} />
            {document.generatedAt ? `Regenerate ${kind}` : `Generate ${kind}`}
          </button>
          <button
            className="button secondary"
            disabled={!document.generatedAt || (rec && overflow)}
            onClick={() => window.print()}
          >
            <Printer size={16} />
            Print / Save as PDF
          </button>
          <button
            className="button secondary"
            disabled={!document.generatedAt}
            onClick={() => void copy(false)}
          >
            <Copy size={16} />
            Copy as plain text
          </button>
          <button
            className="button secondary"
            disabled={!document.generatedAt}
            onClick={() => void copy(true)}
          >
            Copy as Markdown
          </button>
          <Link
            className="button secondary"
            to={`/audit/${session.id}/worksheet`}
          >
            Return to audit
          </Link>
          {!rec && (
            <>
              <button className="button secondary" onClick={onDuplicate}>
                Duplicate proposal
              </button>
              <button
                className="button secondary"
                disabled={!p.generatedAt || session.status === "Proposal Sent"}
                onClick={() => {
                  onChange({ ...session, status: "Proposal Sent" });
                  setFeedback(
                    "Marked as sent locally. No message or document was sent.",
                  );
                }}
              >
                Mark proposal as sent
              </button>
            </>
          )}
        </div>
        <p className="document-feedback" role="status">
          {feedback}
        </p>
        {(risks.length > 0 || calculation.warnings.length > 0) && (
          <section
            className="panel document-guardrails"
            aria-label="Internal document guardrails"
          >
            <h2>Internal review before sharing</h2>
            <p className="muted">
              These warnings stay in the editor and are excluded from client
              documents.
            </p>
            {risks.map((risk) => (
              <p
                key={risk.code}
                className={`notice ${risk.hardStop ? "danger" : ""}`}
                role={risk.hardStop ? "alert" : undefined}
              >
                {risk.message}
              </p>
            ))}
            {calculation.warnings.map((warning) => (
              <p key={warning} className="notice" role="status">
                {warning}
              </p>
            ))}
          </section>
        )}
        {!document.generatedAt && (
          <div className="notice">
            Generate a draft to fill this document using the current audit.
            Missing information remains “Not established.”
          </div>
        )}
        {stale && (
          <div className="notice" role="status">
            Source inputs have changed. This draft retains your edits. Review it
            or regenerate to use current audit inputs.
          </div>
        )}
        {!rec &&
          r.generatedAt &&
          r.sourceFingerprint !== sourceFingerprint(session, settings) && (
            <div className="notice" role="status">
              The recommendation used by this proposal is based on earlier audit
              inputs. Review the recommendation and its edits before relying on
              this proposal, even after generating it.
            </div>
          )}
        {overflow && document.generatedAt && (
          <div className="notice danger" role="alert">
            {rec
              ? "This recommendation exceeds one Letter page. Shorten the text or disable optional sections before printing."
              : "A proposal page exceeds its recommended page length. Shorten that page for a clean four-page layout; longer content may continue onto an additional printed page."}
          </div>
        )}
        {rec ? (
          <>
            <section className="panel document-options">
              <label>
                <input
                  type="checkbox"
                  checked={r.includeInvestment}
                  onChange={(e) => setR("includeInvestment", e.target.checked)}
                />{" "}
                Include estimated investment
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={r.includeRationale}
                  onChange={(e) => setR("includeRationale", e.target.checked)}
                />{" "}
                Include internal Recommendation Rationale in document
              </label>
              <p className="muted">
                Keep the copy concise. Each field includes a suggested length;
                the physical page check confirms whether the complete document
                fits.
              </p>
            </section>
            <div className="document-fields-grid">
              {recFields.map(([key, label, limit]) => (
                <label className="field panel" key={key}>
                  <span>{label}</span>
                  <textarea
                    aria-label={label}
                    rows={key === "baseline" || key === "impact" ? 5 : 3}
                    value={String(r[key])}
                    onChange={(e) => setR(key, e.target.value)}
                  />
                  <small
                    className={
                      String(r[key]).length > limit ? "length-warning" : ""
                    }
                  >
                    {String(r[key]).length} characters · aim for {limit} or
                    fewer
                  </small>
                </label>
              ))}
            </div>
            {r.includeRationale && (
              <label className="field panel">
                <span>Internal Recommendation Rationale</span>
                <textarea
                  rows={3}
                  value={session.worksheet.rationale}
                  onChange={(e) =>
                    onChange({
                      ...session,
                      worksheet: {
                        ...session.worksheet,
                        rationale: e.target.value,
                      },
                    })
                  }
                />
                <small>
                  This note will be included in copies and print because you
                  enabled it.
                </small>
              </label>
            )}
          </>
        ) : (
          <div className="proposal-editors">
            <EditorSection title="1. Client and Project Information">
              <div className="form-grid">
                {field("legalName", "Client legal or business name", "text")}
                {field("contact", "Proposal contact", "text")}
                {field("projectName", "Project name", "text")}
                {field("date", "Proposal date", "date")}
                {field("expires", "Proposal expiration date", "date")}
                <label className="field">
                  <span>Proposal currency</span>
                  <select
                    value={currency}
                    onChange={(e) =>
                      onChange({
                        ...session,
                        client: {
                          ...session.client,
                          currency: e.target.value as "USD" | "CAD",
                        },
                      })
                    }
                  >
                    <option>USD</option>
                    <option>CAD</option>
                  </select>
                  <small>Shared with the audit and calculator.</small>
                </label>
              </div>
              {p.date && p.expires && p.expires < p.date && (
                <p className="notice danger">
                  Expiration date is before the proposal date.
                </p>
              )}
            </EditorSection>
            <EditorSection title="2. Project Objective">
              {field("objective", "Measurable operational outcome")}
            </EditorSection>
            <EditorSection title="3. Current-State Summary">
              {field("currentState", "Existing process and baseline")}
            </EditorSection>
            <EditorSection title="4. Proposed Solution">
              {field("solution", "Proposed AI-assisted workflow")}
            </EditorSection>
            <EditorSection title="5. Scope of Work">
              {field("scope", "Included work")}
            </EditorSection>
            <EditorSection title="6. Systems and Integrations">
              {field(
                "systems",
                "Included systems",
                "textarea",
                "Distinguish existing client software, new software, third-party services, and client-owned accounts.",
              )}
            </EditorSection>
            <EditorSection title="7. Deliverables">
              <div className="document-row-list">
                {p.deliverables.map((d, index) => (
                  <div className="deliverable-row" key={d.id}>
                    <label className="document-check">
                      <input
                        aria-label={`Include deliverable ${index + 1}`}
                        type="checkbox"
                        checked={d.included}
                        onChange={(e) =>
                          setP(
                            "deliverables",
                            p.deliverables.map((x) =>
                              x.id === d.id
                                ? { ...x, included: e.target.checked }
                                : x,
                            ),
                          )
                        }
                      />
                      Included
                    </label>
                    <label className="field">
                      <span>Deliverable {index + 1}</span>
                      <input
                        value={d.text}
                        onChange={(e) =>
                          setP(
                            "deliverables",
                            p.deliverables.map((x) =>
                              x.id === d.id
                                ? { ...x, text: e.target.value }
                                : x,
                            ),
                          )
                        }
                      />
                    </label>
                    <button
                      className="button secondary small"
                      aria-label={`Remove deliverable ${index + 1}`}
                      onClick={() => {
                        if (
                          window.confirm(
                            "Remove this deliverable? This cannot be undone.",
                          )
                        )
                          setP(
                            "deliverables",
                            p.deliverables.filter((x) => x.id !== d.id),
                          );
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                className="button secondary"
                onClick={() =>
                  setP("deliverables", [
                    ...p.deliverables,
                    { id: crypto.randomUUID(), text: "", included: true },
                  ])
                }
              >
                <Plus size={16} />
                Add deliverable
              </button>
            </EditorSection>
            <EditorSection title="8. Success Metrics and Acceptance Criteria">
              <div className="form-grid">
                {field("baselineMetric", "Baseline metric")}
                {field("targetMetric", "Target metric")}
                {field("sampleSize", "Test sample size", "number")}
                {field(
                  "standard",
                  "Required accuracy or completion standard",
                  "textarea",
                  "Agree a testable standard with the client. Do not promise unsupported accuracy.",
                )}
                {field(
                  "testingResponsibility",
                  "Client testing responsibility",
                )}
                {field("acceptanceDeadline", "Acceptance deadline", "date")}
              </div>
            </EditorSection>
            <EditorSection title="9. Timeline and Milestones">
              {p.milestones.map((m, index) => (
                <div className="milestone-row" key={m.id}>
                  <label className="field">
                    <span>Milestone {index + 1}</span>
                    <input
                      value={m.name}
                      onChange={(e) =>
                        setP(
                          "milestones",
                          p.milestones.map((x) =>
                            x.id === m.id ? { ...x, name: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Business-day estimate {index + 1}</span>
                    <NumericInput
                      value={m.days}
                      onChange={(value) =>
                        setP(
                          "milestones",
                          p.milestones.map((x) =>
                            x.id === m.id ? { ...x, days: value } : x,
                          ),
                        )
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Milestone outcome {index + 1}</span>
                    <textarea
                      rows={2}
                      value={m.outcome}
                      onChange={(e) =>
                        setP(
                          "milestones",
                          p.milestones.map((x) =>
                            x.id === m.id
                              ? { ...x, outcome: e.target.value }
                              : x,
                          ),
                        )
                      }
                    />
                  </label>
                  <button
                    className="button secondary small"
                    aria-label={`Remove milestone ${index + 1}`}
                    onClick={() => {
                      if (
                        window.confirm(
                          "Remove this milestone? This cannot be undone.",
                        )
                      )
                        setP(
                          "milestones",
                          p.milestones.filter((x) => x.id !== m.id),
                        );
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                className="button secondary"
                onClick={() =>
                  setP("milestones", [
                    ...p.milestones,
                    {
                      id: crypto.randomUUID(),
                      name: "",
                      days: null,
                      outcome: "",
                    },
                  ])
                }
              >
                <Plus size={16} />
                Add milestone
              </button>
              <p className="muted">
                Duration is established during scoping; no project duration is
                assumed.
              </p>
            </EditorSection>
            <EditorSection title="10. Investment">
              <p className="muted">
                Implementation pricing is shared with the calculator. All
                amounts are {currency}; no tax is calculated.
              </p>
              <div className="form-grid">
                {(["price", "discount"] as const).map((key) => (
                  <label className="field" key={key}>
                    <span>
                      {key === "price"
                        ? "Standard implementation price"
                        : "Founding-client discount"}
                    </span>
                    <NumericInput
                      value={session.calculator[key]}
                      onChange={(value) =>
                        onChange({
                          ...session,
                          calculator: { ...session.calculator, [key]: value },
                        })
                      }
                    />
                  </label>
                ))}
                <div className="field">
                  <span>Final project price</span>
                  <strong>{cash(calculation.finalPrice)}</strong>
                </div>
                {field("deposit", "Deposit", "number")}
                <div className="field">
                  <span>Remaining balance</span>
                  <strong>{cash(remaining)}</strong>
                </div>
                {select("paymentPreset", "Payment preset", [
                  "Paid in full",
                  "50% deposit / 50% at completion",
                  "Custom milestone schedule",
                ])}
                {field("paymentSchedule", "Payment schedule")}
              </div>
              <p className="muted">
                Selecting a payment preset fills the deposit from the current
                final price and suggests an editable schedule. If the price
                changes, reapply the preset or revise the deposit. Custom
                schedules retain your entries.
              </p>
              {remaining !== null && remaining < 0 && (
                <p className="notice danger">
                  Deposit exceeds the final project price.
                </p>
              )}
            </EditorSection>
            <EditorSection title="11. Third-Party Costs">
              {field("thirdParty", "Third-party costs terms")}
            </EditorSection>
            <EditorSection title="12. Client Responsibilities">
              {field("responsibilities", "Client responsibilities")}
            </EditorSection>
            <EditorSection title="13. Exclusions">
              {field("exclusions", "Excluded work")}
            </EditorSection>
            <EditorSection title="14. Data, Privacy, and AI Controls">
              {field("privacy", "Data, privacy, and AI controls")}
              <p className="muted">
                This terms template should be reviewed by qualified counsel
                before broad commercial use.
              </p>
            </EditorSection>
            <EditorSection title="15. Change Orders">
              {field("changeOrders", "Change-order terms")}
            </EditorSection>
            <EditorSection title="16. Stabilization and Support">
              <div className="form-grid">
                {field("stabilization", "Stabilization period", "text")}
                {field("corrections", "Included corrections")}
                {select("supportIncluded", "Ongoing support included", [
                  "Yes",
                  "No",
                ])}
                {field(
                  "monthlySupport",
                  "Optional monthly support price",
                  "number",
                )}
                {field("response", "Response expectations")}
              </div>
            </EditorSection>
            <EditorSection title="17. Case-Study Permission">
              {select("caseStudy", "Case-study permission", [
                "Named public case study",
                "Anonymous public case study",
                "Private portfolio reference",
                "Testimonial only",
                "No case-study permission",
              ])}
            </EditorSection>
            <EditorSection title="18. Approval and Signatures">
              <div className="form-grid">
                {field("clientSignName", "Client signer name", "text")}
                {field("clientSignTitle", "Client signer title", "text")}
                {field("clientSignDate", "Client signature date", "date")}
                {field("representative", representativeLabel, "text")}
                {field(
                  "representativeDate",
                  "Representative signature date",
                  "date",
                )}
              </div>
              <p className="muted">
                Printed signature lines are provided. This is not an
                electronic-signature system.
              </p>
            </EditorSection>
          </div>
        )}
        <div className="document-preview-heading">
          <p className="eyebrow">CLIENT DOCUMENT</p>
          <h2>{rec ? "One-page preview" : "Four-page preview"}</h2>
          <p className="muted">
            Letter paper · normal scale · turn off browser headers and footers
            when printing. Review every field before sharing.
          </p>
        </div>
      </div>
      <div
        className={`document-preview ${rec ? "recommendation-preview" : "proposal-preview"}`}
        ref={preview}
        aria-label={`${kind} print preview`}
      >
        {groups.map((group, index) => (
          <article
            className={`print-page ${rec ? "recommendation-paper" : "proposal-paper"}`}
            key={index}
            style={{ zoom: previewScale }}
          >
            <header className="paper-header">
              <div>
                {historicalBranding && settings.logo && (
                  <img
                    className="paper-logo"
                    src={settings.logo}
                    alt={`${company} logo`}
                  />
                )}
                <div>
                  <strong>
                    {historicalBranding ? company : OPERATIONS_TITLE}
                  </strong>
                  {historicalBranding && (
                    <span>{settings.service || "AI Operations"}</span>
                  )}
                </div>
              </div>
              <span>{rec ? session.client.auditDate : p.date}</span>
            </header>
            <div className="paper-title">
              <h1>{title}</h1>
              {rec ? (
                <p>Recommended First AI Opportunity</p>
              ) : (
                <p>
                  {historicalBranding ? `${company} · ` : "Client: "}
                  {established(p.legalName)}
                </p>
              )}
              {rec && (
                <p className="paper-client">
                  {established(session.client.business)} ·{" "}
                  {established(session.client.contact)}
                </p>
              )}
            </div>
            {rec && (
              <p className="paper-context">
                Based on the workflow discussed during the audit. This is not a
                full assessment of every business process.
              </p>
            )}
            <div className="paper-sections">
              {group.map((s) => (
                <section className="paper-section" key={s.title}>
                  <h2>{s.title}</h2>
                  <p>{established(s.text)}</p>
                  {rec && s.title.startsWith("4.") && (
                    <div className="paper-flow">
                      {[
                        ["Trigger", r.trigger],
                        ["AI or automation action", r.action],
                        ["Human review", r.review],
                        ["Final output", r.output],
                      ].map(([label, text], i) => (
                        <div key={label}>
                          <strong>{label}</strong>
                          <p>{established(text)}</p>
                          {i < 3 && <span aria-hidden="true">→</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>
            <footer className="paper-footer">
              <p>{requiredFooter}</p>
              {settings.footer && settings.footer !== requiredFooter && (
                <p>{settings.footer}</p>
              )}
              <div>
                <span>
                  {[
                    settings.consultant,
                    settings.email,
                    settings.phone,
                    settings.address,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                <span>
                  {index + 1} / {groups.length}
                </span>
              </div>
            </footer>
          </article>
        ))}
      </div>
    </div>
  );
}

function documentFontReady(callback: () => void) {
  if (typeof window !== "undefined" && window.document.fonts)
    void window.document.fonts.ready.then(callback);
}
