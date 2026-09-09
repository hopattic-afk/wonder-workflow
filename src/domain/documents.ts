import { calculate, money, riskWarnings } from "./calculations";
import {
  defaultSettings,
  newDeliverable,
  newMilestone,
  newSession,
} from "./defaults";
import type { Recommendation, Proposal, Session, Settings } from "./types";

const established = (value: string, max = 300) =>
  value.trim()
    ? value.trim().length > max
      ? `${value.trim().slice(0, max - 1)}…`
      : value.trim()
    : "Not established";
const number = (value: number | null) =>
  value === null
    ? "Not established"
    : new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(
        value,
      );
function decisionContext(s: Session) {
  const marketing = riskWarnings(s).some((w) => w.code === "marketing");
  const decision = marketing
    ? "Refer marketing request to Justin"
    : s.worksheet.decision;
  const options: Record<
    string,
    {
      label: string;
      action: string;
      nextStep: string;
      deliverables: string[];
      milestones: string[];
    }
  > = {
    "Proceed with AI pilot": {
      label: "Proceed with AI pilot",
      action: "Define and test one AI-assisted workflow with human review.",
      nextStep:
        "Confirm the workflow scope, required system access, success metric, and implementation terms.",
      deliverables: [
        "Current-state workflow confirmation",
        "Future-state workflow design",
        "AI prompt or instruction configuration",
        "Workflow automation configuration",
        "Software integration",
        "Human-review checkpoint",
        "Testing against agreed sample inputs",
        "Error handling",
        "Documentation",
        "Client training",
        "Launch support",
        "Stabilization period",
      ],
      milestones: [
        "Confirm scope and access",
        "Configure the workflow",
        "Test and obtain client acceptance",
        "Launch and stabilize",
      ],
    },
    "Additional discovery required": {
      label: "Additional discovery required",
      action:
        "Clarify inputs, baseline, access, and review requirements before proposing implementation.",
      nextStep:
        "Agree the discovery questions, representative samples, and evidence needed for a decision.",
      deliverables: [
        "Workflow discovery",
        "Baseline and sample review",
        "Access and review feasibility assessment",
      ],
      milestones: ["Agree discovery questions", "Review evidence and reassess"],
    },
    "Process cleanup required first": {
      label: "Process cleanup required first",
      action:
        "Standardize the process, inputs, and required output before considering automation.",
      nextStep:
        "Agree the process cleanup scope and reassess automation after the baseline is reliable.",
      deliverables: [
        "Current-state workflow confirmation",
        "Process and input standardization plan",
        "Baseline tracking plan",
      ],
      milestones: [
        "Confirm process issues",
        "Agree cleanup and reassessment criteria",
      ],
    },
    "Software consolidation only": {
      label: "Software consolidation only",
      action:
        "Review overlapping subscriptions and required capabilities; confirm data retention and access before any change.",
      nextStep:
        "Confirm required software capabilities, approved subscription changes, and expected costs.",
      deliverables: [
        "Software overlap review",
        "Required-capability confirmation",
        "Subscription change plan",
      ],
      milestones: [
        "Confirm required capabilities",
        "Agree subscription changes",
      ],
    },
    "Not currently recommended": {
      label: "Not currently recommended",
      action: "No implementation is proposed under the current audit decision.",
      nextStep:
        "Review the unresolved conditions and agree whether a later reassessment is appropriate.",
      deliverables: [],
      milestones: [],
    },
    "Refer marketing request to Justin": {
      label: "Refer marketing request to Justin",
      action:
        "Marketing work is out of scope for AI Operations. No AI Operations implementation is proposed for this request.",
      nextStep:
        "Arrange a marketing referral to Justin and confirm any separate internal operations need.",
      deliverables: [],
      milestones: [],
    },
  };
  return {
    ...(options[decision] ?? {
      label: "Decision not established",
      action:
        "This is an assessment draft. Establish the recommendation decision before proposing implementation.",
      nextStep:
        "Review the audit findings and select the recommendation decision.",
      deliverables: [],
      milestones: [],
    }),
    proceed: decision === "Proceed with AI pilot",
    marketing,
  };
}
function clientControls(s: Session): string {
  const w = s.worksheet;
  const parts: string[] = [];
  const areas = w.riskAreas.filter((v) => v !== "None of these");
  if (areas.length) parts.push(`Risk areas: ${areas.join(", ")}.`);
  if (w.sensitivity) parts.push(`Data sensitivity: ${w.sensitivity}.`);
  parts.push(`Data usage rights: ${established(w.dataRights, 50)}.`);
  if (w.wrongResult.trim())
    parts.push(`If an output is wrong: ${established(w.wrongResult, 120)}.`);
  if (w.correctable)
    parts.push(`Correctable before customer impact: ${w.correctable}.`);
  if (w.controls.trim())
    parts.push(`Controls: ${established(w.controls, 220)}.`);
  parts.push(`Escalation path: ${established(w.escalation, 60)}.`);
  if (riskWarnings(s).some((v) => v.code === "autonomous-high-risk"))
    parts.push("High-risk decisions must not be fully autonomous.");
  parts.push(
    "AI output may contain errors. A person must review consequential outputs before use.",
  );
  return parts.join(" ");
}
function fingerprint(value: unknown): string {
  // Change detection only, not a security or identity primitive.
  const input = JSON.stringify(value);
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++)
    hash = Math.imul(hash ^ input.charCodeAt(i), 16777619);
  return `v1-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
export function sourceFingerprint(
  s: Session,
  settings = defaultSettings(),
): string {
  const { notes: _notes, ...client } = s.client;
  const { rationale: _rationale, ...worksheet } = s.worksheet;
  const { pricingNotes: _pricingNotes, ...calculator } = s.calculator;
  return fingerprint({
    client,
    worksheet,
    calculator,
    software: s.software,
    steps: s.steps,
    settings,
  });
}
export function proposalSourceFingerprint(
  s: Session,
  settings = defaultSettings(),
): string {
  return fingerprint({
    source: sourceFingerprint(s, settings),
    recommendation: s.recommendation,
  });
}
export function proposalUsesStaleRecommendation(
  s: Session,
  settings = defaultSettings(),
): boolean {
  return (
    s.recommendation.generatedAt !== null &&
    s.recommendation.sourceFingerprint !== sourceFingerprint(s, settings)
  );
}
export function generateRecommendation(
  s: Session,
  settings: Settings,
): Recommendation {
  const w = s.worksheet;
  const c = calculate(s);
  const decision = decisionContext(s);
  const cost = (v: number | null) => money(v, s.client.currency);
  const action = w.classifications
    .filter((v) => !/Marketing|Other|Not currently suitable/i.test(v))
    .join("; ");
  const review = `${established(w.reviewer, 75)}: ${established(w.reviewOutput, 120)}`;
  const systems = s.software
    .map((v) => v.name.trim())
    .filter(Boolean)
    .join(", ");
  return {
    generatedAt: new Date().toISOString(),
    sourceFingerprint: sourceFingerprint(s, settings),
    includeInvestment: false,
    includeRationale: false,
    objective: established(w.reason || w.objective, 220),
    bottleneck: established(w.frustration || w.stopDoing, 220),
    baseline: `Hours/week: ${number(c.currentHours === 0 && !s.calculator.labor.length ? w.baselineHours : c.currentHours)}. Annual labor: ${s.calculator.labor.length ? cost(c.currentLabor) : "Not established"}. Annual software: ${s.software.length ? cost(c.currentSoftware) : "Not established"}. Turnaround: ${established(w.turnaround, 60)}. Rework: ${established(w.errors, 60)}.`,
    opportunity: decision.proceed
      ? `${decision.label}. Evaluate ${established(w.workflowName, 100)} as the first workflow. AI function: ${established(action, 130)}. Rules-based steps must be confirmed during scoping.`
      : `${decision.label}. ${decision.action}`,
    trigger: established(w.trigger, 110),
    action: decision.proceed ? established(action, 130) : decision.action,
    review,
    output: established(w.output, 110),
    impact: `${decision.proceed ? "" : "Scoping estimates only; they do not authorize implementation. "}Estimated weekly hours reclaimed: ${s.calculator.labor.length ? number(c.weeklyHours) : "Not established"}. Estimated annual labor savings: ${s.calculator.labor.length ? cost(c.labor) : "Not established"}. Estimated annual subscription savings: ${s.software.length ? cost(c.subscriptions) : "Not established"}. Estimated net annual recurring savings: ${cost(c.net)}. Estimated payback: ${c.payback === null ? "Not established" : `${number(c.payback)} months`}.`,
    pilot: decision.proceed
      ? `One workflow: ${established(w.workflowName, 80)}. Systems: ${established(systems, 90)}. AI function and human review as above. Success metric: ${established(w.baseline, 100)}. Agree a target and test against representative samples before use.`
      : `${decision.label}. ${decision.action}`,
    risks: clientControls(s),
    nextStep: decision.nextStep,
  };
}
export function generateProposal(s: Session, settings: Settings): Proposal {
  const w = s.worksheet;
  const decision = decisionContext(s);
  const r = s.recommendation.generatedAt
    ? s.recommendation
    : generateRecommendation(s, settings);
  const staleNotice = proposalUsesStaleRecommendation(s, settings)
    ? "Draft notice: the source recommendation uses earlier audit inputs. Review its edited content against the current audit before approval.\n"
    : "";
  // A changed decision takes precedence over an older generated recommendation.
  const currentRecommendation = generateRecommendation(s, settings);
  const base = newSession(settings).proposal;
  const deliverables = decision.deliverables;
  return {
    ...base,
    generatedAt: new Date().toISOString(),
    sourceFingerprint: proposalSourceFingerprint(s, settings),
    legalName: s.client.business,
    contact: s.client.contact,
    projectName: `${w.workflowName || "AI Operations assessment"} — ${decision.proceed ? "AI Operations pilot" : decision.label}`,
    date: new Date().toLocaleDateString("en-CA"),
    objective: r.objective,
    currentState: `${staleNotice}${r.bottleneck}\n${r.baseline}`,
    solution:
      staleNotice +
      (decision.proceed
        ? `${decision.label}.\n${r.opportunity}\nTrigger: ${r.trigger}\nAI or automation action: ${r.action}\nHuman review: ${r.review}\nFinal output: ${r.output}`
        : `${currentRecommendation.opportunity}\nNext step: ${decision.nextStep}`),
    scope: decision.proceed
      ? `Proposed first workflow: ${established(w.workflowName)}. Confirm boundaries, required access, review points, and acceptance criteria before approval. Only explicitly selected deliverables are included.`
      : `${decision.label}. ${decision.action} This draft does not include an AI implementation scope. Any approved work must be explicitly described and selected.`,
    systems: `Existing client software: ${established(
      s.software
        .map((v) => v.name)
        .filter(Boolean)
        .join(", "),
      2000,
    )}.\nNew software: Not established.\nThird-party services: Not established.\nClient-owned accounts and access: To be confirmed with the client.`,
    deliverables: deliverables.map((text) => ({ ...newDeliverable(), text })),
    baselineMetric: established(w.baseline),
    targetMetric: "",
    sampleSize: null,
    standard: "",
    testingResponsibility:
      "The client will provide representative sample inputs, participate in testing, and review results against the agreed acceptance criteria.",
    milestones: decision.milestones.map((name) => ({
      ...newMilestone(),
      name,
    })),
    thirdParty:
      "Third-party software, AI usage, messaging, API, hosting, and vendor charges are not included unless specifically listed. The client is responsible for ongoing third-party costs.",
    responsibilities: [
      "Provide accurate workflow information",
      "Provide access to required systems",
      "Provide representative sample documents or records",
      "Assign one decision-maker",
      "Participate in testing",
      "Review outputs within agreed timelines",
      "Maintain required third-party accounts",
      "Obtain any required employee, customer, or legal approvals",
    ].join("\n"),
    exclusions: [
      "Advertising",
      "Lead generation",
      "Marketing funnels",
      "SEO",
      "Social-media management",
      "Marketing campaigns",
      "Major data cleanup",
      "Full custom application development",
      "Workflows not listed in scope",
      "Additional integrations not listed in scope",
      "Legal, tax, regulatory, or cybersecurity certification",
      "Autonomous high-risk decision-making",
    ].join("\n"),
    privacy: `The client owns its client data. Access is limited to the minimum necessary for the agreed workflow. Human review is required where appropriate, including all consequential outputs. AI output is not guaranteed to be error-free. Client approval is required before customer-facing or financially consequential actions. No credentials are stored in the audit application. Additional terms may be required for sensitive or regulated information.\nAudit controls: ${clientControls(s)}\nReviewer: ${established(w.reviewer)}. Review required: ${established(w.reviewOutput)}.\nThe terms template should be reviewed by qualified counsel before broad commercial use.`,
    changeOrders:
      "Requests outside the approved scope will be documented and priced separately before additional work begins.",
    stabilization: settings.stabilization,
    corrections:
      "Corrections to agreed deliverables during the stabilization period, subject to the approved scope. Confirm the period and correction limits before approval.",
    response: "",
    clientSignName: s.client.contact,
    clientSignTitle: s.client.title,
    representative: settings.consultant,
  };
}
