import { z } from "zod";
import { ASSESSMENT_SCORE_MAX } from "./constants";
import {
  intakePacketSchema,
  INTAKE_CALENDAR_ID,
  INTAKE_LOCATION_ID,
  type IntakePacket,
} from "./intakeSchema";

export const ASSESSMENT_BOOKING_URL =
  "https://api.leadconnectorhq.com/widget/bookings/mccann-automation-discovery";
export const ASSESSMENT_SOURCE = "McCann AI Operations Assessment";
export const ASSESSMENT_SOURCE_ID = "mccann-ai-operations-assessment";

export const ORIGINAL_ASSESSMENT_QUESTIONS = [
  {
    key: "admin_time",
    label: "How much time does your team spend on repetitive admin each week?",
    options: ["Under 2 hours", "2–5 hours", "6–10 hours", "More than 10 hours"],
  },
  {
    key: "duplicate_entry",
    label: "How often do you copy the same information between places?",
    options: [
      "Rarely or never",
      "A few times a month",
      "Several times a week",
      "Every day",
    ],
  },
  {
    key: "document_processing",
    label:
      "How much manual sorting or extracting do your documents and emails need?",
    options: [
      "Little or none",
      "Occasional work",
      "Regular work each week",
      "Substantial work every day",
    ],
  },
  {
    key: "routine_drafting",
    label:
      "How often do you create similar internal drafts, summaries or reports?",
    options: [
      "Rarely or never",
      "A few times a month",
      "Several times a week",
      "Every day",
    ],
  },
  {
    key: "information_access",
    label:
      "How difficult is it to find the internal information your team needs?",
    options: [
      "Easy to find",
      "Sometimes takes searching",
      "Often slows work down",
      "Frequently blocks work",
    ],
  },
  {
    key: "process_repeatability",
    label: "How repeatable are the tasks you would like to improve?",
    options: [
      "Mostly unique each time",
      "Some recurring steps",
      "Mostly consistent steps",
      "Clear steps repeated frequently",
    ],
  },
] as const;

export const TEAM_SIZE_OPTIONS = [
  "Just me",
  "2–5 people",
  "6–20 people",
  "21–50 people",
  "51+ people",
] as const;
export const INDUSTRY_OPTIONS = [
  "Construction / trades",
  "Professional services",
  "Real estate / property",
  "Retail / ecommerce",
  "Hospitality",
  "Healthcare / wellness",
  "Other",
] as const;
export const PRIORITY_OPTIONS = [
  "Reduce repetitive admin",
  "Reduce duplicate data entry",
  "Organize documents and emails",
  "Draft routine reports faster",
  "Find internal information faster",
  "Make processes more consistent",
  "Not sure yet",
] as const;
export const CONTACT_LABELS = {
  first_name: "First name",
  last_name: "Last name",
  email: "Email",
  company: "Business / company",
  team_size: "Team size",
  industry: "Industry",
  operational_priority: "Your main operational priority",
  phone: "Phone (optional)",
  website: "Website (optional)",
  role: "Your role (optional)",
  current_tools: "Current tools (optional, not scored)",
  bottleneck_details: "What is slowing you down? (optional)",
} as const;

const inputText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine(
      (value) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value),
      "Remove control characters.",
    );
const requiredText = (max: number) =>
  inputText(max).refine(
    (value) => value.length > 0,
    "Complete this required field.",
  );
export const ASSESSMENT_PHONE_HINT =
  "Include +country code, for example +1 555 010 2020, or leave the optional phone field blank.";
