import { createElement } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ASSESSMENT_BOOKING_URL,
  ASSESSMENT_VERSION,
  LEGACY_ASSESSMENT_VERSION,
  ORIGINAL_ASSESSMENT_QUESTIONS,
  QUESTIONS,
  CONTACT_LABELS,
  assessmentScore,
  buildAssessmentSubmission,
  parseAssessmentSubmission,
  toAssessmentIntake,
  buildAssessmentPrepQuestions,
  readAssessmentAttribution,
  type AssessmentContact,
  type AssessmentSubmission,
  type AssessmentBooking,
} from "./assessment";
import { applyIntakePacket } from "./intake";
import { defaultSettings } from "./defaults";
import { LegacyAssessment as Assessment } from "../pages/Assessment";

const contact: AssessmentContact = {
  first_name: "Taylor",
  last_name: "Example",
  email: "taylor@example.test",
  company: "Fictional Workshop",
  team_size: "6–20 people",
  industry: "Construction / trades",
  operational_priority: "Reduce repetitive admin",
  phone: "+1 555 010 2020",
  website: "example.test",
  role: "Owner",
  current_tools: "Email, spreadsheets, accounting software",
  bottleneck_details: "Copying field notes into weekly reports",
};
const booking: AssessmentBooking = {
  appointmentId: "booking-test",
  contactId: "contact-test",
  startsAt: "2026-09-10T09:00:00-06:00",
  timezone: "America/Edmonton",
  bookingStatus: "confirmed",
  updatedAt: "2026-09-05T13:00:00Z",
};
const answers = (value = 3) =>
  Object.fromEntries(QUESTIONS.map((question) => [question.key, value]));
