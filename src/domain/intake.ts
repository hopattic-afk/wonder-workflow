import { newSession } from "./defaults";
import { ASSESSMENT_SCORE_MAX } from "./constants";
import { sessionSchema, storeSchema } from "./validation";
import type { Session, Store } from "./types";
import {
  intakePacketSchema,
  MAX_INTAKE_BYTES,
  type IntakePacket,
  type IntakeMappedField,
  type IntakeMappedFields,
  type IntakeConflict,
  type IntakeAssessment,
} from "./intakeSchema";

export * from "./intakeSchema";
export interface IntakeResult {
  store: Store;
  sessionId: string;
  outcome: "created" | "updated" | "duplicate" | "stale";
  conflicts: IntakeConflict[];
}

/** Validates normalized data only. This function never contacts the booking provider. */
export function parseIntakePacket(input: unknown): IntakePacket {
  let raw = input;
  let serialized: string;
  try {
    serialized = typeof input === "string" ? input : JSON.stringify(input);
  } catch {
    throw new Error("Intake packet must contain JSON data.");
  }
  if (
    typeof serialized !== "string" ||
    serialized.length > MAX_INTAKE_BYTES ||
    new TextEncoder().encode(serialized).byteLength > MAX_INTAKE_BYTES
  ) {
    throw new Error("Intake packet is invalid or exceeds the 512 KB limit.");
  }
  if (typeof input === "string") {
    try {
      raw = JSON.parse(input);
    } catch {
      throw new Error("Invalid intake JSON.");
    }
  }
  const result = intakePacketSchema.safeParse(raw);
  if (!result.success)
    throw new Error(
      `Invalid intake packet: ${result.error.issues
        .slice(0, 4)
        .map((issue) => `${issue.path.join(".") || "packet"}: ${issue.message}`)
        .join("; ")}`,
    );
  return result.data;
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}

function appointmentSessionId(packet: IntakePacket): string {
  // Deterministic routing ID, not a security hash. Exact appointment identity is also
  // checked before every merge; a collision with an unrelated session fails closed.
  let hash = 0xcbf29ce484222325n;
  for (const character of `${packet.locationId}/${packet.calendarId}/${packet.appointmentId}`) {
    hash = BigInt.asUintN(
      64,
      (hash ^ BigInt(character.charCodeAt(0))) * 0x100000001b3n,
    );
  }
  return `intake-${hash.toString(16).padStart(16, "0")}`;
}

function appointmentDay(packet: IntakePacket): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: packet.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(packet.startsAt));
  return ["year", "month", "day"]
    .map((part) => parts.find((item) => item.type === part)!.value)
    .join("-");
}

function nativeMappings(packet: IntakePacket): IntakeMappedFields {
  const mapped: IntakeMappedFields = {
    "client.auditDate": appointmentDay(packet),
  };
  const nativeFields = {
    business: "client.business",
    name: "client.contact",
    title: "client.title",
    email: "client.email",
    phone: "client.phone",
    location: "client.location",
    industry: "client.industry",
    website: "client.website",
  } as const;
  for (const [native, field] of Object.entries(nativeFields)) {
    const value = packet.contact?.[native as keyof typeof nativeFields];
    if (value !== undefined) (mapped as Record<string, unknown>)[field] = value;
  }
  if (
    packet.assessment?.score !== undefined &&
    packet.assessment.scoreMax === ASSESSMENT_SCORE_MAX
  )
    mapped["client.score"] = packet.assessment.score;
  const tier = packet.assessment?.tier;
  if (
    packet.assessment?.scoreMax === ASSESSMENT_SCORE_MAX &&
    (tier === "Targeted Opportunity" ||
      tier === "Strong Opportunity" ||
      tier === "High-Impact Opportunity")
  )
    mapped["client.tier"] = tier;
  return mapped;
}

function currentField(
  session: Session,
  field: IntakeMappedField,
): string | number | null {
  const [area, key] = field.split(".") as ["client" | "worksheet", string];
  return (session[area] as unknown as Record<string, string | number | null>)[
    key
  ];
}

function setField(
  session: Session,
  field: IntakeMappedField,
  value: string | number,
): void {
  const [area, key] = field.split(".") as ["client" | "worksheet", string];
  (session[area] as unknown as Record<string, string | number>)[key] = value;
}

/**
 * Pure local merge: no persistence, network access, provider mutation or status
 * advancement. The caller reviews the result and persists it through the usual store.
 */
