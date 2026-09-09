import {
  buildAssessmentSubmission,
  QUESTIONS,
  type AssessmentSubmission,
} from "../src/domain/assessment";
import {
  INTAKE_LOCATION_ID,
  INTAKE_CALENDAR_ID,
} from "../src/domain/intakeSchema";
import type { BridgeConfig } from "./config";
import { canonical, type DurableStore, type Stored } from "./storage";
import type { GhlAppointment, GhlClient, GhlContact } from "./ghl";

/** Local test harness only: never selected by the production function. */
export class MemoryStore implements DurableStore {
  rows = new Map<string, Stored>();
  writes: string[] = [];
  failure: ((key: string, value: unknown) => boolean) | null = null;
  revision = 0;
  async read<T>(key: string): Promise<Stored<T> | null> {
    const item = this.rows.get(key);
    return item ? (structuredClone(item) as Stored<T>) : null;
  }
  async cas(
    key: string,
    value: unknown,
    etag: string | null,
  ): Promise<boolean> {
    if (this.failure?.(key, value)) throw new Error("Injected storage failure");
    const old = this.rows.get(key);
    if ((old?.etag ?? null) !== etag) return false;
    this.rows.set(key, {
      value: JSON.parse(canonical(value)),
      etag: `etag-${++this.revision}`,
    });
    this.writes.push(key);
    return true;
  }
  async keys(prefix: string, max = 500): Promise<string[]> {
    const keys = [...this.rows.keys()]
      .filter((k) => k.startsWith(prefix))
      .sort();
    if (keys.length > max) throw new Error("Capacity");
    return keys;
  }
}
export const TEST_CONFIG: BridgeConfig = {
  origin: "https://audit.example.test",
  inboxKey: "inbox-a1b2c3d4e5f6g7h8i9j0-k1l2m3n4",
  sessionSecret: "session-n1m2b3v4c5x6z7a8s9d0-f1g2h3",
  webhookSecret: "booking-q1w2e3r4t5y6u7i8o9p0-a1s2d3",
  ghlToken: "fake-private-token-for-local-tests-only",
  locationId: INTAKE_LOCATION_ID,
  calendarId: INTAKE_CALENDAR_ID,
  timezone: "America/Edmonton",
};
export const TEST_NOW = Date.parse("2026-09-05T16:00:00Z");
export const testSubmission = (id = "submission-test"): AssessmentSubmission =>
  buildAssessmentSubmission(
    {
      first_name: "Taylor",
      last_name: "Example",
      email: "taylor@example.test",
      company: "Fictional Workshop",
      team_size: "6–20 people",
      industry: "Construction / trades",
      operational_priority: "Reduce repetitive admin",
      phone: "",
      website: "https://example.test",
      role: "Owner",
      current_tools: "Spreadsheets",
      bottleneck_details: "Weekly report copying",
    },
    Object.fromEntries(QUESTIONS.map((q) => [q.key, 2])),
    { submissionId: id, submittedAt: "2026-09-05T15:55:00Z" },
  );
export class FakeGhl implements GhlClient {
  contacts: GhlContact[] = [];
  upserts = 0;
  reads = 0;
  fail = false;
  afterUpsert: (() => void) | null = null;
  event: GhlAppointment = {
    id: "appointment-test",
    locationId: INTAKE_LOCATION_ID,
    calendarId: INTAKE_CALENDAR_ID,
    contactId: "contact-test",
    startTime: "2026-09-10T16:00:00Z",
    endTime: "2026-09-10T16:30:00Z",
    dateUpdated: "2026-09-05T15:00:00Z",
    appointmentStatus: "confirmed",
  };
  defaultContact: GhlContact = {
    id: "contact-test",
    locationId: INTAKE_LOCATION_ID,
    email: "taylor@example.test",
    firstName: "CRM Taylor",
    companyName: "CRM Example",
    website: "https://example.test",
  };
  async find(field: "email" | "phone", value: string): Promise<GhlContact[]> {
    if (this.fail) throw new Error("Injected CRM failure");
    return this.contacts
      .filter((c) => c[field] === value)
      .map((c) => structuredClone(c));
  }
  async getContact(id: string): Promise<GhlContact> {
    this.reads++;
    if (this.fail) throw new Error("Injected CRM failure");
    const contact = this.contacts.find((c) => c.id === id);
    if (!contact) throw new Error("Missing fake contact");
    return structuredClone(contact);
  }
  async upsertEmail(email: string): Promise<string> {
    if (this.fail) throw new Error("Injected CRM failure");
    this.upserts++;
    this.contacts.push({ ...this.defaultContact, email });
    this.afterUpsert?.();
    return this.defaultContact.id;
  }
  async appointment(): Promise<GhlAppointment> {
    if (this.fail) throw new Error("Injected CRM failure");
    return structuredClone(this.event);
  }
}
