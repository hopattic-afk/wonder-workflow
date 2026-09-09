import { z } from "zod";
import { ASSESSMENT_SCORE_MAX } from "./constants";
import { intakeMetadataSchema } from "./intakeSchema";
import { CLASSIFICATIONS, DECISIONS, RISK_AREAS, STATUSES } from "./types";
import type { Settings, Session, Store } from "./types";

const text = z.string().max(32000);
const fields = (names: string) =>
  Object.fromEntries(names.split(" ").map((name) => [name, text]));
const identifier = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[a-zA-Z0-9_-]+$/);
const amount = z.number().finite().min(0).max(1_000_000_000).nullable();
const count = z.number().int().min(0).max(1_000_000).nullable();
const percentage = z.number().finite().min(0).max(100).nullable();
const currency = z.enum(["USD", "CAD"]);
const timestamp = z.iso.datetime();
const day = z
  .string()
  .refine(
    (v) =>
      v === "" ||
      (/^\d{4}-\d{2}-\d{2}$/.test(v) &&
        !Number.isNaN(Date.parse(v)) &&
        new Date(v).toISOString().slice(0, 10) === v),
    "Use a valid date.",
  );
const email = z.union([z.literal(""), z.email().max(254)]);
const rows = <T extends z.ZodType>(schema: T) => z.array(schema).max(200);
export const settingsSchema = z.strictObject({
  ...fields("company service consultant phone address stabilization footer"),
  email,
  currency,
  weeks: z.number().finite().gt(0).max(52),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  logo: z
    .string()
    .max(2_000_000)
    .refine(
      (v) =>
        v === "" ||
        /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(v),
      "Use a local PNG, JPEG, or WebP logo.",
    ),
}) as unknown as z.ZodType<Settings>;
const stepSchema = z.strictObject({
  ...fields(
    "name role software mode input output problem removable aiAssist approval",
  ),
  id: identifier,
  minutes: amount,
});
const softwareSchema = z.strictObject({
  ...fields("name purpose required overlap integration action notes"),
  id: identifier,
  currentMonthly: amount,
  futureMonthly: amount,
  users: count,
});
const laborSchema = z.strictObject({
  ...fields("role notes"),
  id: identifier,
  hours: amount,
  rate: amount,
  reduction: percentage,
});
const reworkSchema = z.strictObject({
  ...fields("name"),
  id: identifier,
  incidents: amount,
  cost: amount,
  reduction: percentage,
});
const recurringSchema = z.strictObject({
  ...fields("name category notes"),
  id: identifier,
  monthly: amount,
  annual: amount,
});
const recommendationSchema = z.strictObject({
  ...fields(
    "objective bottleneck baseline opportunity trigger action review output impact pilot risks nextStep",
  ),
  generatedAt: timestamp.nullable(),
  sourceFingerprint: z.string().max(128),
  includeInvestment: z.boolean(),
  includeRationale: z.boolean(),
});
const proposalSchema = z.strictObject({
  ...fields(
    "legalName contact projectName objective currentState solution scope systems baselineMetric targetMetric standard testingResponsibility paymentPreset paymentSchedule thirdParty responsibilities exclusions privacy changeOrders stabilization corrections supportIncluded response caseStudy clientSignName clientSignTitle representative",
  ),
  date: day,
  expires: day,
  acceptanceDeadline: day,
  clientSignDate: day,
  representativeDate: day,
  generatedAt: timestamp.nullable(),
  sourceFingerprint: z.string().max(128),
  sampleSize: count,
  deliverables: rows(
    z.strictObject({ id: identifier, text, included: z.boolean() }),
  ),
  milestones: rows(
    z.strictObject({ ...fields("name outcome"), id: identifier, days: amount }),
  ),
  deposit: amount,
  monthlySupport: amount,
});
const rawSessionSchema = z.strictObject({
  intake: intakeMetadataSchema.optional(),
  id: identifier,
  createdAt: timestamp,
  updatedAt: timestamp,
  status: z.enum(STATUSES),
  archived: z.boolean(),
  demo: z.boolean(),
  client: z.strictObject({
    ...fields(
      "business contact title phone location industry website revenue referral notes priority assessmentComments",
    ),
    email,
    employees: count,
    currency,
    auditDate: day,
    score: z.number().int().min(0).max(ASSESSMENT_SCORE_MAX).nullable(),
    tier: z.enum([
      "",
      "Targeted Opportunity",
      "Strong Opportunity",
      "High-Impact Opportunity",
    ]),
  }),
  worksheet: z.strictObject({
    ...fields(
      "reason frustration stopDoing objective workflowName department owner people trigger output frequency seasonality selectionReason baselineRoles turnaround errors backlog baseline tracking reviewOutput reviewer wrongResult correctable sensitivity escalation autonomous dataRights controls rationale nextStep",
    ),
    occurrences: amount,
    baselineHours: amount,
    baselineRate: amount,
    baselineOccurrences: amount,
    minutesPerOccurrence: amount,
    classifications: z
      .array(z.enum(CLASSIFICATIONS))
      .max(CLASSIFICATIONS.length)
      .refine(
        (v) => new Set(v).size === v.length,
        "Duplicate classifications.",
      ),
    riskAreas: z
      .array(z.enum(RISK_AREAS))
      .max(RISK_AREAS.length)
      .refine((v) => new Set(v).size === v.length, "Duplicate risk areas."),
    fit: z.array(z.number().int().min(1).max(5).nullable()).length(10),
    decision: z.union([z.literal(""), z.enum(DECISIONS)]),
  }),
  steps: rows(stepSchema),
  software: rows(softwareSchema),
  calculator: z.strictObject({
    weeks: z.number().finite().gt(0).max(52),
    labor: rows(laborSchema),
    rework: rows(reworkSchema),
    recurring: rows(recurringSchema),
    avoidedHire: z.strictObject({
      role: text,
      annualCost: amount,
      percentage,
      include: z.boolean(),
    }),
    price: amount,
    discount: amount,
    pricingNotes: text,
  }),
  recommendation: recommendationSchema,
  proposal: proposalSchema,
  callNotes: text,
  timer: z.strictObject({
    remainingSeconds: z.number().int().min(0).max(1800),
    runningSince: z.number().int().min(0).max(8_640_000_000_000_000).nullable(),
    visible: z.boolean(),
  }),
});
export const sessionSchema = rawSessionSchema.superRefine((s, ctx) => {
  const ids = [
    ...s.steps,
    ...s.software,
    ...s.calculator.labor,
    ...s.calculator.rework,
    ...s.calculator.recurring,
    ...s.proposal.deliverables,
    ...s.proposal.milestones,
  ].map((r) => r.id);
  if (new Set(ids).size !== ids.length)
    ctx.addIssue({
      code: "custom",
      message: "Duplicate row IDs in a session.",
    });
}) as unknown as z.ZodType<Session>;
export const storeSchema = z
  .strictObject({
    version: z.literal(1),
    sessions: z.array(sessionSchema).max(500),
    dismissedMeetings: z
      .array(
        z
          .string()
          .min(5)
          .max(900)
          .regex(/^[A-Za-z0-9_.:-]+\/[A-Za-z0-9_.:-]+\/[A-Za-z0-9_.:-]+$/),
      )
      .max(10000)
      .optional(),
    settings: settingsSchema,
    lastExport: timestamp.nullable(),
    lastSaved: timestamp.nullable(),
  })
  .superRefine((store, ctx) => {
    if (new Set(store.sessions.map((s) => s.id)).size !== store.sessions.length)
      ctx.addIssue({ code: "custom", message: "Duplicate session IDs." });
  }) as z.ZodType<Store>;
