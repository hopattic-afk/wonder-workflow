// @vitest-environment node
import { describe, it, expect } from "vitest";
import { HttpGhl, readBounded } from "./ghl";
import { TEST_CONFIG } from "./testing";
// Sanitized shape of the provider's canonical appointment lookup response.
const appointmentResponse = {
  appointment: {
    id: "appointment-example",
    calendarId: TEST_CONFIG.calendarId,
    contactId: "contact-example",
    locationId: TEST_CONFIG.locationId,
    startTime: "2026-09-07T09:00:00-06:00",
    endTime: "2026-09-07T09:30:00-06:00",
    dateAdded: "2026-09-05T23:26:31.000Z",
    dateUpdated: "2026-09-05T23:26:31.000Z",
    appointmentStatus: "confirmed",
    title: "Fictional integration test",
    assignedUserId: "user-example",
  },
  traceId: "trace-example",
};

describe("GHL HTTP adapter boundary", () => {
  it("reads the canonical appointment envelope and validates its nested provider data", async () => {
    let requestedUrl = "";
    let request: RequestInit | undefined;
    const client = new HttpGhl(TEST_CONFIG, async (url, init) => {
      requestedUrl = String(url);
      request = init;
      return Response.json(appointmentResponse);
    });
    const appointment = await client.appointment("appointment-example");
    const {
      title: _title,
      assignedUserId: _user,
      ...expected
    } = appointmentResponse.appointment;
    expect(appointment).toEqual(expected);
    expect(requestedUrl).toBe(
      "https://services.leadconnectorhq.com/calendars/events/appointments/appointment-example",
    );
    expect(request?.method).toBe("GET");
    expect(request?.headers).toMatchObject({ Version: "v3" });
    expect(request?.body).toBeUndefined();
    expect(request?.redirect).toBe("error");
  });
  it.each([
    { contactId: undefined },
    { calendarId: "invalid/id" },
    { dateUpdated: "not-a-timestamp" },
    { appointmentStatus: "unknown" },
  ])("rejects malformed canonical appointment fields: %j", async (change) => {
    const client = new HttpGhl(TEST_CONFIG, async () =>
      Response.json({
        ...appointmentResponse,
        appointment: { ...appointmentResponse.appointment, ...change },
      }),
    );
    await expect(client.appointment("appointment-example")).rejects.toThrow();
  });
  it("rejects an unexpected envelope and invalid lookup identity", async () => {
    let calls = 0;
    const client = new HttpGhl(TEST_CONFIG, async () => {
      calls++;
      return Response.json({ event: appointmentResponse.appointment });
    });
    await expect(client.appointment("appointment-example")).rejects.toThrow();
    expect(calls).toBe(1);
    await expect(client.appointment("../other-contact")).rejects.toThrow();
    expect(calls).toBe(1);
  });
  it("uses exact POST filter search with Version v3 and PII in body only", async () => {
    let request: RequestInit | undefined;
    let url = "";
    const client = new HttpGhl(TEST_CONFIG, async (input, init) => {
      url = String(input);
      request = init;
      return Response.json({
        contacts: [
          {
            id: "contact",
            locationId: TEST_CONFIG.locationId,
            email: "name@example.test",
          },
        ],
        total: 1,
      });
    });
    expect(await client.find("email", "name@example.test")).toHaveLength(1);
    expect(url).toBe("https://services.leadconnectorhq.com/contacts/search");
    expect(url).not.toContain("@");
    expect(request?.headers).toMatchObject({ Version: "v3" });
    expect(JSON.parse(request!.body as string)).toMatchObject({
      pageLimit: 2,
      filters: [{ field: "email", operator: "eq", value: "name@example.test" }],
    });
    expect(request?.redirect).toBe("error");
  });
  it("upserts only email/location without changing contact attributes or consent", async () => {
    let body: Record<string, unknown> = {};
    const client = new HttpGhl(TEST_CONFIG, async (_url, init) => {
      body = JSON.parse(init!.body as string);
      return Response.json({ contact: { id: "created" } });
    });
    expect(await client.upsertEmail("name@example.test")).toBe("created");
    expect(body).toEqual({
      locationId: TEST_CONFIG.locationId,
      email: "name@example.test",
      createNewIfDuplicateAllowed: false,
    });
  });
  it("rejects wrong-identity and ambiguous search results", async () => {
    const wrong = new HttpGhl(TEST_CONFIG, async () =>
      Response.json({
        contacts: [
          {
            id: "contact",
            locationId: TEST_CONFIG.locationId,
            email: "wrong@example.test",
          },
        ],
      }),
    );
    await expect(wrong.find("email", "name@example.test")).rejects.toThrow();
    const many = new HttpGhl(TEST_CONFIG, async () =>
      Response.json({ contacts: [], total: 2 }),
    );
    await expect(many.find("email", "name@example.test")).rejects.toThrow();
  });
  it("sanitizes upstream errors and rejects oversized responses", async () => {
    const client = new HttpGhl(
      TEST_CONFIG,
      async () => new Response("Upstream private secret", { status: 500 }),
    );
    await expect(client.getContact("contact")).rejects.toThrow(
      "temporarily unavailable",
    );
    await expect(readBounded(new Response("too large"), 3)).rejects.toThrow(
      "Payload too large",
    );
  });
});