export function applyIntakePacket(store: Store, input: unknown): IntakeResult {
  const packet = parseIntakePacket(input);
  storeSchema.parse(store);
  const matches = store.sessions.filter(
    (session) =>
      session.intake?.packet.appointmentId === packet.appointmentId &&
      session.intake.packet.locationId === packet.locationId &&
      session.intake.packet.calendarId === packet.calendarId,
  );
  if (matches.length > 1)
    throw new Error(
      "More than one audit is linked to this appointment. Resolve the duplicate association before importing.",
    );
  const existing = matches[0];
  if (
    existing?.intake?.packet.contactId &&
    existing.intake.packet.contactId !== packet.contactId
  )
    throw new Error(
      "Appointment contact identity changed. Review the appointment link before importing.",
    );
  const previous = existing?.intake;
  const result = (outcome: "duplicate" | "stale"): IntakeResult => ({
    store,
    sessionId: existing!.id,
    outcome,
    conflicts: previous!.conflicts,
  });
  if (
    previous &&
    Date.parse(packet.updatedAt) < Date.parse(previous.packet.updatedAt)
  )
    return result("stale");

  const incomingAssessment = packet.assessment;
  const oldAssessment = previous?.packet.assessment;
  const assessmentOlder = Boolean(
    incomingAssessment &&
    oldAssessment &&
    Date.parse(incomingAssessment.submittedAt) <
      Date.parse(oldAssessment.submittedAt),
  );
  const assessment = assessmentOlder
    ? oldAssessment
    : (incomingAssessment ?? oldAssessment);
  // Booking-only reschedules/cancellations do not erase assessment or research records.
  const effectivePacket: IntakePacket = {
    ...packet,
    ...(packet.contact || previous?.packet.contact
      ? { contact: { ...previous?.packet.contact, ...packet.contact } }
      : {}),
    ...(assessment ? { assessment } : {}),
    ...((packet.research ?? previous?.packet.research)
      ? {
          research: {
            facts: packet.research?.facts.length
              ? packet.research.facts
              : (previous?.packet.research?.facts ?? []),
            suggestedQuestions: packet.research?.suggestedQuestions.length
              ? packet.research.suggestedQuestions
              : (previous?.packet.research?.suggestedQuestions ?? []),
          },
        }
      : {}),
    ...(assessmentOlder ? { mappedFields: previous?.packet.mappedFields } : {}),
  };
  if (
    previous &&
    Date.parse(packet.updatedAt) === Date.parse(previous.packet.updatedAt)
  ) {
    if (canonical(effectivePacket) === canonical(previous.packet))
      return result("duplicate");
    throw new Error(
      "Conflicting intake deliveries share the same updatedAt timestamp. Provide an unambiguous newer update.",
    );
  }

  const session = structuredClone(existing ?? newSession(store.settings));
  if (!existing) {
    session.id = appointmentSessionId(packet);
    if (store.sessions.some((other) => other.id === session.id))
      throw new Error(
        "An unrelated audit already uses this intake ID. Review the association before importing.",
      );
    session.createdAt = new Date(packet.updatedAt).toISOString();
    session.updatedAt = session.createdAt;
    session.status = "Scheduled";
  }
  const importedFields: IntakeMappedFields = { ...previous?.importedFields };
  // A stale assessment carried with a newer booking event cannot reapply older answers.
  const mapped = {
    ...nativeMappings({ ...packet, assessment }),
    ...(assessmentOlder ? {} : packet.mappedFields),
  };
  const conflicts: IntakeConflict[] = (previous?.conflicts ?? [])
    .filter((conflict) => {
      if (packet.bookingStatus === "cancelled") return true;
      const incoming = mapped[conflict.field];
      const actionable =
        incoming !== undefined &&
        !(typeof incoming === "string" && incoming.trim() === "");
      return (
        !actionable &&
        currentField(session, conflict.field) !== conflict.incoming
      );
    })
    .map((conflict) => ({
      ...conflict,
      current: currentField(session, conflict.field),
    }));
  if (!existing || packet.bookingStatus !== "cancelled") {
    for (const [name, value] of Object.entries(mapped)) {
      const field = name as IntakeMappedField;
      if (
        value === undefined ||
        (typeof value === "string" && value.trim() === "")
      )
        continue;
      const current = currentField(session, field);
      const previousImported = importedFields[field];
      if (
        !existing ||
        (previousImported === undefined &&
          (current === null || current === "")) ||
        (previousImported !== undefined && current === previousImported)
      ) {
        setField(session, field, value);
        (importedFields as Record<string, string | number>)[field] = value;
      } else if (current !== value) {
        conflicts.push({
          field,
          ...(previousImported === undefined ? {} : { previousImported }),
          current,
          incoming: value,
          reason: "manual-edit",
        });
      }
    }
  }
  const assessmentHistory: IntakeAssessment[] = [
    ...(previous?.assessmentHistory ?? []),
  ];
  if (
    oldAssessment &&
    incomingAssessment &&
    canonical(oldAssessment) !== canonical(incomingAssessment)
  ) {
    const historical = assessmentOlder ? incomingAssessment : oldAssessment;
    if (
      !assessmentHistory.some(
        (item) => canonical(item) === canonical(historical),
      )
    )
      assessmentHistory.push(historical);
  }
  if (assessmentHistory.length > 50)
    throw new Error(
      "This appointment has reached the retained assessment history limit. Export and review it before importing more submissions.",
    );
  session.intake = {
    packet: effectivePacket,
    importedFields,
    conflicts,
    assessmentHistory,
  };
  session.updatedAt = new Date(
    Math.max(Date.parse(session.updatedAt), Date.parse(packet.updatedAt)),
  ).toISOString();
  const validated = sessionSchema.parse(session);
  const next: Store = {
    ...store,
    sessions: existing
      ? store.sessions.map((item) =>
          item.id === existing.id ? validated : item,
        )
      : [validated, ...store.sessions],
  };
  storeSchema.parse(next);
  return {
    store: next,
    sessionId: validated.id,
    outcome: existing ? "updated" : "created",
    conflicts,
  };
}
