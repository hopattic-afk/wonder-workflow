import { z } from "zod";
import type { BridgeConfig } from "./config";
import { Conflict } from "./storage";
export const identity = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/);
const short = z.string().max(12000).nullish();
const contactSchema = z.object({
  id: identity,
  locationId: identity,
  email: z.string().email().max(254).nullish(),
  phone: short,
  firstName: short,
  lastName: short,
  name: short,
  companyName: short,
  website: short,
  city: short,
  state: short,
  country: short,
});
export type GhlContact = z.infer<typeof contactSchema>;
export const appointmentSchema = z.object({
  id: identity,
  calendarId: identity,
  locationId: identity.optional(),
  contactId: identity,
  startTime: z.iso.datetime({ offset: true }),
  endTime: z.iso.datetime({ offset: true }).optional(),
  dateAdded: z.iso.datetime({ offset: true }).optional(),
  dateUpdated: z.iso.datetime({ offset: true }),
  appointmentStatus: z.enum([
    "new",
    "confirmed",
    "cancelled",
    "canceled",
    "showed",
    "noshow",
    "no-show",
    "invalid",
  ]),
});
export type GhlAppointment = z.infer<typeof appointmentSchema>;
export interface GhlClient {
  find(field: "email" | "phone", value: string): Promise<GhlContact[]>;
  getContact(id: string): Promise<GhlContact>;
  upsertEmail(email: string): Promise<string>;
  appointment(id: string): Promise<GhlAppointment>;
}
export const normalizedEmail = (value: string) => value.trim().toLowerCase();
export function normalizedPhone(value: string): string {
  const v = value.replace(/[\s().-]/g, "");
  return /^\+[1-9]\d{6,14}$/.test(v) ? v : "";
}
export class GhlUnavailable extends Error {
  constructor() {
    super(
      "CRM verification is temporarily unavailable. Retry the same submission.",
    );
  }
}
export class HttpGhl implements GhlClient {
  constructor(
    private config: BridgeConfig,
    private fetcher: typeof fetch = fetch,
  ) {}
  private async request(path: string, body?: unknown): Promise<unknown> {
    try {
      const response = await this.fetcher(
        `https://services.leadconnectorhq.com${path}`,
        {
          method: body === undefined ? "GET" : "POST",
          headers: {
            Authorization: `Bearer ${this.config.ghlToken}`,
            Version: "v3",
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
          signal: AbortSignal.timeout(8000),
          redirect: "error",
        },
      );
      if (!response.ok) throw new GhlUnavailable();
      const text = await readBounded(response, 512000);
      return JSON.parse(text);
    } catch {
      throw new GhlUnavailable();
    }
  }
  async find(field: "email" | "phone", value: string): Promise<GhlContact[]> {
    // POST keeps email and phone values out of URL/access logs. Exact-filter search,
    // then verify every returned primary identity; never use fuzzy matching.
    const data = z
      .object({
        contacts: z.array(contactSchema).max(2),
        total: z.number().optional(),
      })
      .parse(
        await this.request("/contacts/search", {
          locationId: this.config.locationId,
          page: 1,
          pageLimit: 2,
          filters: [{ field, operator: "eq", value }],
        }),
      );
    if ((data.total ?? data.contacts.length) > 1 || data.contacts.length > 1)
      throw new Conflict(
        "Contact identity is ambiguous. Ask the consultant to review it.",
      );
    for (const contact of data.contacts) {
      if (
        contact.locationId !== this.config.locationId ||
        (field === "email"
          ? normalizedEmail(contact.email ?? "") !== normalizedEmail(value)
          : normalizedPhone(contact.phone ?? "") !== normalizedPhone(value))
      )
        throw new Conflict();
    }
    return data.contacts;
  }
  async getContact(id: string): Promise<GhlContact> {
    identity.parse(id);
    return z
      .object({ contact: contactSchema })
      .parse(await this.request(`/contacts/${id}`)).contact;
  }
  async upsertEmail(email: string): Promise<string> {
    // Never let anonymous assessment answers overwrite existing names, phone, tags,
    // DND, fields or consent. Only email identity is created/associated here.
    const value = z.object({ contact: z.object({ id: identity }) }).parse(
      await this.request("/contacts/upsert", {
        locationId: this.config.locationId,
        email,
        createNewIfDuplicateAllowed: false,
      }),
    );
    return value.contact.id;
  }
  async appointment(id: string): Promise<GhlAppointment> {
    identity.parse(id);
    return z
      .object({ appointment: appointmentSchema })
      .parse(await this.request(`/calendars/events/appointments/${id}`))
      .appointment;
  }
}
export async function readBounded(
  response: Response | Request,
  max: number,
): Promise<string> {
  const size = response.headers.get("content-length");
  if (size && (!/^\d+$/.test(size) || Number(size) > max))
    throw new Error("Payload too large.");
  if (!response.body) return "";
  const reader = response.body.getReader();
  const parts: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      length += part.value.byteLength;
      if (length > max) throw new Error("Payload too large.");
      parts.push(part.value);
    }
  } catch (error) {
    await reader.cancel();
    throw error;
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.length;
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}
