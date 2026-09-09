import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import {
  parseAssessmentSubmission,
  toAssessmentIntake,
  ASSESSMENT_BOOKING_URL,
  type AssessmentSubmission,
} from "../src/domain/assessment";
import {
  intakePacketSchema,
  intakeResearchSchema,
  type IntakePacket,
} from "../src/domain/intakeSchema";
import type { BridgeConfig } from "./config";
import {
  canonical,
  Conflict,
  digest,
  immutable,
  mutate,
  StorageUnavailable,
  type DurableStore,
} from "./storage";
import {
  appointmentSchema,
  identity,
  normalizedEmail,
  normalizedPhone,
  readBounded,
  type GhlAppointment,
  type GhlClient,
  type GhlContact,
} from "./ghl";

export interface BridgeDependencies {
  config: BridgeConfig | null;
  store: DurableStore;
  ghl: GhlClient;
  now?: () => number;
  random?: () => string;
  crmSync?: (input: { contactId: string; submissionId: string }, signal: AbortSignal) =>
    Promise<import("./crmSync").SyncResult>;
  research?: (website: string) => Promise<{
    facts: NonNullable<IntakePacket["research"]>["facts"];
    unavailable?: string;
  }>;
}
type Snapshot = {
  submission: AssessmentSubmission;
  hash: string;
  receivedAt: string;
};
type Receipt = {
  submissionId: string;
  hash: string;
  contactId: string;
  receivedAt: string;
};
const crmStatusSchema = z.object({ status: z.enum([
  "pending", "synced", "review_required", "disabled", "stale",
]) });
type CrmStatus = z.infer<typeof crmStatusSchema>;
type BookingRecord = {
  event: GhlAppointment;
  packet: IntakePacket;
  receiptId: string | null;
  researchAttempted?: boolean;
  researchUnavailable?: string;
};
type LoginSession = { expiresAt: number; revoked: boolean };
class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
const cookieName = "__Host-mccann-inbox";
const TTL = 8 * 60 * 60 * 1000;
const REMEMBERED_TTL = 30 * 24 * 60 * 60 * 1000;
const webhookSchema = z.strictObject({
  appointment_id: identity,
  contact_id: identity,
  location_id: identity,
  calendar_id: identity,
});
const safeEqual = (left: string, right: string) => {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
};
function reply(
  data: unknown,
  status = 200,
  extra: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, private",
      Pragma: "no-cache",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      ...extra,
    },
  });
}
const storedId = (kind: string, value: string) => `${kind}/${digest(value)}`;
export function createBridge(deps: BridgeDependencies) {
  const now = deps.now ?? Date.now;
  const random = deps.random ?? (() => randomBytes(32).toString("base64url"));
  const store = deps.store;
  const config = deps.config;
  const keyed = (value: string) =>
    createHmac("sha256", config!.sessionSecret)
      .update(value)
      .digest("base64url");
  async function limit(
    namespace: string,
    subject: string,
    max: number,
    period: number,
  ) {
    if (!subject) throw new HttpError(503, "Request identity is unavailable.");
    const window = Math.floor(now() / period);
    await mutate<{ window: number; count: number }>(
      store,
      `limits/${keyed(`${namespace}/${subject}`)}`,
      (old) => {
        const count = old?.window === window ? old.count : 0;
        if (count >= max)
          throw new HttpError(
            429,
            "Too many attempts. Please try again later.",
          );
        return { window, count: count + 1 };
      },
    );
  }
  function sameOrigin(req: Request, required: boolean) {
    const requestOrigin = new URL(req.url).origin;
    if (
      requestOrigin !== config!.origin &&
      requestOrigin !== config!.aliasOrigin &&
      requestOrigin !== config!.brandOrigin
    )
      throw new HttpError(403, "Origin not allowed.");
    const origin = req.headers.get("origin");
    if (
      (required && origin !== requestOrigin) ||
      (origin && origin !== requestOrigin)
    )
      throw new HttpError(403, "Origin not allowed.");
    const site = req.headers.get("sec-fetch-site");
    if (site && site !== "same-origin" && site !== "none")
      throw new HttpError(403, "Origin not allowed.");
  }
  async function body(
    req: Request,
    max = 64000,
  ): Promise<Record<string, unknown>> {
    if (
      !/^application\/json(?:\s*;|$)/i.test(
        req.headers.get("content-type") ?? "",
      )
    )
      throw new HttpError(415, "Use a JSON request.");
    try {
      return z
        .record(z.string(), z.unknown())
        .parse(JSON.parse(await readBounded(req, max)));
    } catch {
      throw new HttpError(400, "Invalid or oversized request.");
    }
  }
  function token(req: Request): string | null {
    const cookie = req.headers.get("cookie") ?? "";
    const matches = cookie
      .split(";")
      .map((v) => v.trim())
      .filter((v) => v.startsWith(`${cookieName}=`));
    if (matches.length !== 1) return null;
    const value = matches[0].slice(cookieName.length + 1);
    return /^[A-Za-z0-9_-]{43}$/.test(value) ? value : null;
  }
  async function authenticated(req: Request): Promise<string> {
    sameOrigin(req, false);
    const value = token(req);
    if (!value) throw new HttpError(401, "Sign in to the intake inbox.");
    const session = await store.read<LoginSession>(`sessions/${keyed(value)}`);
    if (!session || session.value.revoked || session.value.expiresAt <= now())
      throw new HttpError(401, "Inbox session expired. Sign in again.");
    return value;
  }
  async function snapshot(submission: AssessmentSubmission): Promise<Snapshot> {
    const key = storedId("submissions", submission.submission_id);
    const hash = digest(canonical(submission));
    return mutate<Snapshot>(store, key, (old) => {
      if (old && old.hash !== hash)
        throw new Conflict(
          "Submission ID already belongs to different answers.",
        );
      return (
        old ?? { submission, hash, receivedAt: new Date(now()).toISOString() }
      );
    });
  }
  async function resolveContact(
    submission: AssessmentSubmission,
  ): Promise<GhlContact> {
    const email = normalizedEmail(submission.contact.email);
    const phone = submission.contact.phone
      ? normalizedPhone(submission.contact.phone)
      : "";
    if (submission.contact.phone && !phone)
      throw new HttpError(
        400,
        "Use an international phone number beginning with + and country code.",
      );
    const emails = await deps.ghl.find("email", email);
    const phones = phone ? await deps.ghl.find("phone", phone) : [];
    if (
      emails.length > 1 ||
      phones.length > 1 ||
      (phones[0] && (!emails[0] || emails[0].id !== phones[0].id))
    )
      throw new Conflict("Contact identity requires consultant review.");
    // Scope and identity are checked again even for injected/custom providers.
    const contactId = emails[0]?.id ?? (await deps.ghl.upsertEmail(email));
    const contact = await deps.ghl.getContact(contactId);
    if (
      contact.id !== contactId ||
      contact.locationId !== config!.locationId ||
      normalizedEmail(contact.email ?? "") !== email
    )
      throw new Conflict("Contact identity could not be verified.");
    if (phone && contact.phone && normalizedPhone(contact.phone) !== phone)
      throw new Conflict("Contact phone does not match the existing record.");
    return contact;
  }
  async function withIdentityLock<T>(
    email: string,
    work: () => Promise<T>,
  ): Promise<T> {
    const key = `locks/${keyed(normalizedEmail(email))}`;
    const owner = random();
    await mutate<{ owner: string; until: number }>(store, key, (old) => {
      if (old && old.until > now())
        throw new HttpError(
          409,
          "This identity is being processed. Retry the same submission shortly.",
        );
      return { owner, until: now() + 120000 };
    });
    try {
      return await work();
    } finally {
      await mutate<{ owner: string; until: number }>(store, key, (old) =>
        old?.owner === owner ? { owner, until: 0 } : old!,
      );
    }
  }
  async function latestReceipt(
    contactId: string,
    startsAt: string,
    fixedId?: string | null,
    bookedAt?: string,
  ): Promise<{ receipt: Receipt; submission: AssessmentSubmission } | null> {
    if (fixedId) {
      const receipt = await store.read<Receipt>(storedId("receipts", fixedId));
      const snapshot = await store.read<Snapshot>(
        storedId("submissions", fixedId),
      );
      if (
        !receipt ||
        !snapshot ||
        receipt.value.contactId !== contactId ||
        snapshot.value.hash !== receipt.value.hash
      )
        throw new StorageUnavailable();
      return {
        receipt: receipt.value,
        submission: parseAssessmentSubmission(snapshot.value.submission),
      };
    }
    const keys = await store.keys(
      `contact-submissions/${digest(contactId)}/`,
      50,
    );
    const rows = await Promise.all(keys.map((key) => store.read<Receipt>(key)));
    const eligible = rows.filter((row): row is NonNullable<typeof row> =>
      Boolean(
        row &&
        row.value.contactId === contactId &&
        Date.parse(row.value.receivedAt) <= Date.parse(startsAt),
      ),
    );
    eligible.sort(
      (a, b) =>
        Date.parse(b.value.receivedAt) - Date.parse(a.value.receivedAt) ||
        a.value.submissionId.localeCompare(b.value.submissionId),
    );
    const beforeBooking = bookedAt
      ? eligible.filter(
          (row) => Date.parse(row.value.receivedAt) <= Date.parse(bookedAt),
        )
      : eligible;
    // Prefer the latest snapshot already captured at original booking. If none was
    // captured, one later assessment can fill the gap; multiple late candidates
    // remain unassociated for review instead of choosing silently.
    const chosen = (
      beforeBooking[0] ?? (eligible.length === 1 ? eligible[0] : undefined)
    )?.value;
    if (!chosen) return null;
    const value = await store.read<Snapshot>(
      storedId("submissions", chosen.submissionId),
    );
    if (!value || value.value.hash !== chosen.hash)
      throw new StorageUnavailable();
    return {
      receipt: chosen,
      submission: parseAssessmentSubmission(value.value.submission),
    };
  }
  function nativeContact(
    contact: GhlContact,
  ): NonNullable<IntakePacket["contact"]> {
    const clean = (v: string | null | undefined) =>
      v?.trim().slice(0, 12000) || undefined;
    return {
      name:
        clean(contact.name) ||
        clean([contact.firstName, contact.lastName].filter(Boolean).join(" ")),
      business: clean(contact.companyName),
      email: clean(contact.email),
      phone: clean(contact.phone),
      website: clean(contact.website),
      location: clean(
        [contact.city, contact.state, contact.country]
          .filter(Boolean)
          .join(", "),
      ),
    };
  }
  function questions(submission?: AssessmentSubmission): string[] {
    const top = submission
      ? [...submission.answers].sort((a, b) => b.value - a.value).slice(0, 2)
      : [];
    return [
      ...top.map(
        (answer) =>
          `You selected “${answer.label}” for “${answer.question}”. Walk through a recent example and confirm the current time involved.`,
      ),
      submission
        ? `Your stated priority is “${submission.contact.operational_priority}”. What single improvement would make this call useful?`
        : "The booking has no matched assessment. Confirm the business context and main operational priority.",
      "Which current software receives the information, and where is it copied or checked?",
      "Who will review outputs and handle exceptions before they affect a customer or a financial decision?",
      "What existing records could establish a measurable baseline without sharing unnecessary sensitive information?",
      "Which official business website accurately represents your business, and what should the consultant verify there?",
    ];
  }
  async function prepare(
    event: GhlAppointment,
    contact: GhlContact,
  ): Promise<{ outcome: string; packet: IntakePacket }> {
    const key = storedId("bookings", event.id);
    const prior = await store.read<BookingRecord>(key);
    if (prior && prior.value.packet.contactId !== contact.id)
      throw new Conflict(
        "Appointment contact changed. Review its association.",
      );
    if (
      prior &&
      Date.parse(event.dateUpdated) < Date.parse(prior.value.event.dateUpdated)
    )
      return { outcome: "stale", packet: prior.value.packet };
    // Freeze the original booked assessment. Later submissions are separate source
    // snapshots; only a previously missing assessment can attach automatically.
    const matched = await latestReceipt(
      contact.id,
      event.startTime,
      prior?.value.receiptId,
      event.dateAdded,
    );
    const status: Record<string, IntakePacket["bookingStatus"]> = {
      new: "scheduled",
      confirmed: "confirmed",
      cancelled: "cancelled",
      canceled: "cancelled",
      invalid: "cancelled",
      showed: "completed",
      noshow: "no-show",
      "no-show": "no-show",
    };
    const booking = {
      appointmentId: event.id,
      contactId: contact.id,
      startsAt: event.startTime,
      timezone: config!.timezone,
      bookingStatus: status[event.appointmentStatus],
      updatedAt: event.dateUpdated,
    };
    const packet = matched
      ? toAssessmentIntake(matched.submission, booking)
      : intakePacketSchema.parse({
          version: 1,
          locationId: config!.locationId,
          calendarId: config!.calendarId,
          ...booking,
          contact: nativeContact(contact),
        });
    packet.contact = {
      ...nativeContact(contact),
      ...Object.fromEntries(
        Object.entries(packet.contact ?? {}).filter(
          ([, value]) => typeof value === "string" && value.trim().length > 0,
        ),
      ),
    };
    let facts = prior?.value.packet.research?.facts ?? [];
    let researchAttempted = prior?.value.researchAttempted ?? facts.length > 0;
    let researchUnavailable = prior?.value.researchUnavailable;
    const website = packet.contact?.website;
    if (
      deps.research &&
      website &&
      !researchAttempted &&
      booking.bookingStatus !== "cancelled"
    ) {
      researchAttempted = true;
      try {
        const researchKey = storedId("research", event.id);
        let saved = await store.read<{
          facts: typeof facts;
          unavailable?: string;
        }>(researchKey);
        if (!saved) {
          await withIdentityLock(`research/${event.id}`, async () => {
            saved = await store.read(researchKey);
            if (saved) return;
            let result: { facts: typeof facts; unavailable?: string };
            try {
              result = await deps.research!(website);
            } catch {
              result = {
                facts: [],
                unavailable: "Public website research was unavailable.",
              };
            }
            result.facts = intakeResearchSchema.shape.facts.parse(result.facts);
            await immutable(store, researchKey, result);
            saved = await store.read(researchKey);
          });
        }
        if (saved?.value.facts.length) facts = saved.value.facts;
        researchUnavailable = saved?.value.unavailable;
      } catch {
        researchUnavailable = "Public website research was unavailable.";
      }
    }
    packet.research = {
      facts,
      suggestedQuestions: [
        ...questions(matched?.submission),
        ...(!deps.research || researchUnavailable
          ? [
              "Public website research is unavailable. Can you confirm the official business website for manual review?",
            ]
          : []),
      ],
    };
    let outcome = "created";
    const record = await mutate<BookingRecord>(store, key, (old) => {
      if (old && old.packet.contactId !== contact.id)
        throw new Conflict(
          "Appointment contact changed. Review its association.",
        );
      if (old?.receiptId && old.receiptId !== matched?.receipt.submissionId)
        throw new Conflict(
          "Assessment association changed during processing. Retry to preserve the established snapshot.",
        );
      if (
        old &&
        Date.parse(event.dateUpdated) < Date.parse(old.event.dateUpdated)
      ) {
        outcome = "stale";
        return old;
      }
      if (
        old &&
        event.dateUpdated === old.event.dateUpdated &&
        canonical(event) !== canonical(old.event)
      )
        throw new Conflict(
          "Conflicting appointment updates share the same timestamp.",
        );
      const comparison = (p: IntakePacket) => {
        const { updatedAt: _, ...rest } = p;
        return canonical(rest);
      };
      if (
        old &&
        comparison(old.packet) === comparison(packet) &&
        canonical(old.event) === canonical(event)
      ) {
        outcome = "duplicate";
        return old;
      }
      const updatedAt = new Date(
        Math.max(
          Date.parse(event.dateUpdated),
          now(),
          old ? Date.parse(old.packet.updatedAt) + 1 : 0,
        ),
      ).toISOString();
      if (old) outcome = "updated";
      return {
        event,
        packet: intakePacketSchema.parse({ ...packet, updatedAt }),
        receiptId: matched?.receipt.submissionId ?? null,
        researchAttempted,
        ...(researchUnavailable ? { researchUnavailable } : {}),
      };
    });
    await mutate<string[]>(
      store,
      storedId("contact-bookings", contact.id),
      (old) => {
        const values = old ?? [];
        if (values.includes(event.id)) return values;
        if (values.length >= 50)
          throw new Conflict("Contact booking capacity requires review.");
        return [...values, event.id];
      },
    );
    return { outcome, packet: record.packet };
  }
  async function syncSavedAssessment(contactId: string, submissionId: string, started: number) {
    if (!deps.crmSync) return { status: "disabled" };
    const key = storedId("crm-sync-status", submissionId);
    let claimed: Awaited<ReturnType<DurableStore["read"]>> | null = null;
    try {
      const old = await store.read(key);
      if (old) {
        const prior = crmStatusSchema.parse(old.value);
        return { status: prior.status === "synced" ? "duplicate" : prior.status };
      }
      if (!await store.cas(key, { status: "pending" }, null)) return { status: "pending" };
      claimed = await store.read(key);
      if (!claimed || crmStatusSchema.parse(claimed.value).status !== "pending")
        return { status: "review_required" };
      // Leave headroom under the public form's 15-second deadline. Await the
      // abort-aware adapter; never detach an unresolved mutation with Promise.race.
      const budget = Math.min(4000, 10000 - (Date.now() - started));
      let status: CrmStatus["status"] = "review_required";
      if (budget >= 500) {
        const result = await deps.crmSync({ contactId, submissionId }, AbortSignal.timeout(budget));
        status = result.status === "duplicate" ? "synced" :
          crmStatusSchema.parse({ status: result.status }).status;
      }
      if (!await store.cas(key, { status }, claimed.etag)) return { status: "review_required" };
      const checked = await store.read(key);
      if (!checked || crmStatusSchema.parse(checked.value).status !== status)
        return { status: "review_required" };
      return { status };
    } catch {
      // Assessment capture is already durable. Sync failure must not turn its
      // acknowledgment into "not saved" or leak provider errors/PII.
      if (claimed) {
        try { await store.cas(key, { status: "review_required" }, claimed.etag); } catch { /* pending remains */ }
      }
      return { status: "review_required" };
    }
  }
  async function assessment(req: Request, ip: string): Promise<Response> {
    const started = Date.now();
    sameOrigin(req, true);
    await limit("assessment-ip", ip, 10, 3600000);
    await limit("assessment-global", "all", 100, 86400000);
    const input = await body(req);
    const honeypot = input.website_confirm;
    delete input.website_confirm;
    if (honeypot !== undefined && honeypot !== "")
      throw new HttpError(400, "Invalid submission.");
    let submission: AssessmentSubmission;
    try {
      submission = parseAssessmentSubmission(input);
    } catch {
      throw new HttpError(
        400,
        "Assessment answers or score could not be validated.",
      );
    }
    if (Date.parse(submission.submitted_at_utc) > now() + 300000)
      throw new HttpError(400, "Submission timestamp is in the future.");
    await limit(
      "assessment-email",
      normalizedEmail(submission.contact.email),
      5,
      3600000,
    );
    const frozen = await snapshot(submission);
    let savedContactId = "";
    await withIdentityLock(submission.contact.email, async () => {
      const receiptKey = storedId("receipts", submission.submission_id);
      const previous = await store.read<Receipt>(receiptKey);
      let contact: GhlContact;
      if (previous) {
        if (previous.value.hash !== frozen.hash) throw new Conflict();
        contact = await deps.ghl.getContact(previous.value.contactId);
        if (
          contact.locationId !== config!.locationId ||
          contact.id !== previous.value.contactId ||
          normalizedEmail(contact.email ?? "") !==
            normalizedEmail(submission.contact.email)
        )
          throw new Conflict(
            "Saved CRM identity changed. Consultant review required.",
          );
      } else contact = await resolveContact(submission);
      await withIdentityLock(`contact/${contact.id}`, async () => {
        const receipt: Receipt = {
          submissionId: submission.submission_id,
          hash: frozen.hash,
          contactId: contact.id,
          receivedAt: frozen.receivedAt,
        };
        await immutable(store, receiptKey, receipt);
        await immutable(
          store,
          `contact-submissions/${digest(contact.id)}/${digest(submission.submission_id)}`,
          receipt,
        );
        savedContactId = contact.id;
        const known = await store.read<string[]>(
          storedId("contact-bookings", contact.id),
        );
        // Receipt/index/enrichment and booking preparation share this contact lock,
        // so a race cannot strand a missing-assessment packet or replace its link.
        for (const appointmentId of known?.value ?? []) {
          const booking = await store.read<BookingRecord>(
            storedId("bookings", appointmentId),
          );
          if (booking) await prepare(booking.value.event, contact);
        }
      });
    });
    const crmSync = await syncSavedAssessment(savedContactId, submission.submission_id, started);
    return reply({
      status: "saved",
      submission_id: submission.submission_id,
      contact_saved: true,
      receipt_id: digest(submission.submission_id),
      booking_url: ASSESSMENT_BOOKING_URL,
      crm_sync: crmSync,
    });
  }
  async function booking(req: Request): Promise<Response> {
    const secret = req.headers.get("x-mccann-webhook-secret") ?? "";
    if (secret.length > 512 || !safeEqual(secret, config!.webhookSecret))
      throw new HttpError(401, "Webhook authentication required.");
    let eventInput: z.infer<typeof webhookSchema>;
    try {
      eventInput = webhookSchema.parse(await body(req, 8000));
    } catch {
      throw new HttpError(400, "Invalid booking event.");
    }
    if (
      eventInput.location_id !== config!.locationId ||
      eventInput.calendar_id !== config!.calendarId
    )
      throw new HttpError(403, "Booking scope not allowed.");
    const event = appointmentSchema.parse(
      await deps.ghl.appointment(eventInput.appointment_id),
    );
    if (
      event.id !== eventInput.appointment_id ||
      event.calendarId !== config!.calendarId ||
      (event.locationId && event.locationId !== config!.locationId) ||
      event.contactId !== eventInput.contact_id
    )
      throw new Conflict(
        "Canonical appointment does not match the delivered identity.",
      );
    if (
      Date.parse(event.dateUpdated) > now() + 300000 ||
      (event.dateAdded &&
        Date.parse(event.dateAdded) > Date.parse(event.dateUpdated)) ||
      (event.endTime &&
        Date.parse(event.endTime) <= Date.parse(event.startTime))
    )
      throw new Conflict("Appointment timing could not be verified.");
    const contact = await deps.ghl.getContact(event.contactId);
    if (
      contact.id !== event.contactId ||
      contact.locationId !== config!.locationId
    )
      throw new Conflict("Canonical contact scope could not be verified.");
    const result = await withIdentityLock(`contact/${contact.id}`, () =>
      prepare(event, contact),
    );
    return reply({
      status: result.outcome,
      packet_id: digest(event.id),
      assessment_matched: Boolean(result.packet.assessment),
      preparation_mode: deps.research
        ? "questionnaire-crm-and-public-website"
        : "questionnaire-and-crm-only",
    });
  }
  async function session(req: Request, ip: string): Promise<Response> {
    sameOrigin(req, true);
    if (req.method === "DELETE") {
      const value = token(req);
      if (value)
        await mutate<LoginSession>(
          store,
          `sessions/${keyed(value)}`,
          (old) => ({ ...old, expiresAt: old?.expiresAt ?? 0, revoked: true }),
        );
      return reply({ signed_in: false }, 200, {
        "Set-Cookie": `${cookieName}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`,
      });
    }
    await limit("login", ip, 5, 900000);
    const input = z
      .strictObject({
        access_key: z.string().min(1).max(512),
        remember_device: z.boolean().optional().default(false),
      })
      .parse(await body(req, 2048));
    if (!safeEqual(input.access_key, config!.inboxKey))
      throw new HttpError(401, "Inbox access key was not accepted.");
    const value = random();
    const duration = input.remember_device ? REMEMBERED_TTL : TTL;
    const expiresAt = now() + duration;
    await immutable(store, `sessions/${keyed(value)}`, {
      expiresAt,
      revoked: false,
    });
    return reply(
      { signed_in: true, expires_at: new Date(expiresAt).toISOString() },
      200,
      {
        "Set-Cookie": `${cookieName}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${duration / 1000}`,
      },
    );
  }
  async function crmSummary() {
    if (!deps.crmSync) return { enabled: false };
    try {
      const counts = { pending: 0, synced: 0, review_required: 0, disabled: 0, stale: 0 };
      const keys = await store.keys("crm-sync-status/", 500);
      const sampled = keys.slice(0, 25);
      // Optional status must not add hundreds of serial reads to meeting import.
      for (let offset = 0; offset < sampled.length; offset += 6) {
        const rows = await Promise.all(sampled.slice(offset, offset + 6).map((key) => store.read(key)));
        for (const row of rows) counts[crmStatusSchema.parse(row?.value).status]++;
      }
      return { enabled: true, available: true, ...counts,
        inspected: sampled.length, total: keys.length, truncated: keys.length > sampled.length };
    } catch {
      return { enabled: true, available: false };
    }
  }
  async function inbox(req: Request): Promise<Response> {
    await authenticated(req);
    const url = new URL(req.url);
    let after = "";
    if ([...url.searchParams.keys()].some((key) => key !== "cursor"))
      throw new HttpError(400, "Unknown inbox parameter.");
    const cursor = url.searchParams.get("cursor");
    if (cursor) {
      if (cursor.length > 256)
        throw new HttpError(400, "Invalid inbox cursor.");
      const [key, signature, ...rest] = cursor.split(".");
      if (
        rest.length ||
        !/^bookings\/[a-f0-9]{64}$/.test(
          Buffer.from(key, "base64url").toString(),
        ) ||
        !signature ||
        !safeEqual(signature, keyed(`cursor/${key}`))
      )
        throw new HttpError(400, "Invalid inbox cursor.");
      after = Buffer.from(key, "base64url").toString();
    }
    const keys = (await store.keys("bookings/", 500)).filter(
      (key) => key > after,
    );
    const page = keys.slice(0, 50);
    const packets = await Promise.all(
      page.map(async (key) => {
        const record = await store.read<BookingRecord>(key);
        if (!record) throw new StorageUnavailable();
        return intakePacketSchema.parse(record.value.packet);
      }),
    );
    const next =
      keys.length > 50
        ? Buffer.from(page[page.length - 1]).toString("base64url")
        : null;
    return reply({
      packets,
      ...(!after ? { crm_sync: await crmSummary() } : {}),
      ...(next ? { next_cursor: `${next}.${keyed(`cursor/${next}`)}` } : {}),
      preparation_mode: deps.research
        ? "questionnaire-crm-and-public-website"
        : "questionnaire-and-crm-only",
      public_research_available: Boolean(deps.research),
    });
  }
  return async function handle(req: Request, ip = ""): Promise<Response> {
    const path = new URL(req.url).pathname;
    if (path === "/api/integration-status" && req.method === "GET") {
      let ready = Boolean(config);
      if (ready) {
        try {
          await store.read("health/bridge");
        } catch {
          ready = false;
        }
      }
      return reply({
        acceptingSubmissions: ready,
        assessment_ready: ready,
        booking_ready: ready,
        inbox_ready: ready,
        public_research_available: Boolean(ready && deps.research),
      });
    }
    const methods: Record<string, string[]> = {
      "/api/assessment": ["POST"],
      "/api/booking": ["POST"],
      "/api/session": ["POST", "DELETE"],
      "/api/inbox": ["GET"],
    };
    if (!methods[path]) return reply({ error: "Not found." }, 404);
    if (!methods[path].includes(req.method))
      return reply({ error: "Method not allowed." }, 405, {
        Allow: methods[path].join(", "),
      });
    if (!config)
      return reply(
        { error: "Integration is not configured. Nothing was submitted." },
        503,
      );
    try {
      if (path === "/api/assessment") return await assessment(req, ip);
      if (path === "/api/booking") return await booking(req);
      if (path === "/api/session") return await session(req, ip);
      return await inbox(req);
    } catch (error) {
      if (error instanceof HttpError)
        return reply(
          { error: error.message },
          error.status,
          error.status === 429 ? { "Retry-After": "900" } : {},
        );
      if (error instanceof Conflict)
        return reply({ error: error.message }, 409);
      if (error instanceof z.ZodError)
        return reply(
          { error: "Source data did not match the expected format." },
          400,
        );
      // Never echo upstream response bodies, request content, keys or PII to logs/clients.
      return reply(
        {
          error:
            "The operation could not be durably verified. Retry the same request later.",
        },
        503,
      );
    }
  };
}
