import { z } from "zod";
import { ASSESSMENT_SCORE_MAX } from "./constants";

export const INTAKE_LOCATION_ID = "sNxq4o3kG3iH5yoQ71Oq";
export const INTAKE_CALENDAR_ID = "tFmtpPmm23VC7ygrKxvK";
export const MAX_INTAKE_BYTES = 512_000;

const text = z.string().max(12000);
const identity = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/);
const timestamp = z.iso.datetime({ offset: true });
const nonnegative = z.number().finite().min(0).max(1_000_000_000);
const tier = z.enum([
  "Targeted Opportunity",
  "Strong Opportunity",
  "High-Impact Opportunity",
]);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = Date.parse(value);
    return (
      Number.isFinite(parsed) &&
      new Date(parsed).toISOString().slice(0, 10) === value
    );
  }, "Use a valid calendar date.");
const email = z.union([z.literal(""), z.email().max(254)]);
const sourceUrl = z
  .url()
  .max(2048)
  .refine((value) => {
    const url = new URL(value);
    return (
      ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password
    );
  }, "Use an HTTP or HTTPS source URL without credentials.");

// These are the only audit fields an intake adapter can explicitly populate.
// Financial line items, scores for pilot fit, decisions, private notes and documents
// are deliberately excluded. Original answers are retained without interpretation.
export const intakeMappedFieldsSchema = z.strictObject({
  "client.business": text.optional(),
  "client.contact": text.optional(),
  "client.title": text.optional(),
  "client.email": email.optional(),
  "client.phone": text.optional(),
  "client.location": text.optional(),
  "client.industry": text.optional(),
  "client.website": text.optional(),
  "client.employees": z.number().int().min(0).max(1_000_000).optional(),
  "client.revenue": text.optional(),
  "client.currency": z.enum(["USD", "CAD"]).optional(),
  "client.auditDate": date.optional(),
  "client.referral": text.optional(),
  "client.score": z.number().int().min(0).max(ASSESSMENT_SCORE_MAX).optional(),
  "client.tier": tier.optional(),
  "client.priority": text.optional(),
  "client.assessmentComments": text.optional(),
  "worksheet.reason": text.optional(),
  "worksheet.frustration": text.optional(),
  "worksheet.stopDoing": text.optional(),
  "worksheet.objective": text.optional(),
  "worksheet.workflowName": text.optional(),
  "worksheet.department": text.optional(),
  "worksheet.owner": text.optional(),
  "worksheet.people": text.optional(),
  "worksheet.trigger": text.optional(),
  "worksheet.output": text.optional(),
  "worksheet.frequency": text.optional(),
  "worksheet.occurrences": nonnegative.optional(),
  "worksheet.seasonality": text.optional(),
  "worksheet.selectionReason": text.optional(),
  "worksheet.baselineHours": nonnegative.optional(),
  "worksheet.baselineRoles": text.optional(),
  "worksheet.baselineRate": nonnegative.optional(),
  "worksheet.baselineOccurrences": nonnegative.optional(),
  "worksheet.minutesPerOccurrence": nonnegative.optional(),
  "worksheet.turnaround": text.optional(),
  "worksheet.errors": text.optional(),
  "worksheet.backlog": text.optional(),
  "worksheet.baseline": text.optional(),
  "worksheet.tracking": text.optional(),
});
export type IntakeMappedFields = z.infer<typeof intakeMappedFieldsSchema>;
export type IntakeMappedField = keyof IntakeMappedFields;

const answerScalar = z.union([
  text,
  z.number().finite(),
  z.boolean(),
  z.null(),
]);
export const intakeAssessmentSchema = z
  .strictObject({
    sourceId: identity,
    submissionId: identity,
    version: z.string().min(1).max(128),
    submittedAt: timestamp,
    answers: z
      .array(
        z.strictObject({
          id: z.string().min(1).max(256),
          question: text,
          value: z.union([answerScalar, z.array(answerScalar).max(100)]),
        }),
      )
      .max(200)
      .refine(
        (answers) =>
          new Set(answers.map((answer) => answer.id)).size === answers.length,
        "Answer IDs must be unique within a submission.",
      ),
    score: z.number().int().min(0).max(ASSESSMENT_SCORE_MAX).optional(),
    scoreMax: z.literal(ASSESSMENT_SCORE_MAX).optional(),
    tier: z.string().max(256).optional(),
  })
  .superRefine((assessment, ctx) => {
    if (
      assessment.score !== undefined &&
      assessment.scoreMax !== ASSESSMENT_SCORE_MAX
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["scoreMax"],
        message:
          "A supplied assessment score requires scoreMax: 21. Scores are never rescaled.",
      });
    }
  });
