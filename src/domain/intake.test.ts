import { describe, expect, it, vi } from "vitest";
import { defaultSettings, newSession } from "./defaults";
import {
  applyIntakePacket,
  parseIntakePacket,
  INTAKE_CALENDAR_ID,
  INTAKE_LOCATION_ID,
  MAX_INTAKE_BYTES,
  type IntakePacket,
} from "./intake";
import { exportStore, parseImport } from "./storage";
import { sessionSchema, storeSchema } from "./validation";
import type { Store } from "./types";

const store = (): Store => ({
  version: 1,
  settings: defaultSettings(),
  sessions: [],
  lastExport: null,
  lastSaved: null,
});
const packet = (overrides: Partial<IntakePacket> = {}): IntakePacket => ({
  version: 1,
  locationId: INTAKE_LOCATION_ID,
  calendarId: INTAKE_CALENDAR_ID,
  appointmentId: "booking-one",
  contactId: "contact-one",
  updatedAt: "2026-09-05T12:00:00Z",
  startsAt: "2026-09-08T09:00:00-06:00",
  timezone: "America/Edmonton",
  bookingStatus: "scheduled",
  contact: {
    business: "Fictional Workshop",
    name: "Taylor Example",
    email: "taylor@example.test",
  },
  assessment: {
    sourceId: "unknown-assessment-source",
    submissionId: "submission-one",
    version: "unconfirmed-v1",
    submittedAt: "2026-09-05T11:00:00Z",
    score: 19,
    scoreMax: 21,
    tier: "High-Impact Opportunity",
    answers: [
      {
        id: "original-custom-key",
        question: "Exact original prompt?",
        value: "Unmapped original response",
      },
    ],
  },
  mappedFields: { "worksheet.reason": "Reduce report preparation time" },
  ...overrides,
});
const later = (overrides: Partial<IntakePacket> = {}) =>
  packet({ updatedAt: "2026-09-05T13:00:00Z", ...overrides });

describe("normalized booking intake validation", () => {
  it("accepts JSON and exact 0–21 scores without rescaling", () => {
    for (const score of [0, 18, 21]) {
      const input = packet();
      input.assessment!.score = score;
      const parsed = parseIntakePacket(JSON.stringify(input));
      expect(parsed.assessment!.score).toBe(score);
      expect(
        applyIntakePacket(store(), parsed).store.sessions[0].client.score,
      ).toBe(score);
    }
  });

  it.each([-1, 22, 1.5])("rejects invalid score %s", (score) => {
    const input = packet();
    input.assessment!.score = score;
    expect(() => parseIntakePacket(input)).toThrow(/score/);
  });

  it("requires the confirmed score denominator and rejects legacy 18", () => {
    const input = packet();
    expect(() =>
      parseIntakePacket({
        ...input,
        assessment: { ...input.assessment, scoreMax: 18 },
      }),
    ).toThrow(/scoreMax/);
    delete input.assessment!.scoreMax;
    expect(() => parseIntakePacket(input)).toThrow(/scoreMax/);
  });

  it("rejects unsupported location and calendar scopes", () => {
    expect(() =>
      applyIntakePacket(store(), {
        ...packet(),
        locationId: "another-location",
      }),
    ).toThrow(/locationId/);
    expect(() =>
      applyIntakePacket(store(), {
        ...packet(),
        calendarId: "another-calendar",
      }),
    ).toThrow(/calendarId/);
  });

  it("requires offset-aware timestamps and an IANA timezone", () => {
    expect(() =>
      parseIntakePacket({ ...packet(), startsAt: "2026-09-08T09:00:00" }),
    ).toThrow(/startsAt/);
    expect(() =>
      parseIntakePacket({ ...packet(), timezone: "Not/A_Zone" }),
    ).toThrow(/timezone/);
    expect(() =>
      parseIntakePacket({ ...packet(), timezone: "+06:00" }),
    ).toThrow(/timezone/);
    expect(() =>
      parseIntakePacket({ ...packet(), updatedAt: "yesterday" }),
    ).toThrow(/updatedAt/);
  });

  it("rejects non-JSON, oversized packets, unknown mappings, and credential fields", () => {
    expect(() => parseIntakePacket("not json")).toThrow(/JSON/);
    expect(() => parseIntakePacket(" ".repeat(MAX_INTAKE_BYTES + 1))).toThrow(
      /512 KB/,
    );
    expect(() =>
      parseIntakePacket({ ...packet(), apiKey: "must-not-be-stored" }),
    ).toThrow();
    expect(() =>
      parseIntakePacket({
        ...packet(),
        mappedFields: { "calculator.price": 99 },
      }),
    ).toThrow();
    expect(() =>
      parseIntakePacket({
        ...packet(),
        mappedFields: { "worksheet.fit": [5, 5] },
      }),
    ).toThrow();
  });

  it("requires explicitly mapped scores to match the source assessment", () => {
    expect(() =>
      parseIntakePacket(packet({ mappedFields: { "client.score": 20 } })),
    ).toThrow(/Mapped score/);
    expect(() =>
      parseIntakePacket(
        packet({ assessment: undefined, mappedFields: { "client.score": 19 } }),
      ),
    ).toThrow(/Mapped score/);
  });

  it("preserves unknown source tiers but never guesses an audit tier", () => {
    const input = packet();
    input.assessment!.tier = "Provider-specific band";
    const audit = applyIntakePacket(store(), input).store.sessions[0];
    expect(audit.client.tier).toBe("");
    expect(audit.intake!.packet.assessment!.tier).toBe(
      "Provider-specific band",
    );
  });
});