export function validAssessmentPhone(value: string): boolean {
  return (
    value.trim() === "" ||
    /^\+[1-9]\d{6,14}$/.test(value.replace(/[\s().-]/g, ""))
  );
}
export const assessmentContactSchema = z.strictObject({
  first_name: requiredText(100),
  last_name: requiredText(100),
  email: z.string().trim().email().max(254),
  company: requiredText(200),
  team_size: z.enum(TEAM_SIZE_OPTIONS),
  industry: z.enum(INDUSTRY_OPTIONS),
  operational_priority: z.enum(PRIORITY_OPTIONS),
  phone: inputText(50)
    .refine(validAssessmentPhone, ASSESSMENT_PHONE_HINT)
    .default(""),
  website: inputText(300).default(""),
  role: inputText(150).default(""),
  current_tools: inputText(500).default(""),
  bottleneck_details: inputText(2000).default(""),
});
export type AssessmentContact = z.infer<typeof assessmentContactSchema>;
export const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;
const touchSchema = z.strictObject({
  utm_source: inputText(120).optional(),
  utm_medium: inputText(120).optional(),
  utm_campaign: inputText(120).optional(),
  utm_content: inputText(120).optional(),
  utm_term: inputText(120).optional(),
});
const attributionSchema = z.strictObject({
  first_touch: touchSchema,
  last_touch: touchSchema,
});
export type AssessmentAttribution = z.infer<typeof attributionSchema>;
export function readAssessmentAttribution(
  search: string,
): AssessmentAttribution {
  const params = new URLSearchParams(search);
  const touch: Record<string, string> = {};
  for (const key of ATTRIBUTION_KEYS) {
    const value = params
      .get(key)
      ?.replace(/[\u0000-\u001f\u007f]/g, " ")
      .trim()
      .slice(0, 120);
    if (value) touch[key] = value;
  }
  return { first_touch: { ...touch }, last_touch: { ...touch } };
}

export const ASSESSMENT_VERSION = "mccann-ai-operations-v2-21";
export const LEGACY_ASSESSMENT_VERSION = "reconstructed-draft-1";
export const MAX_ASSESSMENT_BYTES = 64_000;
export const QUESTIONS = [
  ...ORIGINAL_ASSESSMENT_QUESTIONS,
  {
    key: "software_overlap",
    label: "How much do your software subscriptions overlap or go unused?",
    options: [
      "No overlap or unnecessary subscriptions",
      "Some possible overlap",
      "Several tools with overlapping features",
      "Significant overlap or unused subscriptions",
    ],
  },
] as const;
export type AssessmentVersion =
  typeof ASSESSMENT_VERSION | typeof LEGACY_ASSESSMENT_VERSION;
export function assessmentQuestions(version: AssessmentVersion) {
  return version === LEGACY_ASSESSMENT_VERSION
    ? ORIGINAL_ASSESSMENT_QUESTIONS
    : QUESTIONS;
}
export function assessmentScore(
  answers: Record<string, number>,
  version: AssessmentVersion = ASSESSMENT_VERSION,
) {
  const questions = assessmentQuestions(version);
  const values = questions.map((question) => answers[question.key]);
  if (
    values.some((value) => !Number.isInteger(value) || value < 0 || value > 3)
  )
    throw new Error(`Answer all ${questions.length} assessment questions.`);
  const score = values.reduce((total, value) => total + value, 0);
  const max_score = questions.length * 3;
  const tier =
    score <= max_score / 3
      ? "Targeted Opportunity"
      : score <= (max_score * 2) / 3
        ? "Strong Opportunity"
        : "High-Impact Opportunity";
  return { score, max_score, tier };
}