export type IntakeAssessment = z.infer<typeof intakeAssessmentSchema>;

export const intakeResearchSchema = z.strictObject({
  facts: z
    .array(
      z.strictObject({
        text,
        sourceUrl,
        sourceTitle: z.string().min(1).max(512),
        accessedAt: timestamp,
      }),
    )
    .max(50),
  suggestedQuestions: z.array(text).max(50),
});

export const intakePacketSchema = z
  .strictObject({
    version: z.literal(1),
    locationId: z.literal(INTAKE_LOCATION_ID),
    calendarId: z.literal(INTAKE_CALENDAR_ID),
    appointmentId: identity,
    contactId: identity,
    updatedAt: timestamp,
    startsAt: timestamp,
    timezone: z
      .string()
      .min(1)
      .max(128)
      .refine((value) => {
        // Intl uses the runtime's IANA time-zone database; numeric offsets are not zones.
        if (/^[+-]/.test(value)) return false;
        try {
          new Intl.DateTimeFormat("en", { timeZone: value });
          return true;
        } catch {
          return false;
        }
      }, "Use a valid IANA timezone, such as America/Edmonton."),
    bookingStatus: z.enum([
      "scheduled",
      "confirmed",
      "cancelled",
      "completed",
      "no-show",
    ]),
    contact: z
      .strictObject({
        business: text.optional(),
        name: text.optional(),
        title: text.optional(),
        email: email.optional(),
        phone: text.optional(),
        location: text.optional(),
        industry: text.optional(),
        website: text.optional(),
      })
      .optional(),
    assessment: intakeAssessmentSchema.optional(),
    mappedFields: intakeMappedFieldsSchema.optional(),
    research: intakeResearchSchema.optional(),
  })
  .superRefine((packet, ctx) => {
    const score = packet.mappedFields?.["client.score"];
    if (
      score !== undefined &&
      (packet.assessment?.scoreMax !== ASSESSMENT_SCORE_MAX ||
        packet.assessment.score !== score)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["mappedFields", "client.score"],
        message:
          "Mapped score must match the supplied assessment score with scoreMax: 21.",
      });
    }
    const mappedTier = packet.mappedFields?.["client.tier"];
    if (
      mappedTier !== undefined &&
      (packet.assessment?.scoreMax !== ASSESSMENT_SCORE_MAX ||
        packet.assessment.tier !== mappedTier)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["mappedFields", "client.tier"],
        message:
          "Mapped tier must match the supplied assessment tier with scoreMax: 21.",
      });
    }
  });
export type IntakePacket = z.infer<typeof intakePacketSchema>;

const mappedField = z.enum(
  Object.keys(intakeMappedFieldsSchema.shape) as [
    IntakeMappedField,
    ...IntakeMappedField[],
  ],
);
const fieldValue = z.union([text, nonnegative, z.null()]);
export const intakeConflictSchema = z.strictObject({
  field: mappedField,
  previousImported: fieldValue.optional(),
  current: z.union([z.string().max(32000), nonnegative, z.null()]),
  incoming: fieldValue,
  reason: z.literal("manual-edit"),
});
export type IntakeConflict = z.infer<typeof intakeConflictSchema>;
export const intakeMetadataSchema = z.strictObject({
  packet: intakePacketSchema,
  importedFields: intakeMappedFieldsSchema,
  conflicts: z.array(intakeConflictSchema).max(100),
  assessmentHistory: z.array(intakeAssessmentSchema).max(50),
});
export type IntakeMetadata = z.infer<typeof intakeMetadataSchema>;