describe("local intake merging", () => {
  it("creates a deterministic Scheduled audit with only known values", () => {
    const original = store();
    const first = applyIntakePacket(original, packet());
    const second = applyIntakePacket(original, packet());
    expect(first).toEqual(second);
    expect(original.sessions).toHaveLength(0);
    expect(first.outcome).toBe("created");
    const audit = first.store.sessions[0];
    expect(audit.status).toBe("Scheduled");
    expect(audit.client.business).toBe("Fictional Workshop");
    expect(audit.client.contact).toBe("Taylor Example");
    expect(audit.client.auditDate).toBe("2026-09-08");
    expect(audit.client.employees).toBeNull();
    expect(audit.worksheet.reason).toBe("Reduce report preparation time");
    expect(audit.worksheet.workflowName).toBe("");
    expect(audit.calculator.price).toBeNull();
    expect(audit.worksheet.fit).toEqual(Array(10).fill(null));
    expect(audit.recommendation.generatedAt).toBeNull();
    expect(audit.createdAt).toBe("2026-09-05T12:00:00.000Z");
    expect(audit.updatedAt).toBe(audit.createdAt);
  });

  it("uses the calendar timezone rather than the browser or UTC date", () => {
    const input = packet({
      startsAt: "2026-09-09T01:00:00Z",
      timezone: "America/Edmonton",
    });
    expect(
      applyIntakePacket(store(), input).store.sessions[0].client.auditDate,
    ).toBe("2026-09-08");
  });

  it("is idempotent across duplicate JSON deliveries and backup round trips", () => {
    const input = packet();
    const first = applyIntakePacket(store(), input);
    const restored = parseImport(exportStore(first.store));
    const second = applyIntakePacket(restored, JSON.stringify(input));
    expect(second.outcome).toBe("duplicate");
    expect(second.store).toBe(restored);
    expect(second.store.sessions).toHaveLength(1);
  });

  it("ignores stale deliveries and refuses ambiguous equal timestamps", () => {
    const initial = applyIntakePacket(store(), later());
    const stale = applyIntakePacket(
      initial.store,
      packet({ bookingStatus: "cancelled" }),
    );
    expect(stale.outcome).toBe("stale");
    expect(stale.store).toBe(initial.store);
    expect(() =>
      applyIntakePacket(initial.store, later({ bookingStatus: "cancelled" })),
    ).toThrow(/same updatedAt/);
  });

  it("updates unchanged imported fields while preserving manual edits", () => {
    const first = applyIntakePacket(store(), packet());
    const audit = first.store.sessions[0];
    audit.client.business = "Manually verified legal name";
    audit.worksheet.reason = "Consultant-edited outcome";
    audit.status = "Proposal Draft";
    audit.callNotes = "PRIVATE call note";
    audit.calculator.price = 4200;
    audit.calculator.pricingNotes = "PRIVATE pricing note";
    audit.worksheet.fit = Array(10).fill(4);
    audit.proposal.objective = "Approved custom proposal objective";
    const before = structuredClone(first.store);
    const result = applyIntakePacket(
      first.store,
      later({
        contact: {
          business: "Incoming business name",
          name: "Updated contact name",
        },
        mappedFields: {
          "worksheet.reason": "Incoming outcome",
          "worksheet.workflowName": "Confirmed explicit workflow",
        },
      }),
    );
    const updated = result.store.sessions[0];
    expect(first.store).toEqual(before);
    expect(updated.client.business).toBe("Manually verified legal name");
    expect(updated.client.contact).toBe("Updated contact name");
    expect(updated.worksheet.workflowName).toBe("Confirmed explicit workflow");
    expect(result.conflicts.map((conflict) => conflict.field)).toEqual(
      expect.arrayContaining(["client.business", "worksheet.reason"]),
    );
    expect(updated.status).toBe("Proposal Draft");
    expect(updated.callNotes).toBe(audit.callNotes);
    expect(updated.calculator).toEqual(audit.calculator);
    expect(updated.worksheet.fit).toEqual(audit.worksheet.fit);
    expect(updated.proposal).toEqual(audit.proposal);
  });

  it("protects manual clearing of previously imported text and numeric fields", () => {
    const first = applyIntakePacket(store(), packet());
    first.store.sessions[0].worksheet.reason = "";
    first.store.sessions[0].client.score = null;
    const result = applyIntakePacket(first.store, later());
    expect(result.store.sessions[0].worksheet.reason).toBe("");
    expect(result.store.sessions[0].client.score).toBeNull();
    expect(result.conflicts.map((conflict) => conflict.field)).toEqual(
      expect.arrayContaining(["worksheet.reason", "client.score"]),
    );
  });

  it("retains unresolved conflicts on booking-only reschedule and cancellation", () => {
    const first = applyIntakePacket(store(), packet());
    first.store.sessions[0].worksheet.reason = "Manual alternative";
    const conflicted = applyIntakePacket(first.store, later());
    const rescheduled = applyIntakePacket(
      conflicted.store,
      later({
        updatedAt: "2026-09-05T14:00:00Z",
        startsAt: "2026-09-10T09:00:00-06:00",
        assessment: undefined,
        contact: undefined,
        mappedFields: undefined,
      }),
    );
    expect(
      rescheduled.conflicts.some(
        (conflict) => conflict.field === "worksheet.reason",
      ),
    ).toBe(true);
    expect(rescheduled.store.sessions[0].client.auditDate).toBe("2026-09-10");
    expect(rescheduled.store.sessions[0].intake!.packet.contact).toEqual(
      packet().contact,
    );
    const cancelled = applyIntakePacket(
      rescheduled.store,
      later({
        updatedAt: "2026-09-05T15:00:00Z",
        bookingStatus: "cancelled",
        assessment: undefined,
        contact: undefined,
        mappedFields: undefined,
      }),
    );
    expect(cancelled.conflicts).toEqual(rescheduled.conflicts);
  });

  it("does not claim ownership of an equal pre-existing manual value", () => {
    const first = applyIntakePacket(store(), packet());
    first.store.sessions[0].worksheet.workflowName = "Manual workflow";
    const equal = applyIntakePacket(
      first.store,
      later({ mappedFields: { "worksheet.workflowName": "Manual workflow" } }),
    );
    expect(
      equal.store.sessions[0].intake!.importedFields["worksheet.workflowName"],
    ).toBeUndefined();
    const next = applyIntakePacket(
      equal.store,
      later({
        updatedAt: "2026-09-05T14:00:00Z",
        mappedFields: { "worksheet.workflowName": "Another incoming workflow" },
      }),
    );
    expect(next.store.sessions[0].worksheet.workflowName).toBe(
      "Manual workflow",
    );
    expect(next.conflicts[0].field).toBe("worksheet.workflowName");
  });

  it("does not erase pending conflicts when incoming mapped or native fields are blank", () => {
    const first = applyIntakePacket(store(), packet());
    first.store.sessions[0].worksheet.reason = "My decision";
    first.store.sessions[0].client.business = "Verified business name";
    const conflicted = applyIntakePacket(
      first.store,
      later({
        contact: { business: "Incoming business" },
        mappedFields: { "worksheet.reason": "Incoming reason" },
      }),
    );
    const blank = applyIntakePacket(
      conflicted.store,
      later({
        updatedAt: "2026-09-05T14:00:00Z",
        contact: { business: "" },
        mappedFields: { "worksheet.reason": "  " },
      }),
    );
    expect(blank.conflicts).toEqual(conflicted.conflicts);
    expect(blank.store.sessions[0].client.business).toBe(
      "Verified business name",
    );
    expect(blank.store.sessions[0].worksheet.reason).toBe("My decision");
  });

  it("retains a valid 32000-character manual audit value as a conflict", () => {
    const first = applyIntakePacket(store(), packet());
    const manual = "M".repeat(32000);
    first.store.sessions[0].worksheet.reason = manual;
    const result = applyIntakePacket(first.store, later());
    expect(result.store.sessions[0].worksheet.reason).toBe(manual);
    expect(
      result.conflicts.find(
        (conflict) => conflict.field === "worksheet.reason",
      )!.current,
    ).toBe(manual);
    expect(storeSchema.safeParse(result.store).success).toBe(true);
  });

  it("updates cancellation metadata without deleting an audit or changing its stage", () => {
    const first = applyIntakePacket(store(), packet());
    first.store.sessions[0].status = "Won";
    first.store.sessions[0].archived = true;
    const result = applyIntakePacket(
      first.store,
      later({
        bookingStatus: "cancelled",
        contact: { business: "Do not overwrite on cancellation" },
      }),
    );
    expect(result.store.sessions).toHaveLength(1);
    expect(result.store.sessions[0].status).toBe("Won");
    expect(result.store.sessions[0].archived).toBe(true);
    expect(result.store.sessions[0].client.business).toBe("Fictional Workshop");
    expect(result.store.sessions[0].intake!.packet.bookingStatus).toBe(
      "cancelled",
    );
  });

  it("preserves all original unknown answers without mapping answer text", () => {
    const input = packet({ mappedFields: undefined });
    input.assessment!.answers = [
      {
        id: "arbitrary-key",
        question: "Workflow name",
        value: "Do not guess this mapping",
      },
      {
        id: "multi",
        question: "Original multi-select question",
        value: ["alpha", "beta", false, 0, null],
      },
    ];
    const result = applyIntakePacket(store(), input);
    expect(result.store.sessions[0].worksheet.workflowName).toBe("");
    expect(result.store.sessions[0].worksheet.reason).toBe("");
    expect(result.store.sessions[0].intake!.packet.assessment!.answers).toEqual(
      input.assessment!.answers,
    );
    expect(parseImport(exportStore(result.store))).toEqual(result.store);
  });

  it("retains previous assessments on replacement and rejects assessment downgrade", () => {
    const input = packet();
    const first = applyIntakePacket(store(), input);
    const updatedPacket = later();
    updatedPacket.assessment = {
      ...input.assessment!,
      submissionId: "submission-two",
      submittedAt: "2026-09-05T12:30:00Z",
      score: 21,
      answers: [{ id: "new", question: "New prompt", value: "New response" }],
    };
    const second = applyIntakePacket(first.store, updatedPacket);
    expect(second.store.sessions[0].intake!.assessmentHistory).toEqual([
      input.assessment,
    ]);
    const downgraded = applyIntakePacket(
      second.store,
      later({
        updatedAt: "2026-09-05T14:00:00Z",
        assessment: input.assessment,
        mappedFields: { "worksheet.reason": "Stale answer must not apply" },
      }),
    );
    expect(downgraded.store.sessions[0].client.score).toBe(21);
    expect(downgraded.store.sessions[0].worksheet.reason).toBe(
      "Reduce report preparation time",
    );
    expect(downgraded.store.sessions[0].intake!.packet.assessment).toEqual(
      updatedPacket.assessment,
    );
    expect(downgraded.store.sessions[0].intake!.assessmentHistory).toEqual([
      input.assessment,
    ]);
    expect(first.store.sessions[0].intake!.packet.assessment).toEqual(
      input.assessment,
    );
  });

  it("keeps source-linked research separate and makes no network or storage calls", () => {
    const network = vi.spyOn(globalThis, "fetch");
    const storage = vi.spyOn(Storage.prototype, "setItem");
    try {
      const research = {
        facts: [
          {
            text: "Source says 40 employees",
            sourceUrl: "https://example.test/about",
            sourceTitle: "Fictional company page",
            accessedAt: "2026-09-05T10:00:00Z",
          },
        ],
        suggestedQuestions: ["Confirm employee count during the audit"],
      };
      const result = applyIntakePacket(store(), packet({ research }));
      expect(result.store.sessions[0].client.employees).toBeNull();
      expect(result.store.sessions[0].intake!.packet.research).toEqual(
        research,
      );
      expect(network).not.toHaveBeenCalled();
      expect(storage).not.toHaveBeenCalled();
      expect(() =>
        parseIntakePacket(
          packet({
            research: {
              ...research,
              facts: [
                { ...research.facts[0], sourceUrl: "javascript:alert(1)" },
              ],
            },
          }),
        ),
      ).toThrow(/sourceUrl/);
    } finally {
      network.mockRestore();
      storage.mockRestore();
    }
  });

  it("keeps old backups valid and validates the entire resulting session", () => {
    const old = store();
    old.sessions.push(newSession(old.settings));
    expect(parseImport(exportStore(old)).sessions[0].intake).toBeUndefined();
    const invalid = structuredClone(old);
    invalid.sessions[0].calculator.price = -1;
    expect(() => applyIntakePacket(invalid, packet())).toThrow();
    const result = applyIntakePacket(old, packet());
    expect(storeSchema.safeParse(result.store).success).toBe(true);
    expect(sessionSchema.safeParse(result.store.sessions[0]).success).toBe(
      true,
    );
    expect(result.store.sessions[1]).toEqual(old.sessions[0]);
  });

  it("rejects contact reassignment and duplicate appointment associations", () => {
    const first = applyIntakePacket(store(), packet());
    expect(() =>
      applyIntakePacket(first.store, later({ contactId: "another-contact" })),
    ).toThrow(/identity changed/);
    const duplicate = structuredClone(first.store.sessions[0]);
    duplicate.id = "independent-id";
    first.store.sessions.push(duplicate);
    expect(() => applyIntakePacket(first.store, later())).toThrow(
      /More than one audit/,
    );
  });

  it("retains sourced business facts when a later booking only adds questions", () => {
    const original = packet({
      research: {
        facts: [
          {
            text: "Source-provided business description",
            sourceUrl: "https://example.com",
            sourceTitle: "Business website",
            accessedAt: "2026-09-05T11:00:00Z",
          },
        ],
        suggestedQuestions: ["Original question"],
      },
    });
    const first = applyIntakePacket(store(), original);
    const second = applyIntakePacket(
      first.store,
      later({
        research: { facts: [], suggestedQuestions: ["Updated question"] },
      }),
    );
    expect(second.store.sessions[0].intake!.packet.research?.facts).toEqual(
      original.research!.facts,
    );
    expect(
      second.store.sessions[0].intake!.packet.research?.suggestedQuestions,
    ).toEqual(["Updated question"]);
  });
});