export const assessmentSubmissionSchema = z
  .strictObject({
    assessment_version: z.enum([ASSESSMENT_VERSION, LEGACY_ASSESSMENT_VERSION]),
    submission_id: z
      .string()
      .min(1)
      .max(100)
      .regex(/^[A-Za-z0-9_-]+$/),
    submitted_at_utc: z.iso.datetime(),
    source: z.literal(ASSESSMENT_SOURCE),
    channel: z.literal("website_assessment"),
    contact: assessmentContactSchema,
    answers: z
      .array(
        z.strictObject({
          key: z.string().min(1).max(100),
          question: z.string().max(500),
          value: z.number().int().min(0).max(3),
          label: z.string().max(500),
        }),
      )
      .min(6)
      .max(7),
    score: z.number().int().min(0).max(ASSESSMENT_SCORE_MAX),
    max_score: z.union([z.literal(18), z.literal(21)]),
    tier: z.enum([
      "Targeted Opportunity",
      "Strong Opportunity",
      "High-Impact Opportunity",
    ]),
    attribution: attributionSchema,
    consent: z.strictObject({
      marketing: z.literal(false),
      sms: z.literal(false),
    }),
  })
  .superRefine((submission, ctx) => {
    const questions = assessmentQuestions(submission.assessment_version);
    if (
      submission.answers.length !== questions.length ||
      new Set(submission.answers.map((answer) => answer.key)).size !==
        questions.length
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["answers"],
        message:
          "Supply every question exactly once for this assessment version.",
      });
      return;
    }
    for (const question of questions) {
      const answer = submission.answers.find(
        (item) => item.key === question.key,
      );
      if (
        !answer ||
        answer.question !== question.label ||
        answer.label !== question.options[answer.value]
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["answers", question.key],
          message:
            "Answer key, original question, and selected label must match the canonical assessment.",
        });
      }
    }
    const keys = Object.fromEntries(
      submission.answers.map((answer) => [answer.key, answer.value]),
    );
    if (questions.every((question) => keys[question.key] !== undefined)) {
      const computed = assessmentScore(keys, submission.assessment_version);
      if (
        submission.score !== computed.score ||
        submission.max_score !== computed.max_score ||
        submission.tier !== computed.tier
      )
        ctx.addIssue({
          code: "custom",
          path: ["score"],
          message:
            "Score, maximum and tier must match the answers. The server recomputes them; legacy scores are never rescaled.",
        });
    }
  });
export type AssessmentSubmission = z.infer<typeof assessmentSubmissionSchema>;

export function parseAssessmentSubmission(
  input: unknown,
): AssessmentSubmission {
  let serialized: string;
  let raw = input;
  try {
    serialized = typeof input === "string" ? input : JSON.stringify(input);
  } catch {
    throw new Error("Assessment submission must be JSON data.");
  }
  if (
    typeof serialized !== "string" ||
    new TextEncoder().encode(serialized).byteLength > MAX_ASSESSMENT_BYTES
  )
    throw new Error("Assessment submission exceeds the 64 KB limit.");
  if (typeof input === "string") {
    try {
      raw = JSON.parse(input);
    } catch {
      throw new Error("Invalid assessment JSON.");
    }
  }
  const result = assessmentSubmissionSchema.safeParse(raw);
  if (!result.success)
    throw new Error(
      `Invalid assessment: ${result.error.issues
        .slice(0, 3)
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ")}`,
    );
  const submission = result.data;
  const questions = assessmentQuestions(submission.assessment_version);
  return {
    ...submission,
    answers: questions.map((question) =>
      submission.answers.find((answer) => answer.key === question.key)!,
    ),
    ...assessmentScore(
      Object.fromEntries(
        submission.answers.map((answer) => [answer.key, answer.value]),
      ),
      submission.assessment_version,
    ),
  } as AssessmentSubmission;
}

export function buildAssessmentSubmission(
  contact: unknown,
  answers: Record<string, number>,
  options: {
    submissionId: string;
    submittedAt: string;
    attribution?: AssessmentAttribution;
    version?: AssessmentVersion;
  },
): AssessmentSubmission {
  const version = options.version ?? ASSESSMENT_VERSION;
  const score = assessmentScore(answers, version);
  return parseAssessmentSubmission({
    assessment_version: version,
    submission_id: options.submissionId,
    submitted_at_utc: options.submittedAt,
    source: ASSESSMENT_SOURCE,
    channel: "website_assessment",
    contact,
    answers: assessmentQuestions(version).map((question) => ({
      key: question.key,
      question: question.label,
      value: answers[question.key],
      label: question.options[answers[question.key]],
    })),
    ...score,
    attribution: options.attribution ?? { first_touch: {}, last_touch: {} },
    consent: { marketing: false, sms: false },
  });
}

