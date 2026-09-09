import type {
  Settings,
  Session,
  WorkflowStep,
  Software,
  Labor,
  Rework,
  RecurringCost,
  Deliverable,
  Milestone,
} from "./types";
import { ASSESSMENT_SCORE_MAX, DEFAULT_ACCENT } from "./constants";

export const id = () => crypto.randomUUID();
export function defaultSettings(): Settings {
  return {
    company: "",
    service: "AI Operations",
    consultant: "",
    email: "",
    phone: "",
    address: "",
    currency: "USD",
    weeks: 50,
    stabilization: "",
    accent: DEFAULT_ACCENT,
    logo: "",
    footer:
      "Estimates are based on information provided during the audit and should be validated during implementation.",
  };
}
export const newStep = (): WorkflowStep => ({
  id: id(),
  name: "",
  role: "",
  software: "",
  minutes: null,
  mode: "",
  input: "",
  output: "",
  problem: "",
  removable: "",
  aiAssist: "",
  approval: "",
});
export const newSoftware = (): Software => ({
  id: id(),
  name: "",
  purpose: "",
  currentMonthly: null,
  users: null,
  required: "",
  overlap: "",
  integration: "",
  action: "Unknown",
  futureMonthly: null,
  notes: "",
});
export const newLabor = (): Labor => ({
  id: id(),
  role: "",
  hours: null,
  rate: null,
  reduction: null,
  notes: "",
});
export const newRework = (): Rework => ({
  id: id(),
  name: "",
  incidents: null,
  cost: null,
  reduction: null,
});
export const newRecurring = (): RecurringCost => ({
  id: id(),
  name: "",
  category: "Other",
  monthly: null,
  annual: null,
  notes: "",
});
export const newDeliverable = (): Deliverable => ({
  id: id(),
  text: "",
  included: false,
});
export const newMilestone = (): Milestone => ({
  id: id(),
  name: "",
  days: null,
  outcome: "",
});
export function newSession(
  settings = defaultSettings(),
  query?: URLSearchParams,
): Session {
  const now = new Date().toISOString();
  const date = new Date();
  const localDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const s: Session = {
    id: id(),
    createdAt: now,
    updatedAt: now,
    status: "Scheduled",
    archived: false,
    demo: false,
    client: {
      business: "",
      contact: "",
      title: "",
      email: "",
      phone: "",
      location: "",
      industry: "",
      website: "",
      employees: null,
      revenue: "",
      currency: settings.currency,
      auditDate: localDate,
      referral: "",
      notes: "",
      score: null,
      tier: "",
      priority: "",
      assessmentComments: "",
    },
    worksheet: {
      reason: "",
      frustration: "",
      stopDoing: "",
      objective: "",
      workflowName: "",
      department: "",
      owner: "",
      people: "",
      trigger: "",
      output: "",
      frequency: "",
      occurrences: null,
      seasonality: "",
      selectionReason: "",
      baselineHours: null,
      baselineRoles: "",
      baselineRate: null,
      baselineOccurrences: null,
      minutesPerOccurrence: null,
      turnaround: "",
      errors: "",
      backlog: "",
      baseline: "",
      tracking: "",
      classifications: [],
      reviewOutput: "",
      reviewer: "",
      wrongResult: "",
      correctable: "",
      riskAreas: [],
      sensitivity: "",
      escalation: "",
      autonomous: "",
      dataRights: "",
      controls: "",
      fit: Array(10).fill(null),
      decision: "",
      rationale: "",
      nextStep: "",
    },
    steps: [],
    software: [],
    calculator: {
      weeks: settings.weeks,
      labor: [],
      rework: [],
      recurring: [],
      avoidedHire: {
        role: "",
        annualCost: null,
        percentage: null,
        include: false,
      },
      price: null,
      discount: null,
      pricingNotes: "",
    },
    recommendation: {
      generatedAt: null,
      sourceFingerprint: "",
      includeInvestment: false,
      includeRationale: false,
      objective: "",
      bottleneck: "",
      baseline: "",
      opportunity: "",
      trigger: "",
      action: "",
      review: "",
      output: "",
      impact: "",
      pilot: "",
      risks: "",
      nextStep: "",
    },
    proposal: {
      generatedAt: null,
      sourceFingerprint: "",
      legalName: "",
      contact: "",
      projectName: "",
      date: "",
      expires: "",
      objective: "",
      currentState: "",
      solution: "",
      scope: "",
      systems: "",
      deliverables: [],
      baselineMetric: "",
      targetMetric: "",
      sampleSize: null,
      standard: "",
      testingResponsibility: "",
      acceptanceDeadline: "",
      milestones: [],
      paymentPreset: "",
      deposit: null,
      paymentSchedule: "",
      thirdParty: "",
      responsibilities: "",
      exclusions: "",
      privacy: "",
      changeOrders: "",
      stabilization: settings.stabilization,
      corrections: "",
      supportIncluded: "",
      monthlySupport: null,
      response: "",
      caseStudy: "",
      clientSignName: "",
      clientSignTitle: "",
      clientSignDate: "",
      representative: settings.consultant,
      representativeDate: "",
    },
    callNotes: "",
    timer: { remainingSeconds: 1800, runningSince: null, visible: false },
  };
  if (query) {
    for (const key of ["business", "contact", "priority"] as const)
      s.client[key] = (query.get(key) ?? "").slice(0, 500);
    const email = query.get("email") ?? "";
    if (email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      s.client.email = email;
    const score = query.get("score");
    if (
      score?.trim() &&
      Number.isInteger(Number(score)) &&
      Number(score) >= 0 &&
      Number(score) <= ASSESSMENT_SCORE_MAX
    )
      s.client.score = Number(score);
    const tier = query.get("tier") ?? "";
    if (
      [
        "Targeted Opportunity",
        "Strong Opportunity",
        "High-Impact Opportunity",
      ].includes(tier)
    )
      s.client.tier = tier;
  }
  return s;
}
export function demoSession(settings = defaultSettings()): Session {
  const s = newSession(settings);
  s.demo = true;
  s.status = "Audit In Progress";
  Object.assign(s.client, {
    business: "Pine & Field Services — Demo Data",
    contact: "Alex Example",
    industry: "Fictional field services",
    employees: 8,
    location: "Fictional U.S. business",
    notes: "Demo Data — fictional example. All assumptions are illustrative.",
  });
  Object.assign(s.worksheet, {
    objective: "Save labor hours",
    reason: "Reduce repetitive service-report administration.",
    frustration: "Field notes are copied into a report and checked manually.",
    workflowName: "Service report preparation",
    department: "Operations",
    owner: "Office manager",
    trigger: "Completed field notes arrive",
    output: "Approved service report in client-owned records",
    frequency: "Weekly",
    occurrences: 20,
    baseline: "Track preparation time for 20 representative service reports.",
    tracking: "Weekly time log",
    reviewer: "Office manager",
    reviewOutput: "Every drafted report before use",
    correctable: "Yes",
    autonomous: "No",
    dataRights: "Yes",
    sensitivity: "Moderate",
    escalation: "Yes",
    controls:
      "Review names, dates, amounts, and required fields before approving each report.",
    classifications: ["AI report drafting"],
    fit: [4, 4, 3, 4, 4, 3, 3, 5, 4, 2],
    nextStep: "Confirm sample inputs and the review checklist.",
  });
  s.steps = [
    {
      ...newStep(),
      name: "Receive field notes",
      role: "Office coordinator",
      mode: "Manual",
      minutes: 5,
      input: "Field notes",
      output: "Organized notes",
    },
    {
      ...newStep(),
      name: "Draft and review report",
      role: "Office manager",
      mode: "Manual",
      minutes: 25,
      input: "Organized notes",
      output: "Approved service report",
      approval: "Yes",
      aiAssist: "Yes",
    },
  ];
  s.calculator.labor = [
    {
      ...newLabor(),
      role: "Office coordinator",
      hours: 10,
      rate: 30,
      reduction: 50,
    },
  ];
  s.software = [
    {
      ...newSoftware(),
      name: "Example reporting tool",
      purpose: "Reports",
      currentMonthly: 300,
      futureMonthly: 100,
      action: "Reduce",
      integration: "Unknown",
    },
  ];
  s.calculator.rework = [
    {
      ...newRework(),
      name: "Report corrections",
      incidents: 4,
      cost: 100,
      reduction: 50,
    },
  ];
  s.calculator.recurring = [
    {
      ...newRecurring(),
      name: "Illustrative automation cost",
      category: "Automation software",
      monthly: 100,
      annual: 0,
    },
  ];
  return s;
}