const submission = (
  version:
    | typeof ASSESSMENT_VERSION
    | typeof LEGACY_ASSESSMENT_VERSION = ASSESSMENT_VERSION,
): AssessmentSubmission =>
  buildAssessmentSubmission(contact, answers(), {
    submissionId: "submission-test",
    submittedAt: "2026-09-05T12:00:00Z",
    version,
    attribution: {
      first_touch: { utm_source: "original-campaign" },
      last_touch: { utm_source: "latest-campaign", utm_campaign: "operations" },
    },
  });
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("canonical assessment scoring and validation", () => {
  it("keeps the six original questions and adds a distinct seventh question", () => {
    expect(QUESTIONS.slice(0, 6)).toEqual(ORIGINAL_ASSESSMENT_QUESTIONS);
    expect(QUESTIONS).toHaveLength(7);
    expect(QUESTIONS[6].key).toBe("software_overlap");
    expect(assessmentScore(answers(0))).toEqual({
      score: 0,
      max_score: 21,
      tier: "Targeted Opportunity",
    });
    expect(assessmentScore(answers(3))).toEqual({
      score: 21,
      max_score: 21,
      tier: "High-Impact Opportunity",
    });
    expect(assessmentScore(answers(1))).toEqual({
      score: 7,
      max_score: 21,
      tier: "Targeted Opportunity",
    });
    expect(assessmentScore(answers(2))).toEqual({
      score: 14,
      max_score: 21,
      tier: "Strong Opportunity",
    });
  });

  it("preserves original six-question scores and thresholds without rescaling", () => {
    const legacy = submission(LEGACY_ASSESSMENT_VERSION);
    expect(legacy.answers).toHaveLength(6);
    expect(legacy.score).toBe(18);
    expect(legacy.max_score).toBe(18);
    expect(assessmentScore(answers(1), LEGACY_ASSESSMENT_VERSION).tier).toBe(
      "Targeted Opportunity",
    );
    expect(assessmentScore(answers(2), LEGACY_ASSESSMENT_VERSION).tier).toBe(
      "Strong Opportunity",
    );
    expect(parseAssessmentSubmission(JSON.stringify(legacy))).toEqual(legacy);
  });

  it("rejects tampered score, tier, denominator and version", () => {
    const original = submission();
    for (const modification of [
      { score: 0 },
      { tier: "Targeted Opportunity" },
      { max_score: 18 },
      { assessment_version: "invented-version" },
    ])
      expect(() =>
        parseAssessmentSubmission({ ...original, ...modification }),
      ).toThrow();
  });

  it("rejects missing, duplicate, altered and unknown original answers", () => {
    const original = submission();
    expect(() =>
      parseAssessmentSubmission({
        ...original,
        answers: original.answers.slice(1),
      }),
    ).toThrow();
    expect(() =>
      parseAssessmentSubmission({
        ...original,
        answers: original.answers.map((answer, i) =>
          i === 1 ? original.answers[0] : answer,
        ),
      }),
    ).toThrow();
    expect(() =>
      parseAssessmentSubmission({
        ...original,
        answers: original.answers.map((answer, i) =>
          i === 0 ? { ...answer, question: "A different prompt" } : answer,
        ),
      }),
    ).toThrow();
    expect(() =>
      parseAssessmentSubmission({
        ...original,
        answers: original.answers.map((answer, i) =>
          i === 0 ? { ...answer, label: "A different selection" } : answer,
        ),
      }),
    ).toThrow();
    expect(() =>
      parseAssessmentSubmission({
        ...original,
        answers: original.answers.map((answer, i) =>
          i === 0 ? { ...answer, key: "unknown-field" } : answer,
        ),
      }),
    ).toThrow();
  });

  it.each([-1, 4, 1.5])("rejects out-of-range answer %s", (value) => {
    const original = submission();
    original.answers[0].value = value;
    expect(() => parseAssessmentSubmission(original)).toThrow();
  });

  it("requires contact context and rejects marketing consent or unrelated private fields", () => {
    const original = submission();
    expect(() =>
      parseAssessmentSubmission({
        ...original,
        contact: { ...original.contact, industry: "" },
      }),
    ).toThrow();
    expect(() =>
      parseAssessmentSubmission({
        ...original,
        contact: { ...original.contact, team_size: "12" },
      }),
    ).toThrow();
    expect(() =>
      parseAssessmentSubmission({
        ...original,
        contact: { ...original.contact, email: "not-email" },
      }),
    ).toThrow();
    expect(() =>
      parseAssessmentSubmission({
        ...original,
        consent: { marketing: true, sms: false },
      }),
    ).toThrow();
    expect(() =>
      parseAssessmentSubmission({ ...original, calculator: { price: 3000 } }),
    ).toThrow();
    expect(() =>
      parseAssessmentSubmission({ ...original, api_key: "not-allowed" }),
    ).toThrow();
  });

  it("requires an explicit country code for optional phone without inferring one", () => {
    const original = submission();
    for (const phone of ["", "+1 (555) 010-2020", "+44 20 1234 5678"]) {
      expect(
        parseAssessmentSubmission({
          ...original,
          contact: { ...original.contact, phone },
        }).contact.phone,
      ).toBe(phone);
    }
    for (const phone of [
      "555-010-2020",
      "+0123456789",
      "+1abc5550102020",
      "+12345",
    ]) {
      expect(() =>
        parseAssessmentSubmission({
          ...original,
          contact: { ...original.contact, phone },
        }),
      ).toThrow(/country code/);
    }
  });

  it("only accepts the attribution allowlist and never adds PII to the booking URL", () => {
    const attribution = readAssessmentAttribution(
      "?utm_source=local-campaign&email=private%40example.test&token=secret&contact=person",
    );
    expect(attribution).toEqual({
      first_touch: { utm_source: "local-campaign" },
      last_touch: { utm_source: "local-campaign" },
    });
    expect(new URL(ASSESSMENT_BOOKING_URL).search).toBe("");
  });
});

