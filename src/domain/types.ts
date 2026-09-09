import type { IntakeMetadata } from "./intakeSchema";

export type Currency = "USD" | "CAD";
export type Amount = number | null;
export const STATUSES = [
  "Scheduled",
  "Audit In Progress",
  "Recommendation Draft",
  "Proposal Draft",
  "Proposal Sent",
  "Won",
  "Lost",
  "Not a Fit",
  "Referred to Justin",
] as const;
export type Status = (typeof STATUSES)[number];
export const DECISIONS = [
  "Proceed with AI pilot",
  "Additional discovery required",
  "Process cleanup required first",
  "Software consolidation only",
  "Not currently recommended",
  "Refer marketing request to Justin",
] as const;
export const CLASSIFICATIONS = [
  "AI document extraction",
  "AI document summarization",
  "AI email or information classification",
  "AI task routing",
  "AI report drafting",
  "AI estimate or document drafting",
  "AI internal knowledge assistant",
  "AI SOP assistant",
  "AI data-entry assistance",
  "AI meeting or field-note processing",
  "AI information normalization",
  "AI-assisted software synchronization",
  "Rules-based automation with an AI step",
  "Software consolidation",
  "Process redesign before AI",
  "Not currently suitable for AI",
  "Marketing or lead generation — refer to Justin",
  "Other",
] as const;
export const RISK_AREAS = [
  "Financial decisions",
  "Employment decisions",
  "Medical information",
  "Legal advice",
  "Safety-critical decisions",
  "Personally identifiable information",
  "Confidential business data",
  "Customer communications",
  "None of these",
] as const;
export const FIT_LABELS = [
  "Process repeatability",
  "Frequency and volume",
  "Input consistency",
  "Output consistency",
  "Data availability",
  "Baseline measurability",
  "Integration feasibility",
  "Human-review feasibility",
  "Owner and employee readiness",
  "Operational risk",
] as const;
export interface Client {
  business: string;
  contact: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  industry: string;
  website: string;
  employees: Amount;
  revenue: string;
  currency: Currency;
  auditDate: string;
  referral: string;
  notes: string;
  score: Amount;
  tier: string;
  priority: string;
  assessmentComments: string;
}
export interface WorkflowStep {
  id: string;
  name: string;
  role: string;
  software: string;
  minutes: Amount;
  mode: string;
  input: string;
  output: string;
  problem: string;
  removable: string;
  aiAssist: string;
  approval: string;
}
export interface Software {
  id: string;
  name: string;
  purpose: string;
  currentMonthly: Amount;
  users: Amount;
  required: string;
  overlap: string;
  integration: string;
  action: string;
  futureMonthly: Amount;
  notes: string;
}
export interface Labor {
  id: string;
  role: string;
  hours: Amount;
  rate: Amount;
  reduction: Amount;
  notes: string;
}
export interface Rework {
  id: string;
  name: string;
  incidents: Amount;
  cost: Amount;
  reduction: Amount;
}
export interface RecurringCost {
  id: string;
  name: string;
  category: string;
  monthly: Amount;
  annual: Amount;
  notes: string;
}
export interface Worksheet {
  reason: string;
  frustration: string;
  stopDoing: string;
  objective: string;
  workflowName: string;
  department: string;
  owner: string;
  people: string;
  trigger: string;
  output: string;
  frequency: string;
  occurrences: Amount;
  seasonality: string;
  selectionReason: string;
  baselineHours: Amount;
  baselineRoles: string;
  baselineRate: Amount;
  baselineOccurrences: Amount;
  minutesPerOccurrence: Amount;
  turnaround: string;
  errors: string;
  backlog: string;
  baseline: string;
  tracking: string;
  classifications: string[];
  reviewOutput: string;
  reviewer: string;
  wrongResult: string;
  correctable: string;
  riskAreas: string[];
  sensitivity: string;
  escalation: string;
  autonomous: string;
  dataRights: string;
  controls: string;
  fit: (number | null)[];
  decision: string;
  rationale: string;
  nextStep: string;
}
export interface Calculator {
  weeks: number;
  labor: Labor[];
  rework: Rework[];
  recurring: RecurringCost[];
  avoidedHire: {
    role: string;
    annualCost: Amount;
    percentage: Amount;
    include: boolean;
  };
  price: Amount;
  discount: Amount;
  pricingNotes: string;
}
export interface Recommendation {
  generatedAt: string | null;
  sourceFingerprint: string;
  includeInvestment: boolean;
  includeRationale: boolean;
  objective: string;
  bottleneck: string;
  baseline: string;
  opportunity: string;
  trigger: string;
  action: string;
  review: string;
  output: string;
  impact: string;
  pilot: string;
  risks: string;
  nextStep: string;
}
export interface Deliverable {
  id: string;
  text: string;
  included: boolean;
}
export interface Milestone {
  id: string;
  name: string;
  days: Amount;
  outcome: string;
}
export interface Proposal {
  generatedAt: string | null;
  sourceFingerprint: string;
  legalName: string;
  contact: string;
  projectName: string;
  date: string;
  expires: string;
  objective: string;
  currentState: string;
  solution: string;
  scope: string;
  systems: string;
  deliverables: Deliverable[];
  baselineMetric: string;
  targetMetric: string;
  sampleSize: Amount;
  standard: string;
  testingResponsibility: string;
  acceptanceDeadline: string;
  milestones: Milestone[];
  paymentPreset: string;
  deposit: Amount;
  paymentSchedule: string;
  thirdParty: string;
  responsibilities: string;
  exclusions: string;
  privacy: string;
  changeOrders: string;
  stabilization: string;
  corrections: string;
  supportIncluded: string;
  monthlySupport: Amount;
  response: string;
  caseStudy: string;
  clientSignName: string;
  clientSignTitle: string;
  clientSignDate: string;
  representative: string;
  representativeDate: string;
}
export interface Session {
  intake?: IntakeMetadata;
  id: string;
  createdAt: string;
  updatedAt: string;
  status: Status;
  archived: boolean;
  demo: boolean;
  client: Client;
  worksheet: Worksheet;
  steps: WorkflowStep[];
  software: Software[];
  calculator: Calculator;
  recommendation: Recommendation;
  proposal: Proposal;
  callNotes: string;
  timer: {
    remainingSeconds: number;
    runningSince: number | null;
    visible: boolean;
  };
}
export interface Settings {
  company: string;
  service: string;
  consultant: string;
  email: string;
  phone: string;
  address: string;
  currency: Currency;
  weeks: number;
  stabilization: string;
  accent: string;
  logo: string;
  footer: string;
}
export interface Store {
  dismissedMeetings?: string[];
  version: 1;
  sessions: Session[];
  settings: Settings;
  lastExport: string | null;
  lastSaved: string | null;
}
export interface Calculation {
  weeklyHours: number | null;
  annualHours: number | null;
  currentHours: number | null;
  currentLabor: number | null;
  labor: number | null;
  currentSoftware: number | null;
  futureSoftware: number | null;
  subscriptions: number | null;
  rework: number | null;
  avoidedHire: number | null;
  recurring: number | null;
  gross: number | null;
  net: number | null;
  finalPrice: number | null;
  firstYear: number | null;
  payback: number | null;
  roi: number | null;
  multiple: number | null;
  warnings: string[];
  incomplete: boolean;
}
export interface RiskWarning {
  code: string;
  message: string;
  hardStop: boolean;
}
