import { useState, type ReactNode } from "react";
import { ASSESSMENT_SCORE_MAX } from "../domain/constants";
import { Link } from "react-router-dom";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import {
  Plus,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import {
  SessionForm,
  Fields,
  Checklist,
  type FieldSpec,
} from "../components/Form";
import {
  CLASSIFICATIONS,
  DECISIONS,
  FIT_LABELS,
  RISK_AREAS,
  type Session,
} from "../domain/types";
import { newStep, newSoftware } from "../domain/defaults";
import { MeetingPrep } from "../components/MeetingPrep";
import { pilotFit, riskWarnings } from "../domain/calculations";

const yesNo = ["Yes", "No", "Unknown"];
const sections = [
  {
    key: "goal",
    label: "Client & goal",
    time: "0–5 min",
    prompt: "Who are we talking to, and what would make their work easier?",
  },
  {
    key: "workflow",
    label: "Walk through the work",
    time: "5–15 min",
    prompt:
      "Pick one repetitive task. Ask them to walk through the last time it happened.",
  },
  {
    key: "costs",
    label: "Time & tools",
    time: "15–21 min",
    prompt:
      "Capture their best estimates. Leave anything unknown blank and follow up later.",
  },
  {
    key: "review",
    label: "AI possibilities & review",
    time: "21–26 min",
    prompt: "Discuss what could help, and who would check the result.",
  },
  {
    key: "wrap",
    label: "Wrap-up",
    time: "26–30 min",
    prompt:
      "Agree on one next step. Detailed scoring can wait until after the call.",
  },
];
const useCaseLabels: Record<string, string> = {
  "AI document extraction": "Read details from forms or documents",
  "AI document summarization": "Summarize long documents",
  "AI email or information classification":
    "Sort incoming emails or information",
  "AI task routing": "Send work to the right person",
  "AI report drafting": "Draft routine reports",
  "AI estimate or document drafting": "Draft estimates or other documents",
  "AI internal knowledge assistant": "Find answers in company files",
  "AI SOP assistant": "Help staff follow written procedures",
  "AI data-entry assistance": "Reduce repeated data entry",
  "AI meeting or field-note processing":
    "Turn meeting or field notes into usable records",
  "AI information normalization": "Clean up inconsistent wording or formats",
  "AI-assisted software synchronization":
    "Keep information in different tools in sync",
  "Rules-based automation with an AI step":
    "Automate repeatable steps with AI help",
  "Software consolidation": "Reduce overlapping software",
  "Process redesign before AI": "Simplify the process before adding AI",
  "Not currently suitable for AI": "AI may not be a good fit right now",
  "Marketing or lead generation — refer to Justin":
    "Marketing or lead generation — refer to Justin",
  Other: "Another possible use",
};
const commonUseCases = [
  "AI document extraction",
  "AI document summarization",
  "AI report drafting",
  "AI estimate or document drafting",
  "AI internal knowledge assistant",
  "AI data-entry assistance",
];
const riskLabels: Record<string, string> = {
  "Financial decisions": "Money or financial decisions",
  "Employment decisions": "Hiring or employee decisions",
  "Medical information": "Medical information",
  "Legal advice": "Legal advice",
  "Safety-critical decisions": "Decisions that could affect safety",
  "Personally identifiable information":
    "Personal details, such as names, contact details, or IDs",
  "Confidential business data": "Confidential business information",
  "Customer communications": "Messages sent to customers",
  "None of these": "None of these",
};
const w = (
  name: string,
  label: string,
  type: FieldSpec["type"] = "textarea",
  options?: readonly string[],
): FieldSpec => ({ name: "worksheet." + name, label, type, options });
const c = (
  name: string,
  label: string,
  type: FieldSpec["type"] = "text",
  options?: readonly string[],
): FieldSpec => ({ name: "client." + name, label, type, options });

function OptionalDetails({
  title,
  children,
  hint,
}: {
  title: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <details className="optional-details">
      <summary>
        <span>{title}</span>
        <small>Optional</small>
      </summary>
      <div>
        {hint && <p className="muted optional-hint">{hint}</p>}
        {children}
      </div>
    </details>
  );
}

export function Worksheet({
  session,
  onChange,
}: {
  session: Session;
  onChange: (s: Session) => void;
}) {
  const [active, setActive] = useState("goal");
  const index = sections.findIndex((s) => s.key === active);
  const warnings = riskWarnings(session);
  return (
    <SessionForm session={session} onChange={onChange}>
      <header className="page-heading compact">
        <div>
          <div className="eyebrow">01 / UNDERSTAND THE WORK</div>
          <h1>Audit worksheet</h1>
          <p className="muted">
            Five short sections. One workflow. Detailed questions are optional.
          </p>
        </div>
        <details className="agenda">
          <summary>
            <HelpCircle size={16} />
            30-minute agenda
          </summary>
          <div>
            {sections.map((s) => (
              <p key={s.key}>
                <strong>{s.time}</strong>
                {s.label}
              </p>
            ))}
            <small>The timer is optional and never moves sections.</small>
          </div>
        </details>
      </header>
      <MeetingPrep session={session} />
      {warnings.length > 0 && (
        <details
          className={
            "guardrails " + (warnings.some((x) => x.hardStop) ? "has-risk" : "")
          }
          open={warnings.some((x) => x.hardStop)}
        >
          <summary>
            <AlertTriangle size={15} />
            {warnings.some((x) => x.hardStop)
              ? "Review required"
              : "Follow-up reminders"}{" "}
            · {warnings.length}
          </summary>
          <ul>
            {warnings.map((warning) => (
              <li key={warning.code}>
                <strong>{warning.hardStop ? "REVIEW REQUIRED · " : ""}</strong>
                {warning.message}
              </li>
            ))}
          </ul>
        </details>
      )}
      <div className="worksheet-layout">
        <aside className="section-sidebar">
          <nav aria-label="Worksheet sections">
            {sections.map((s, i) => (
              <button
                key={s.key}
                type="button"
                className={active === s.key ? "active" : ""}
                onClick={() => setActive(s.key)}
                aria-current={active === s.key ? "step" : undefined}
              >
                <span>{"0" + (i + 1)}</span>
                <span className="section-nav-label">
                  {s.label}
                  <small>{s.time}</small>
                </span>
              </button>
            ))}
          </nav>
          <div className="call-guidance">
            <span className="eyebrow">KEEP THE CALL MOVING</span>
            <p>
              Short notes are enough. Open optional details only when they help
              the conversation.
            </p>
            <p>Unknown today? Leave it blank and add it to the follow-up.</p>
          </div>
        </aside>
        <div className="worksheet-main">
          <section className="panel worksheet-panel">
            <div className="section-title">
              <span>{"0" + (index + 1)}</span>
              <div>
                <h2>{sections[index].label}</h2>
                <p className="muted">{sections[index].prompt}</p>
              </div>
            </div>
            {active === "goal" && <ClientGoal />}
            {active === "workflow" && <WorkflowWalkthrough />}
            {active === "costs" && <TimeTools />}
            {active === "review" && <AIReview session={session} />}
            {active === "wrap" && <WrapUp session={session} />}
          </section>
          <div className="section-footer">
            <button
              type="button"
              className="button secondary"
              disabled={index === 0}
              onClick={() => setActive(sections[index - 1].key)}
            >
              <ArrowLeft size={15} />
              Previous section
            </button>
            <span className="muted">
              {index + 1} of {sections.length}
            </span>
            {index < sections.length - 1 ? (
              <button
                type="button"
                className="button primary"
                onClick={() => setActive(sections[index + 1].key)}
              >
                Next section
                <ArrowRight size={15} />
              </button>
            ) : (
              <Link
                className="button primary"
                to={"/audit/" + session.id + "/calculator"}
              >
                Open calculator
                <ArrowRight size={15} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </SessionForm>
  );
}

function ClientGoal() {
  return (
    <>
      <Fields
        items={[
          c("business", "Business name"),
          c("contact", "Contact name"),
          {
            ...w("reason", "What would you like to improve?"),
            placeholder: "For example: spend less time preparing reports.",
          },
          {
            ...w(
              "frustration",
              "What repetitive task causes the most frustration?",
            ),
            placeholder: "A short description is enough.",
          },
        ]}
      />
      <OptionalDetails
        title="Client details & background"
        hint="Use details you already have. You do not need to collect all of these during the call."
      >
        <Fields
          items={[
            c("email", "Email", "email"),
            c("title", "Contact title"),
            c("industry", "Industry"),
            { ...c("employees", "Employee count", "number"), max: 100000 },
            c("currency", "Currency", "select", ["USD", "CAD"]),
            c("auditDate", "Audit date", "date"),
            c("phone", "Phone (optional)"),
            c("location", "City and state / province"),
            c("website", "Website (optional)", "url"),
            c("revenue", "Annual revenue band", "select", [
              "Under $250,000",
              "$250,000–$499,999",
              "$500,000–$999,999",
              "$1M–$2.9M",
              "$3M–$9.9M",
              "$10M+",
              "Prefer not to say",
            ]),
            w("objective", "Main goal", "select", [
              "Save labor hours",
              "Reduce software cost",
              "Improve turnaround time",
              "Reduce mistakes",
              "Increase capacity",
              "Avoid an additional hire",
              "Improve internal access to information",
              "Other",
            ]),
            w("stopDoing", "What would they like to stop doing manually?"),
            c("notes", "General notes", "textarea"),
          ]}
        />
      </OptionalDetails>
      <OptionalDetails
        title="Assessment score & referral details"
        hint="Copy these from their earlier assessment if available; do not repeat the assessment on the call."
      >
        <Fields
          items={[
            {
              ...c(
                "score",
                "AI Operations Score (0–" + ASSESSMENT_SCORE_MAX + ")",
                "number",
              ),
              max: ASSESSMENT_SCORE_MAX,
            },
            c("tier", "Score tier", "select", [
              "Targeted Opportunity",
              "Strong Opportunity",
              "High-Impact Opportunity",
            ]),
            c("priority", "Operational priority selected"),
            c("referral", "Referral source"),
            c("assessmentComments", "Assessment comments", "textarea"),
          ]}
        />
      </OptionalDetails>
    </>
  );
}

function WorkflowWalkthrough() {
  return (
    <>
      <Fields
        items={[
          {
            ...w("workflowName", "What task are we looking at?", "text"),
            wide: true,
          },
          w("trigger", "What starts the work?"),
          w("output", "What should be ready at the end?"),
        ]}
      />
      <h3 className="subheading">What happens in between?</h3>
      <p className="section-intro">
        Capture the main steps. Three or four short notes are a good starting
        point.
      </p>
      <WorkflowSteps />
      <OptionalDetails title="More about this workflow">
        <Fields
          items={[
            w("department", "Team or business area", "text"),
            w("owner", "Who owns the process?", "text"),
            w("people", "Who else is involved?", "text"),
            w("frequency", "How often does it happen?", "select", [
              "Per day",
              "Per week",
              "Per month",
              "Other",
            ]),
            w("occurrences", "How many times in that period?", "number"),
            w("seasonality", "Steady or seasonal?", "select", [
              "Consistent",
              "Seasonal",
              "Unknown",
            ]),
            w("selectionReason", "Why start with this task?"),
          ]}
        />
      </OptionalDetails>
      <details className="helper-panel">
        <summary>
          <HelpCircle size={16} />
          Helpful follow-up questions
        </summary>
        <ul>
          {[
            "Walk me through the last time this happened.",
            "What information comes in, and in what format?",
            "Where does someone copy or re-enter information?",
            "Which step causes the most delay?",
            "What needs judgment rather than a fixed rule?",
            "What exceptions come up?",
            "What does a correct result look like?",
            "What happens when it is wrong or late?",
            "Who must approve the result?",
          ].map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
      </details>
    </>
  );
}

function TimeTools() {
  return (
    <>
      <Fields
        items={[
          w(
            "baselineHours",
            "About how many hours does this take each week?",
            "number",
          ),
          w("baselineRoles", "Who spends that time?", "text"),
          {
            ...w("baselineRate", "Approximate hourly labor cost", "number"),
            help: "Include employer costs if known. Leave blank if the cost is unknown.",
          },
          {
            ...w("baseline", "What could we measure before and after?"),
            help: "For example: hours spent each week, report turnaround, or corrections needed.",
          },
        ]}
      />
      <OptionalDetails title="More timing, cost & error details">
        <Fields
          items={[
            w(
              "baselineOccurrences",
              "Number of occurrences in the selected period",
              "number",
            ),
            w("minutesPerOccurrence", "Minutes per occurrence", "number"),
            w(
              "turnaround",
              "How long until the finished result is ready?",
              "text",
            ),
            w("errors", "How often does work need correcting?", "text"),
            w("backlog", "Is there a backlog?", "text"),
            w("tracking", "How is this work tracked today?"),
          ]}
        />
      </OptionalDetails>
      <h3 className="subheading">Tools they use today</h3>
      <p className="section-intro">
        Include any AI tools they already use. Names and known costs are enough
        for now.
      </p>
      <SoftwareRows compact />
    </>
  );
}

function AIReview({ session }: { session: Session }) {
  const otherCases = CLASSIFICATIONS.filter(
    (option) => !commonUseCases.includes(option),
  );
  const otherSelected = session.worksheet.classifications.filter((option) =>
    otherCases.includes(option as (typeof CLASSIFICATIONS)[number]),
  ).length;
  return (
    <>
      <h3 className="question-heading">Where could AI help?</h3>
      <p className="section-intro use-case-explanation">
        These are <strong>possible future uses</strong> for this workflow. They
        do not need to be using AI already. Choose a possibility if it is clear;
        otherwise leave it for after the call.
      </p>
      <Checklist
        name="worksheet.classifications"
        options={commonUseCases}
        labels={useCaseLabels}
      />
      <OptionalDetails
        title={
          "More possibilities & other outcomes" +
          (otherSelected ? " · " + otherSelected + " selected" : "")
        }
      >
        <Checklist
          name="worksheet.classifications"
          options={otherCases}
          labels={useCaseLabels}
        />
      </OptionalDetails>
      <h3 className="subheading">Who checks the work?</h3>
      <Fields
        items={[
          w("reviewer", "Who will check the AI's work?", "text"),
          w("reviewOutput", "What needs checking before the result is used?"),
          w("wrongResult", "What happens if the result is wrong?"),
          {
            ...w(
              "dataRights",
              "Is the business allowed to use this information?",
              "select",
              yesNo,
            ),
            help: "If permission is unclear, choose Unknown and confirm before implementation.",
          },
        ]}
      />
      <h3 className="subheading">
        Does this involve sensitive information or important decisions?
      </h3>
      <Checklist
        name="worksheet.riskAreas"
        options={RISK_AREAS}
        labels={riskLabels}
      />
      <OptionalDetails title="Additional review & safety details">
        <Fields
          items={[
            w(
              "correctable",
              "Can a mistake be corrected before affecting a customer?",
              "select",
              yesNo,
            ),
            w("sensitivity", "How sensitive is the information?", "select", [
              "Low",
              "Moderate",
              "High",
            ]),
            w(
              "escalation",
              "Is there someone to handle exceptions?",
              "select",
              yesNo,
            ),
            w(
              "autonomous",
              "Must the system act without a person checking it?",
              "select",
              yesNo,
            ),
            {
              ...w("controls", "Checks or safeguards to put in place"),
              wide: true,
            },
          ]}
        />
      </OptionalDetails>
      <p className="scope-referral audit-scope-note">
        Marketing or lead generation is outside this audit — refer to Justin.
      </p>
    </>
  );
}

function WrapUp({ session }: { session: Session }) {
  const fit = pilotFit(session);
  return (
    <>
      <Fields
        items={[
          w("decision", "What should we do next?", "select", DECISIONS),
          {
            ...w("nextStep", "Agreed next step & anything to follow up"),
            help: "Who will do what next? Include information that was unknown during the call.",
          },
        ]}
      />
      <OptionalDetails
        title="After the call: internal assessment"
        hint="Optional consultant notes and scoring. These are not questions you need to read to the client."
      >
        <Fields
          items={[
            {
              ...w("rationale", "Internal Recommendation Rationale"),
              wide: true,
              help: "Excluded from client documents unless explicitly enabled.",
            },
          ]}
        />
        <div className="score-banner">
          <div>
            <span className="eyebrow">INTERNAL PILOT-FIT SCORE</span>
            <strong>
              {fit.score === null
                ? "Not established"
                : Math.round(fit.score) + " / 100"}
            </strong>
            <p>{fit.label}</p>
          </div>
          <p>
            Internal decision support based on audit inputs.
            <br />
            <small>
              Rate each factor from 1–5. Higher is stronger, except operational
              risk: 1 = low risk, 5 = high risk.
            </small>
          </p>
        </div>
        <FitRatings />
      </OptionalDetails>
    </>
  );
}

function WorkflowSteps() {
  const { control } = useFormContext<Session>();
  const { fields, append, remove, insert, move } = useFieldArray({
    control,
    name: "steps",
    keyName: "fieldKey",
  });
  const { getValues } = useFormContext<Session>();
  return (
    <div className="repeat-rows">
      {fields.map((step, i) => (
        <section className="line-item" key={step.fieldKey}>
          <div className="line-heading">
            <h3>Step {i + 1}</h3>
            <div className="line-actions">
              <button
                type="button"
                className="icon-button"
                disabled={i === 0}
                aria-label={`Move step ${i + 1} up`}
                onClick={() => move(i, i - 1)}
              >
                <ArrowUp size={15} />
              </button>
              <button
                type="button"
                className="icon-button"
                disabled={i === fields.length - 1}
                aria-label={`Move step ${i + 1} down`}
                onClick={() => move(i, i + 1)}
              >
                <ArrowDown size={15} />
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label={`Duplicate step ${i + 1}`}
                onClick={() =>
                  insert(i + 1, {
                    ...getValues(`steps.${i}`),
                    id: crypto.randomUUID(),
                  })
                }
              >
                <Copy size={15} />
              </button>
              <button
                type="button"
                className="icon-button danger-text"
                aria-label={`Remove step ${i + 1}`}
                onClick={() => {
                  if (confirm(`Remove step ${i + 1}?`)) remove(i);
                }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
          <Fields
            items={[
              ["name", "Step name", "text"],
              ["role", "Person or role responsible", "text"],
              ["software", "Software used", "text"],
              ["minutes", "Time required (minutes)", "number"],
            ].map(([name, label, type]) => ({
              name: `steps.${i}.${name}`,
              label: label as string,
              type: type as FieldSpec["type"],
            }))}
          />
          <OptionalDetails title={`Step ${i + 1}: more detail`}>
            <Fields
              items={[
                [
                  "mode",
                  "Manual or automated",
                  "select",
                  ["Manual", "Automated", "Mixed"],
                ],
                ["input", "Information received", "textarea"],
                ["output", "Information produced", "textarea"],
                ["problem", "Common problem or delay", "textarea"],
                ["removable", "Can this step be removed?", "select", yesNo],
                ["aiAssist", "Could AI assist this step?", "select", yesNo],
                [
                  "approval",
                  "Does it require human approval?",
                  "select",
                  yesNo,
                ],
              ].map(([name, label, type, options]) => ({
                name: `steps.${i}.${name}`,
                label: label as string,
                type: type as FieldSpec["type"],
                options: options as string[] | undefined,
              }))}
            />
          </OptionalDetails>
        </section>
      ))}
      {fields.length === 0 && (
        <p className="empty-hint">
          Walk through one recent example. Add each handoff as a step.
        </p>
      )}
      <button
        type="button"
        className="button secondary"
        onClick={() => append(newStep())}
      >
        <Plus size={16} />
        Add workflow step
      </button>
    </div>
  );
}
export function SoftwareRows({ compact = false }: { compact?: boolean }) {
  const { control } = useFormContext<Session>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "software",
    keyName: "fieldKey",
  });
  return (
    <div className="repeat-rows">
      <p className="muted">
        These records also drive subscription estimates in the calculator. Enter
        0 explicitly when a tool has no cost.
      </p>
      {fields.map((tool, i) => (
        <section className="line-item" key={tool.fieldKey}>
          <div className="line-heading">
            <h3>Software {i + 1}</h3>
            <button
              type="button"
              className="icon-button danger-text"
              aria-label={`Remove software ${i + 1}`}
              onClick={() => {
                if (
                  confirm(`Remove software ${i + 1} and its cost assumptions?`)
                )
                  remove(i);
              }}
            >
              <Trash2 size={15} />
            </button>
          </div>
          {(() => {
            const items: FieldSpec[] = [
              ["name", "Software name", "text"],
              ["purpose", "Purpose", "text"],
              ["currentMonthly", "Current monthly cost", "number"],
              ["futureMonthly", "Expected future monthly cost", "number"],
              ["users", "Number of users", "number"],
              ["required", "Is it required?", "select", yesNo],
              [
                "overlap",
                "Does it overlap with another tool?",
                "select",
                yesNo,
              ],
              [
                "integration",
                "API, integration, or export method?",
                "select",
                [
                  "API available",
                  "Native integration",
                  "Export available",
                  "None",
                  "Unknown",
                ],
              ],
              [
                "action",
                "Current action",
                "select",
                ["Keep", "Reduce", "Replace", "Remove", "Unknown"],
              ],
              ["notes", "Software notes", "textarea"],
            ].map(([name, label, type, options]) => ({
              name: `software.${i}.${name}`,
              label: label as string,
              type: type as FieldSpec["type"],
              options: options as string[] | undefined,
            }));
            return compact ? (
              <>
                <Fields
                  items={items.filter(
                    (f) =>
                      f.name.endsWith(".name") ||
                      f.name.endsWith(".currentMonthly"),
                  )}
                />
                <OptionalDetails
                  title={`Software ${i + 1}: costs & connection details`}
                  hint="Confirm future costs and technical connections after the call if they are not known."
                >
                  <Fields
                    items={items.filter(
                      (f) =>
                        !f.name.endsWith(".name") &&
                        !f.name.endsWith(".currentMonthly"),
                    )}
                  />
                </OptionalDetails>
              </>
            ) : (
              <Fields items={items} />
            );
          })()}
        </section>
      ))}
      <button
        type="button"
        className="button secondary"
        onClick={() => append(newSoftware())}
      >
        <Plus size={16} />
        Add software
      </button>
    </div>
  );
}
function FitRatings() {
  const { control } = useFormContext<Session>();
  return (
    <div className="fit-ratings">
      {FIT_LABELS.map((label, i) => (
        <Controller
          key={label}
          control={control}
          name={`worksheet.fit.${i}`}
          render={({ field }) => (
            <div className="fit-rating">
              <label htmlFor={`rating-${i}`}>
                {label}
                {i === 9 && (
                  <small>Reverse scored · lower risk is a stronger fit</small>
                )}
              </label>
              <select
                id={`rating-${i}`}
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
              >
                <option value="">Not rated</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option value={n} key={n}>
                    {n} —{" "}
                    {i === 9
                      ? [
                          "Low risk",
                          "Limited risk",
                          "Moderate risk",
                          "Significant risk",
                          "High risk",
                        ][n - 1]
                      : ["Weak", "Limited", "Moderate", "Good", "Strong"][
                          n - 1
                        ]}
                  </option>
                ))}
              </select>
            </div>
          )}
        />
      ))}
    </div>
  );
}