describe("assessment-to-audit adapter", () => {
  it("retains every answer, range, context field, original score and attribution", () => {
    const original = submission();
    const intake = toAssessmentIntake(original, booking);
    const retained = intake.assessment!.answers;
    for (const answer of original.answers) {
      expect(retained).toContainEqual({
        id: answer.key,
        question: answer.question,
        value: answer.label,
      });
      expect(
        retained.find((item) => item.id === `${answer.key}.score`)!.value,
      ).toBe(answer.value);
    }
    for (const key of Object.keys(
      CONTACT_LABELS,
    ) as (keyof AssessmentContact)[])
      expect(retained.find((item) => item.id === `context.${key}`)!.value).toBe(
        contact[key],
      );
    expect(
      retained.find((item) => item.id === "context.team_size")!.value,
    ).toBe("6–20 people");
    expect(retained.find((item) => item.id === "admin_time")!.value).toBe(
      "More than 10 hours",
    );
    expect(
      retained.find((item) => item.id === "attribution.first_touch.utm_source")!
        .value,
    ).toBe("original-campaign");
    expect(
      retained.find((item) => item.id === "attribution.last_touch.utm_source")!
        .value,
    ).toBe("latest-campaign");
    expect(
      retained.find((item) => item.id === "consent.marketing")!.value,
    ).toBe(false);
    expect(intake.assessment!.scoreMax).toBe(21);
  });

  it("maps only confirmed contact, priority and bottleneck fields without inventing finance or private data", () => {
    const intake = toAssessmentIntake(submission(), booking);
    const result = applyIntakePacket(
      {
        version: 1,
        settings: defaultSettings(),
        sessions: [],
        lastExport: null,
        lastSaved: null,
      },
      intake,
    );
    const audit = result.store.sessions[0];
    expect(audit.client.business).toBe(contact.company);
    expect(audit.client.contact).toBe("Taylor Example");
    expect(audit.client.title).toBe(contact.role);
    expect(audit.client.industry).toBe(contact.industry);
    expect(audit.client.website).toBe(contact.website);
    expect(audit.client.priority).toBe(contact.operational_priority);
    expect(audit.worksheet.reason).toBe(contact.operational_priority);
    expect(audit.worksheet.frustration).toBe(contact.bottleneck_details);
    expect(audit.client.score).toBe(21);
    expect(audit.client.employees).toBeNull();
    expect(audit.worksheet.baselineHours).toBeNull();
    expect(audit.calculator.price).toBeNull();
    expect(audit.calculator.labor).toEqual([]);
    expect(audit.worksheet.classifications).toEqual([]);
    expect(audit.worksheet.fit).toEqual(Array(10).fill(null));
    expect(audit.worksheet.rationale).toBe("");
    expect(audit.callNotes).toBe("");
    expect(audit.recommendation.generatedAt).toBeNull();
    expect(audit.proposal.generatedAt).toBeNull();
    expect(intake.research!.facts).toEqual([]);
  });

  it("keeps a historical18 score as context rather than a21-point audit score", () => {
    const intake = toAssessmentIntake(
      submission(LEGACY_ASSESSMENT_VERSION),
      booking,
    );
    expect(intake.assessment!.score).toBeUndefined();
    expect(intake.assessment!.scoreMax).toBeUndefined();
    expect(intake.assessment!.tier).toBeUndefined();
    expect(
      intake.assessment!.answers.find(
        (answer) => answer.id === "assessment.score",
      )!.value,
    ).toBe(18);
    expect(
      intake.assessment!.answers.find(
        (answer) => answer.id === "assessment.max_score",
      )!.value,
    ).toBe(18);
    const audit = applyIntakePacket(
      {
        version: 1,
        settings: defaultSettings(),
        sessions: [],
        lastExport: null,
        lastSaved: null,
      },
      intake,
    ).store.sessions[0];
    expect(audit.client.score).toBeNull();
    expect(audit.client.tier).toBe("");
  });

  it("builds prep questions around missing baselines and explicitly reported pain", () => {
    const original = submission();
    original.contact.current_tools = "";
    original.contact.bottleneck_details = "";
    original.answers = original.answers.map((answer) => ({
      ...answer,
      value: answer.key === "software_overlap" ? 3 : 0,
      label: QUESTIONS.find((question) => question.key === answer.key)!.options[
        answer.key === "software_overlap" ? 3 : 0
      ],
    }));
    Object.assign(
      original,
      assessmentScore(
        Object.fromEntries(
          original.answers.map((answer) => [answer.key, answer.value]),
        ),
      ),
    );
    const prep = buildAssessmentPrepQuestions(original);
    expect(prep).toContain(
      "Which subscriptions overlap, what does each cost, and which capabilities are still required?",
    );
    expect(prep.some((question) => question.includes("typical week"))).toBe(
      true,
    );
    expect(prep).toContain(
      "Which tools and subscriptions are currently used in this process?",
    );
    expect(
      prep.every(
        (question) =>
          question.endsWith("?") || question.startsWith("Walk me through"),
      ),
    ).toBe(true);
    expect(new Set(prep).size).toBe(prep.length);
  });
});