export function buildAssessmentPrepQuestions(
  input: AssessmentSubmission,
): string[] {
  const submission = parseAssessmentSubmission(input);
  const prompts: Record<string, string> = {
    admin_time:
      "How many hours does this process take in a typical week, and how is that measured?",
    duplicate_entry:
      "Which information is copied between which tools, and where do mistakes occur?",
    document_processing:
      "Can you show a representative document, its required output, and the checks a reviewer performs?",
    routine_drafting:
      "Which recurring report or draft has a clear template and an agreed approval step?",
    information_access:
      "Where is the source information kept, who owns it, and who should be allowed to access it?",
    software_overlap:
      "Which subscriptions overlap, what does each cost, and which capabilities are still required?",
  };
  const questions = [
    "Walk me through the last time the process happened, from its trigger to the final output.",
    "How many hours does this process take in a typical week, and how is that measured?",
    "Who will review consequential outputs, and what happens when an output is incorrect?",
  ];
  for (const answer of [...submission.answers]
    .filter((answer) => answer.value >= 2 && prompts[answer.key])
    .sort((a, b) => b.value - a.value)
    .slice(0, 3))
    questions.push(prompts[answer.key]);
  if (!submission.contact.current_tools)
    questions.push(
      "Which tools and subscriptions are currently used in this process?",
    );
  if (!submission.contact.bottleneck_details)
    questions.push(
      "Which repeated step creates the most frustration or delay?",
    );
  questions.push(
    "What measurable result and representative test samples would make a first pilot worth evaluating?",
  );
  return [...new Set(questions)];
}

export type AssessmentBooking = Pick<
  IntakePacket,
  | "appointmentId"
  | "contactId"
  | "startsAt"
  | "timezone"
  | "bookingStatus"
  | "updatedAt"
>;
export function toAssessmentIntake(
  input: AssessmentSubmission,
  booking: AssessmentBooking,
): IntakePacket {
  const submission = parseAssessmentSubmission(input);
  const contact = submission.contact;
  const answers: NonNullable<IntakePacket["assessment"]>["answers"] =
    submission.answers.flatMap((answer) => [
      { id: answer.key, question: answer.question, value: answer.label },
      {
        id: `${answer.key}.score`,
        question: `Scoring value for: ${answer.question}`,
        value: answer.value,
      },
    ]);
  for (const key of Object.keys(CONTACT_LABELS) as (keyof AssessmentContact)[])
    answers.push({
      id: `context.${key}`,
      question: CONTACT_LABELS[key],
      value: contact[key],
    });
  answers.push(
    {
      id: "assessment.score",
      question: "Original assessment score",
      value: submission.score,
    },
    {
      id: "assessment.max_score",
      question: "Original assessment score maximum",
      value: submission.max_score,
    },
    {
      id: "assessment.tier",
      question: "Original assessment tier",
      value: submission.tier,
    },
    { id: "consent.marketing", question: "Marketing consent", value: false },
    { id: "consent.sms", question: "SMS consent", value: false },
  );
  for (const touch of ["first_touch", "last_touch"] as const)
    for (const [key, value] of Object.entries(submission.attribution[touch]))
      answers.push({
        id: `attribution.${touch}.${key}`,
        question: `${touch === "first_touch" ? "First" : "Last"}-touch ${key}`,
        value,
      });
  const currentScore = submission.max_score === ASSESSMENT_SCORE_MAX;
  return intakePacketSchema.parse({
    version: 1,
    locationId: INTAKE_LOCATION_ID,
    calendarId: INTAKE_CALENDAR_ID,
    ...booking,
    contact: {
      business: contact.company,
      name: `${contact.first_name} ${contact.last_name}`,
      email: contact.email,
      phone: contact.phone,
      website: contact.website,
      industry: contact.industry,
      title: contact.role,
    },
    assessment: {
      sourceId: ASSESSMENT_SOURCE_ID,
      submissionId: submission.submission_id,
      version: submission.assessment_version,
      submittedAt: submission.submitted_at_utc,
      answers,
      ...(currentScore
        ? {
            score: submission.score,
            scoreMax: ASSESSMENT_SCORE_MAX,
            tier: submission.tier,
          }
        : {}),
    },
    mappedFields: {
      "client.priority": contact.operational_priority,
      "worksheet.reason": contact.operational_priority,
      ...(contact.bottleneck_details
        ? { "worksheet.frustration": contact.bottleneck_details }
        : {}),
    },
    research: {
      facts: [],
      suggestedQuestions: buildAssessmentPrepQuestions(submission),
    },
  });
}