async function fillPublicAssessment() {
  for (const question of QUESTIONS) {
    await screen.findByRole("heading", { name: question.label });
    const option = screen.getByRole("button", { name: question.options[3] });
    await waitFor(() => expect(option).not.toBeDisabled());
    fireEvent.click(option);
  }
  for (const key of [
    "first_name",
    "last_name",
    "email",
    "company",
    "team_size",
    "industry",
    "operational_priority",
  ] as const)
    fireEvent.change(
      screen.getByLabelText(CONTACT_LABELS[key], { exact: true }),
      { target: { value: contact[key] } },
    );
}

describe("retained legacy assessment save boundary (not publicly routed)", () => {
  it("shows one question at a time, focuses headings, and ignores arrow keys and repeat clicks", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ acceptingSubmissions: false }),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(createElement(Assessment));
    expect(
      screen.queryByRole("heading", { name: QUESTIONS[0].label }),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText("First name", { exact: true }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: QUESTIONS[0].label }),
    ).toHaveFocus();
    expect(screen.getByText(/Question 1 of 7/)).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: QUESTIONS[1].label }),
    ).not.toBeInTheDocument();
    const first = screen.getByRole("button", { name: QUESTIONS[0].options[3] });
    first.focus();
    fireEvent.keyDown(first, { key: "ArrowRight" });
    expect(
      screen.getByRole("heading", { name: QUESTIONS[0].label }),
    ).toBeInTheDocument();
    fireEvent.click(first, { detail: 1 });
    expect(
      screen.getByRole("heading", { name: QUESTIONS[1].label }),
    ).toHaveFocus();
    const second = screen.getByRole("button", {
      name: QUESTIONS[1].options[0],
    });
    fireEvent.click(second, { detail: 2 });
    expect(screen.getByText(/Question 2 of 7/)).toBeInTheDocument();
    await waitFor(() => expect(second).not.toBeDisabled());
    fireEvent.click(second, { detail: 2 });
    expect(screen.getByText(/Question 2 of 7/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(
      screen.getByRole("button", { name: QUESTIONS[0].options[3] }),
    ).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(
      screen.getByRole("heading", { name: QUESTIONS[0].label }),
    ).toHaveFocus();
    expect(
      fetchMock.mock.calls.every(([url]) => url === "/api/integration-status"),
    ).toBe(true);
  });
  it("preserves contact details on Back and accepts repeated or edited answers", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ acceptingSubmissions: false }),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(createElement(Assessment));
    await fillPublicAssessment();
    const contactHeading = "Make it relevant to your business.";
    expect(screen.getByRole("heading", { name: contactHeading })).toHaveFocus();
    expect(
      screen.queryByRole("heading", { name: QUESTIONS[6].label }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    const same = screen.getByRole("button", { name: QUESTIONS[6].options[3] });
    expect(same).toHaveAttribute("aria-pressed", "true");
    await waitFor(() => expect(same).not.toBeDisabled());
    fireEvent.click(same);
    expect(screen.getByLabelText("First name", { exact: true })).toHaveValue(
      contact.first_name,
    );
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    const edited = screen.getByRole("button", {
      name: QUESTIONS[6].options[0],
    });
    await waitFor(() => expect(edited).not.toBeDisabled());
    fireEvent.click(edited);
    expect(screen.getByLabelText("First name", { exact: true })).toHaveValue(
      contact.first_name,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(
      screen.getByRole("button", { name: QUESTIONS[6].options[0] }),
    ).toHaveAttribute("aria-pressed", "true");
  });
  it("keeps entries without a result or calendar when integration is unavailable", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({ acceptingSubmissions: false }),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(createElement(Assessment));
    await screen.findByRole("heading", { name: QUESTIONS[0].label });
    expect(screen.getByRole("contentinfo")).toHaveTextContent(
      "Wonder&Workflow LLC",
    );
    expect(document.body).not.toHaveTextContent(/McCann/i);
    expect(screen.getByRole("banner")).toHaveTextContent("Wonder & Workflow");
    await fillPublicAssessment();
    fireEvent.click(
      screen.getByRole("button", { name: "Save and continue to Fit Review" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We can’t save your assessment right now.",
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(
      screen.queryByRole("heading", { name: "21 / 21" }),
    ).not.toBeInTheDocument();
    expect(document.querySelector("iframe")).toBeNull();
    expect(screen.getByLabelText("First name", { exact: true })).toHaveValue(
      contact.first_name,
    );
  });

  it("retries exactly the original payload and key after an uncertain save", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ acceptingSubmissions: true }),
      })
      .mockRejectedValueOnce(new Error("Network interrupted"))
      .mockImplementationOnce(async (_url, options) => ({
        ok: true,
        json: async () => ({
          contact_saved: true,
          submission_id: JSON.parse(options.body).submission_id,
          booking_url: ASSESSMENT_BOOKING_URL,
        }),
      }));
    vi.stubGlobal("fetch", fetchMock);
    render(createElement(Assessment));
    await screen.findByRole("heading", { name: QUESTIONS[0].label });
    await fillPublicAssessment();
    fireEvent.click(
      screen.getByRole("button", { name: "Save and continue to Fit Review" }),
    );
    await screen.findByRole("button", { name: "Retry Original Request" });
    expect(screen.getByLabelText("First name", { exact: true })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(
      screen.getByRole("heading", {
        name: "Make it relevant to your business.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "21 / 21" }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Retry Original Request" }),
    );
    await screen.findByRole("heading", { name: "21 / 21" });
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Back" }),
    ).not.toBeInTheDocument();
    const first = fetchMock.mock.calls[1][1];
    const retry = fetchMock.mock.calls[2][1];
    expect(retry.body).toBe(first.body);
    expect(retry.headers["Idempotency-Key"]).toBe(
      first.headers["Idempotency-Key"],
    );
    expect(
      screen.getByTitle(
        "Book your complimentary 30-minute Operations Fit Review",
      ),
    ).toHaveAttribute("src", ASSESSMENT_BOOKING_URL);
  });

  it("does not show a receipt or follow a returned URL that contains contact data", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ acceptingSubmissions: true }),
      })
      .mockImplementationOnce(async (_url, options) => ({
        ok: true,
        json: async () => ({
          contact_saved: true,
          submission_id: JSON.parse(options.body).submission_id,
          booking_url: `${ASSESSMENT_BOOKING_URL}?email=taylor@example.test`,
        }),
      }));
    vi.stubGlobal("fetch", fetchMock);
    render(createElement(Assessment));
    await screen.findByRole("heading", { name: QUESTIONS[0].label });
    await fillPublicAssessment();
    fireEvent.click(
      screen.getByRole("button", { name: "Save and continue to Fit Review" }),
    );
    await screen.findByRole("button", { name: "Retry Original Request" });
    expect(
      screen.queryByRole("button", { name: "Request Saved" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Book My Workflow Fit Review/ }),
    ).not.toBeInTheDocument();
  });
});
