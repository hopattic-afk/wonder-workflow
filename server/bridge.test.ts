// @vitest-environment node
import { describe, it, expect } from "vitest";
import { createBridge, type BridgeDependencies } from "./bridge";
import {
  TEST_CONFIG,
  TEST_NOW,
  MemoryStore,
  FakeGhl,
  testSubmission,
} from "./testing";
import { digest } from "./storage";
import { readConfig } from "./config";
import {
  buildAssessmentSubmission,
  LEGACY_ASSESSMENT_VERSION,
  ORIGINAL_ASSESSMENT_QUESTIONS,
  QUESTIONS,
} from "../src/domain/assessment";
import { applyIntakePacket } from "../src/domain/intake";
import { defaultSettings } from "../src/domain/defaults";
import type { Store } from "../src/domain/types";

function harness(extra: Partial<BridgeDependencies> = {}) {
  const store = new MemoryStore();
  const ghl = new FakeGhl();
  let clock = TEST_NOW;
  const handle = createBridge({
    config: TEST_CONFIG,
    store,
    ghl,
    now: () => clock,
    ...extra,
  });
  const req = (
    path: string,
    method = "POST",
    body?: unknown,
    headers: Record<string, string> = {},
  ) =>
    new Request(`${TEST_CONFIG.origin}/api/${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Origin: TEST_CONFIG.origin,
        ...headers,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  const assessment = (body: unknown = testSubmission()) =>
    handle(req("assessment", "POST", body), "203.0.113.1");
  const booking = (
    body: unknown = {
      appointment_id: ghl.event.id,
      contact_id: ghl.event.contactId,
      location_id: TEST_CONFIG.locationId,
      calendar_id: TEST_CONFIG.calendarId,
    },
  ) =>
    handle(
      req("booking", "POST", body, {
        "X-McCann-Webhook-Secret": TEST_CONFIG.webhookSecret,
      }),
      "203.0.113.2",
    );
  const login = async () => {
    const r = await handle(
      req("session", "POST", { access_key: TEST_CONFIG.inboxKey }),
      "203.0.113.1",
    );
    expect(r.status).toBe(200);
    return r.headers.get("set-cookie")!.split(";")[0];
  };
  const inbox = (cookie: string, cursor?: string) =>
    handle(
      req(
        `inbox${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`,
        "GET",
        undefined,
        { Cookie: cookie },
      ),
      "203.0.113.1",
    );
  return {
    store,
    ghl,
    handle,
    req,
    assessment,
    booking,
    login,
    inbox,
    advance: (n: number) => {
      clock += n;
    },
  };
}

describe("optional CRM synchronization hook", () => {
  it("defaults off without additional sync storage writes", async () => {
    const h = harness();
    const response = await h.assessment();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "saved", crm_sync: { status: "disabled" } });
    expect(h.store.writes.some((key) => key.startsWith("crm-sync"))).toBe(false);
    const cookie = await h.login();
    expect(await (await h.inbox(cookie)).json()).toMatchObject({ crm_sync: { enabled: false } });
  });
  it("runs only after durable verified receipt and index; completed retries do not replay", async () => {
    let calls = 0;
    const h = harness({ crmSync: async (input, signal) => {
      calls++;
      expect(signal.aborted).toBe(false);
      expect(input.contactId).toBe(h.ghl.defaultContact.id);
      const receipt = await h.store.read(`receipts/${digest(input.submissionId)}`);
      expect(receipt?.value).toMatchObject({ contactId: input.contactId });
      expect(await h.store.read(`contact-submissions/${digest(input.contactId)}/${digest(input.submissionId)}`)).not.toBeNull();
      return { status: "synced" };
    } });
    expect(await (await h.assessment()).json()).toMatchObject({ status: "saved", crm_sync: { status: "synced" } });
    expect(await (await h.assessment()).json()).toMatchObject({ status: "saved", crm_sync: { status: "duplicate" } });
    expect(calls).toBe(1);
    const cookie = await h.login();
    const summary = (await (await h.inbox(cookie)).json()).crm_sync;
    expect(summary).toMatchObject({ enabled: true, available: true, synced: 1, pending: 0, review_required: 0 });
    expect(JSON.stringify(summary)).not.toContain(h.ghl.defaultContact.id);
  });
  it("never invokes CRM enrichment if association persistence fails", async () => {
    let calls = 0;
    const h = harness({ crmSync: async () => { calls++; return { status: "synced" }; } });
    h.store.failure = (key) => key.startsWith("contact-submissions/");
    expect((await h.assessment()).status).toBe(503);
    expect(calls).toBe(0);
  });
  it("keeps saved acknowledgment on sync failure and exposes sanitized operator review", async () => {
    let calls = 0;
    const h = harness({ crmSync: async () => { calls++; throw new Error("private-provider-body-secret"); } });
    const response = await h.assessment();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ status: "saved", contact_saved: true, crm_sync: { status: "review_required" } });
    expect(JSON.stringify(body)).not.toContain("private-provider");
    await h.assessment();
    expect(calls).toBe(1);
    expect((await h.inbox("")).status).toBe(401);
    const cookie = await h.login();
    expect(await (await h.inbox(cookie)).json()).toMatchObject({ crm_sync: { review_required: 1, pending: 0 } });
  });
  it("does not call the mutation hook when sync status storage fails", async () => {
    let calls = 0;
    const h = harness({ crmSync: async () => { calls++; return { status: "synced" }; } });
    h.store.failure = (key) => key.startsWith("crm-sync-status/");
    expect(await (await h.assessment()).json()).toMatchObject({ status: "saved", crm_sync: { status: "review_required" } });
    expect(calls).toBe(0);
  });
  it("caps optional summary at 25 reads and labels an incomplete sample", async () => {
    const h = harness({ crmSync: async () => ({ status: "synced" }) });
    for (let n = 0; n < 30; n++) await h.store.cas(`crm-sync-status/${digest(String(n))}`, { status: "pending" }, null);
    const cookie = await h.login();
    let reads = 0;
    const read = h.store.read.bind(h.store);
    h.store.read = async (key) => { if (key.startsWith("crm-sync-status/")) reads++; return read(key); };
    const response = await h.inbox(cookie);
    expect(response.status).toBe(200);
    expect((await response.json()).crm_sync).toMatchObject({ inspected: 25, total: 30, truncated: true, pending: 25 });
    expect(reads).toBe(25);
  });
  it("awaits abort-aware sync termination instead of leaving detached work", async () => {
    let stopped = false;
    const h = harness({ crmSync: async (_input, signal) => {
      await new Promise<void>((resolve) => signal.addEventListener("abort", () => {
        stopped = true;
        resolve();
      }, { once: true }));
      return { status: "review_required" };
    } });
    const response = await h.assessment();
    expect(stopped).toBe(true);
    expect(await response.json()).toMatchObject({ status: "saved", crm_sync: { status: "review_required" } });
  }, 7000);
});

describe("configuration and HTTP authentication", () => {
  it("is unavailable until all configuration is provided", async () => {
    const h = harness();
    const disabled = createBridge({ config: null, store: h.store, ghl: h.ghl });
    expect(
      await (await disabled(h.req("integration-status", "GET"))).json(),
    ).toMatchObject({ acceptingSubmissions: false });
    expect(
      (await disabled(h.req("assessment", "POST", testSubmission()))).status,
    ).toBe(503);
    expect(h.store.writes).toEqual([]);
    expect(readConfig(() => undefined)).toBeNull();
  });
  it("enforces exact scope, HTTPS, separate strong secrets and timezone at configuration", () => {
    const env: Record<string, string> = {
      MCCANN_BRIDGE_ENABLED: "true",
      MCCANN_APP_ORIGIN: TEST_CONFIG.origin,
      MCCANN_INBOX_ACCESS_KEY: TEST_CONFIG.inboxKey,
      MCCANN_SESSION_SECRET: TEST_CONFIG.sessionSecret,
      MCCANN_BOOKING_WEBHOOK_SECRET: TEST_CONFIG.webhookSecret,
      GHL_PRIVATE_INTEGRATION_TOKEN: TEST_CONFIG.ghlToken,
      GHL_LOCATION_ID: TEST_CONFIG.locationId,
      GHL_CALENDAR_ID: TEST_CONFIG.calendarId,
      GHL_CALENDAR_TIMEZONE: TEST_CONFIG.timezone,
    };
    expect(readConfig((k) => env[k])).toEqual(TEST_CONFIG);
    const aliasOrigin = "https://ai.example.test";
    expect(
      readConfig((k) =>
        k === "MCCANN_APP_ALIAS_ORIGIN" ? aliasOrigin : env[k],
      ),
    ).toEqual({
      ...TEST_CONFIG,
      aliasOrigin,
    });
    const brandOrigin = "https://wonderworkflow.com";
    expect(readConfig((k) => ({
      ...env,
      MCCANN_APP_ALIAS_ORIGIN: aliasOrigin,
      MCCANN_APP_BRAND_ORIGIN: brandOrigin,
    })[k])).toEqual({ ...TEST_CONFIG, aliasOrigin, brandOrigin });
    for (const invalidAlias of [
      "",
      "http://ai.example.test",
      "https://ai.example.test/",
      "https://ai.example.test/assessment",
      "https://ai.example.test?query=1",
      "https://ai.example.test#fragment",
      "https://user:pass@ai.example.test",
      "https://*.example.test",
      " https://ai.example.test",
      "not-a-url",
    ]) {
      expect(
        readConfig((k) =>
          k === "MCCANN_APP_ALIAS_ORIGIN" ? invalidAlias : env[k],
        ),
      ).toBeNull();
      expect(
        readConfig((k) =>
          k === "MCCANN_APP_BRAND_ORIGIN" ? invalidAlias : env[k],
        ),
      ).toBeNull();
    }
    for (const change of [
      { MCCANN_APP_ORIGIN: "http://audit.example.test" },
      { GHL_CALENDAR_ID: "other" },
      { GHL_CALENDAR_TIMEZONE: "invalid" },
      { MCCANN_INBOX_ACCESS_KEY: "x".repeat(40) },
      { MCCANN_SESSION_SECRET: TEST_CONFIG.inboxKey },
    ])
      expect(
        readConfig(
          (k) =>
            (
              Object.assign({}, env, change) as unknown as Record<
                string,
                string
              >
            )[k],
        ),
      ).toBeNull();
  });
  it.each([
    ["primary", TEST_CONFIG.origin, undefined],
    ["alias", "https://ai.example.test", undefined],
    ["alias", "https://ai.example.test", true],
    ["brand", "https://wonderworkflow.com", undefined],
    ["brand", "https://wonderworkflow.com", true],
  ] as const)(
    "accepts same-host %s login and assessment on %s with remember_device=%j",
    async (_name, requestOrigin, remember) => {
      const h = harness();
      const aliasOrigin = "https://ai.example.test";
      const handle = createBridge({
        config: { ...TEST_CONFIG, aliasOrigin, brandOrigin: "https://wonderworkflow.com" },
        store: h.store,
        ghl: h.ghl,
        now: () => TEST_NOW,
      });
      const request = (endpoint: string, body: unknown) =>
        new Request(`${requestOrigin}/api/${endpoint}`, {
          method: "POST",
          headers: {
            Origin: requestOrigin,
            "Sec-Fetch-Site": "same-origin",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });
      const login = await handle(
        request("session", {
          access_key: TEST_CONFIG.inboxKey,
          ...(remember === undefined ? {} : { remember_device: remember }),
        }),
        "alias-login",
      );
      expect(login.status).toBe(200);
      const hours = remember ? 30 * 24 : 8;
      expect(await login.json()).toMatchObject({
        expires_at: new Date(TEST_NOW + hours * 3600000).toISOString(),
      });
      const cookie = login.headers.get("set-cookie")!;
      expect(cookie).toContain(`Max-Age=${hours * 3600}`);
      expect(cookie).not.toContain("Domain=");
      expect(
        (
          await handle(
            new Request(`${requestOrigin}/api/inbox`, {
              headers: {
                Cookie: cookie.split(";")[0],
                "Sec-Fetch-Site": "same-origin",
              },
            }),
          )
        ).status,
      ).toBe(200);
      const assessment = await handle(
        request("assessment", testSubmission()),
        "alias-assessment",
      );
      expect(assessment.status).toBe(200);
      expect(await assessment.json()).toMatchObject({ contact_saved: true });
      expect(assessment.headers.get("access-control-allow-origin")).toBeNull();
      expect(
        (
          await handle(
            h.req("session", "POST", { access_key: TEST_CONFIG.inboxKey }),
            "primary-login",
          )
        ).status,
      ).toBe(200);
    },
  );
  it.each(["session", "assessment"])(
    "rejects unconfigured hosts and cross-host origins for %s",
    async (endpoint) => {
      const aliasOrigin = "https://ai.example.test";
      const brandOrigin = "https://wonderworkflow.com";
      const cases = [
        { host: aliasOrigin, origin: aliasOrigin, configured: false },
        { host: brandOrigin, origin: brandOrigin, configured: false },
        { host: brandOrigin, origin: aliasOrigin, configured: true },
        { host: aliasOrigin, origin: brandOrigin, configured: true },
        { host: brandOrigin, origin: TEST_CONFIG.origin, configured: true },
        { host: TEST_CONFIG.origin, origin: brandOrigin, configured: true },
        { host: brandOrigin, origin: undefined, configured: true },
        { host: "https://www.wonderworkflow.com", origin: "https://www.wonderworkflow.com", configured: true },
        {
          host: "https://unknown.example.test",
          origin: "https://unknown.example.test",
          configured: true,
        },
        { host: aliasOrigin, origin: TEST_CONFIG.origin, configured: true },
        { host: TEST_CONFIG.origin, origin: aliasOrigin, configured: true },
        { host: aliasOrigin, origin: undefined, configured: true },
        {
          host: aliasOrigin,
          origin: aliasOrigin,
          configured: true,
          site: "cross-site",
        },
        {
          host: aliasOrigin,
          origin: aliasOrigin,
          configured: true,
          site: "same-site",
        },
      ];
      for (const example of cases) {
        const h = harness();
        const handle = createBridge({
          config: {
            ...TEST_CONFIG,
            ...(example.configured ? { aliasOrigin, brandOrigin } : {}),
          },
          store: h.store,
          ghl: h.ghl,
        });
        const response = await handle(
          new Request(`${example.host}/api/${endpoint}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(example.origin ? { Origin: example.origin } : {}),
              ...(example.site ? { "Sec-Fetch-Site": example.site } : {}),
            },
            body: JSON.stringify(
              endpoint === "session"
                ? { access_key: TEST_CONFIG.inboxKey }
                : testSubmission(),
            ),
          }),
          "test-client",
        );
        expect(response.status).toBe(403);
        expect(response.headers.get("access-control-allow-origin")).toBeNull();
        expect(h.store.writes).toEqual([]);
        expect(h.ghl.upserts).toBe(0);
      }
    },
  );
  it("returns public readiness booleans without configuration names or secrets", async () => {
    const h = harness();
    const res = await h.handle(h.req("integration-status", "GET"));
    const text = await res.text();
    expect(JSON.parse(text).acceptingSubmissions).toBe(true);
    expect(text).not.toContain(TEST_CONFIG.ghlToken);
    expect(text).not.toContain("GHL_");
    expect(res.headers.get("cache-control")).toContain("no-store");
  });
  it("requires same-origin JSON and rejects unknown methods", async () => {
    const h = harness();
    expect(
      (
        await h.handle(
          h.req("assessment", "POST", testSubmission(), {
            Origin: "https://evil.example",
          }),
          "ip",
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await h.handle(
          h.req("assessment", "POST", testSubmission(), {
            "Content-Type": "text/plain",
          }),
          "ip",
        )
      ).status,
    ).toBe(415);
    expect((await h.handle(h.req("assessment", "GET"))).status).toBe(405);
    expect(
      (await h.handle(h.req("assessment", "OPTIONS"))).headers.get(
        "access-control-allow-origin",
      ),
    ).toBeNull();
    expect(h.ghl.upserts).toBe(0);
  });
  it("protects inbox, issues secure cookies, expires and revokes sessions", async () => {
    const h = harness();
    expect((await h.inbox("")).status).toBe(401);
    const res = await h.handle(
      h.req("session", "POST", { access_key: TEST_CONFIG.inboxKey }),
      "ip",
    );
    const cookie = res.headers.get("set-cookie")!;
    expect(cookie).toContain("HttpOnly; Secure; SameSite=Strict");
    expect(cookie).toContain("__Host-");
    expect(cookie).not.toContain(TEST_CONFIG.inboxKey);
    expect((await h.inbox(cookie.split(";")[0])).status).toBe(200);
    await h.handle(
      h.req("session", "DELETE", undefined, { Cookie: cookie.split(";")[0] }),
      "ip",
    );
    expect((await h.inbox(cookie.split(";")[0])).status).toBe(401);
    const another = await h.login();
    h.advance(8 * 3600000 + 1);
    expect((await h.inbox(another)).status).toBe(401);
  });
  it.each([
    { remember: undefined, hours: 8 },
    { remember: false, hours: 8 },
    { remember: true, hours: 30 * 24 },
  ])(
    "keeps cookie and fixed server expiry aligned for remember_device=$remember",
    async ({ remember, hours }) => {
      const h = harness();
      const response = await h.handle(
        h.req("session", "POST", {
          access_key: TEST_CONFIG.inboxKey,
          ...(remember === undefined ? {} : { remember_device: remember }),
        }),
        "ip",
      );
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({
        expires_at: new Date(TEST_NOW + hours * 3600000).toISOString(),
      });
      const cookie = response.headers.get("set-cookie")!;
      expect(cookie).toContain(`Max-Age=${hours * 3600}`);
      expect(cookie).toContain("Path=/; HttpOnly; Secure; SameSite=Strict");
      const token = cookie.split(";")[0];
      h.advance(hours * 3600000 - 1);
      expect((await h.inbox(token)).status).toBe(200);
      h.advance(1);
      expect((await h.inbox(token)).status).toBe(401);
    },
  );
  it("does not extend an existing eight-hour session and immediately revokes remembered sessions", async () => {
    const h = harness();
    const oldCookie = await h.login();
    const response = await h.handle(
      h.req("session", "POST", {
        access_key: TEST_CONFIG.inboxKey,
        remember_device: true,
      }),
      "ip",
    );
    const rememberedCookie = response.headers.get("set-cookie")!.split(";")[0];
    h.advance(8 * 3600000);
    expect((await h.inbox(oldCookie)).status).toBe(401);
    expect((await h.inbox(rememberedCookie)).status).toBe(200);
    const logout = await h.handle(
      h.req("session", "DELETE", undefined, { Cookie: rememberedCookie }),
      "ip",
    );
    expect(logout.status).toBe(200);
    expect(logout.headers.get("set-cookie")).toContain("Max-Age=0");
    expect((await h.inbox(rememberedCookie)).status).toBe(401);
  });
  it.each(["true", "false", 1, 0, null, {}, []])(
    "rejects malformed remember_device=%j without creating a session",
    async (remember) => {
      const h = harness();
      const response = await h.handle(
        h.req("session", "POST", {
          access_key: TEST_CONFIG.inboxKey,
          remember_device: remember,
        }),
        "ip",
      );
      expect(response.status).toBe(400);
      expect(response.headers.get("set-cookie")).toBeNull();
      expect(h.store.writes.some((key) => key.startsWith("sessions/"))).toBe(
        false,
      );
    },
  );
  it("rejects cross-origin login/logout and rate-limits invalid access keys", async () => {
    const h = harness();
    expect(
      (
        await h.handle(
          h.req(
            "session",
            "POST",
            { access_key: TEST_CONFIG.inboxKey },
            { Origin: "https://other.test" },
          ),
          "ip",
        )
      ).status,
    ).toBe(403);
    for (let i = 0; i < 5; i++)
      expect(
        (
          await h.handle(
            h.req("session", "POST", { access_key: "wrong" }),
            "ip",
          )
        ).status,
      ).toBe(401);
    expect(
      (await h.handle(h.req("session", "POST", { access_key: "wrong" }), "ip"))
        .status,
    ).toBe(429);
  });
});

describe("durable assessment capture and CRM identity", () => {
  it("acknowledges only after snapshot, verified CRM contact, receipt and association exist", async () => {
    const h = harness();
    h.ghl.afterUpsert = () => {
      expect(h.store.writes.some((k) => k.startsWith("submissions/"))).toBe(
        true,
      );
      expect(h.store.writes.some((k) => k.startsWith("receipts/"))).toBe(false);
    };
    const response = await h.assessment();
    expect(response.status).toBe(200);
    const ack = await response.json();
    expect(ack).toMatchObject({
      contact_saved: true,
      submission_id: "submission-test",
      booking_url:
        "https://api.leadconnectorhq.com/widget/booking/tFmtpPmm23VC7ygrKxvK",
    });
    expect(
      h.store.writes.some((k) => k.startsWith("contact-submissions/")),
    ).toBe(true);
    expect(h.ghl.reads).toBeGreaterThan(0);
  });
  it("rejects tampered scores, partial answers, future dates, unknown fields and a filled honeypot", async () => {
    for (const modify of [
      (s: ReturnType<typeof testSubmission>) => ({ ...s, score: 0 }),
      (s: ReturnType<typeof testSubmission>) => ({
        ...s,
        answers: s.answers.slice(1),
      }),
      (s: ReturnType<typeof testSubmission>) => ({
        ...s,
        submitted_at_utc: "2099-01-01T00:00:00Z",
      }),
      (s: ReturnType<typeof testSubmission>) => ({ ...s, api_key: "secret" }),
      (s: ReturnType<typeof testSubmission>) => ({
        ...s,
        website_confirm: "bot",
      }),
    ]) {
      const h = harness();
      expect((await h.assessment(modify(testSubmission()))).status).toBe(400);
      expect(h.ghl.upserts).toBe(0);
      expect(h.store.writes.some((k) => k.startsWith("submissions/"))).toBe(
        false,
      );
    }
  });
  it("rejects payloads above the endpoint limit before CRM access", async () => {
    const h = harness();
    expect(
      (await h.assessment({ ...testSubmission(), huge: "x".repeat(65000) }))
        .status,
    ).toBe(400);
    expect(h.ghl.upserts).toBe(0);
  });
  it("replays identical immutable submissions without another CRM upsert", async () => {
    const h = harness();
    expect((await h.assessment()).status).toBe(200);
    expect((await h.assessment()).status).toBe(200);
    expect(h.ghl.upserts).toBe(1);
    const changed = testSubmission();
    changed.contact.company = "Different company";
    expect((await h.assessment(changed)).status).toBe(409);
    expect(h.ghl.upserts).toBe(1);
  });
  it("keeps stored original answers and returns failure when CRM is down, then retries", async () => {
    const h = harness();
    h.ghl.fail = true;
    expect((await h.assessment()).status).toBe(503);
    expect(h.store.writes.some((k) => k.startsWith("submissions/"))).toBe(true);
    expect(h.store.writes.some((k) => k.startsWith("receipts/"))).toBe(false);
    h.ghl.fail = false;
    expect((await h.assessment()).status).toBe(200);
  });
  it("does not acknowledge a CRM success if receipt storage fails; retry verifies existing contact", async () => {
    const h = harness();
    h.store.failure = (key) => key.startsWith("receipts/");
    const res = await h.assessment();
    expect(res.status).toBe(503);
    expect(await res.text()).not.toContain("contact_saved");
    expect(h.ghl.upserts).toBe(1);
    h.store.failure = null;
    expect((await h.assessment()).status).toBe(200);
    expect(h.ghl.upserts).toBe(1);
  });
  it("does not call CRM if snapshot durability fails", async () => {
    const h = harness();
    h.store.failure = (key) => key.startsWith("submissions/");
    expect((await h.assessment()).status).toBe(503);
    expect(h.ghl.upserts).toBe(0);
  });
  it("never overwrites existing CRM data from an anonymous submission", async () => {
    const h = harness();
    h.ghl.contacts = [
      {
        ...h.ghl.defaultContact,
        companyName: "Existing manually maintained company",
      },
    ];
    const before = structuredClone(h.ghl.contacts);
    expect((await h.assessment()).status).toBe(200);
    expect(h.ghl.upserts).toBe(0);
    expect(h.ghl.contacts).toEqual(before);
  });
  it("rejects duplicate contacts, split email/phone matches and canonical identity mismatches", async () => {
    const duplicate = harness();
    duplicate.ghl.contacts = [
      duplicate.ghl.defaultContact,
      { ...duplicate.ghl.defaultContact, id: "second" },
    ];
    expect((await duplicate.assessment()).status).toBe(409);
    const split = harness();
    split.ghl.contacts = [
      split.ghl.defaultContact,
      {
        ...split.ghl.defaultContact,
        id: "second",
        email: "other@example.test",
        phone: "+15550102020",
      },
    ];
    const value = testSubmission();
    value.contact.phone = "+15550102020";
    expect((await split.assessment(value)).status).toBe(409);
    expect(split.ghl.upserts).toBe(0);
    const wrong = harness();
    wrong.ghl.defaultContact.locationId = "wrong-location";
    expect((await wrong.assessment()).status).toBe(409);
  });
  it("applies per-email anti-abuse limits without storing email in rate keys", async () => {
    const h = harness();
    for (let i = 0; i < 5; i++) expect((await h.assessment()).status).toBe(200);
    expect((await h.assessment()).status).toBe(429);
    expect([...h.store.rows.keys()].join(" ")).not.toContain("taylor@");
  });
});

describe("booking association and protected inbox", () => {
  it("rejects absent webhook auth, wrong scope and mismatched canonical contact", async () => {
    const h = harness();
    expect((await h.handle(h.req("booking", "POST", {}))).status).toBe(401);
    expect(
      (
        await h.booking({
          appointment_id: "appointment-test",
          contact_id: "contact-test",
          location_id: "wrong",
          calendar_id: TEST_CONFIG.calendarId,
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await h.booking({
          appointment_id: "appointment-test",
          contact_id: "wrong",
          location_id: TEST_CONFIG.locationId,
          calendar_id: TEST_CONFIG.calendarId,
        })
      ).status,
    ).toBe(409);
  });
  it("creates a missing-assessment draft with source CRM contact and useful questions", async () => {
    const h = harness();
    h.ghl.contacts = [h.ghl.defaultContact];
    const res = await h.booking();
    expect(await res.json()).toMatchObject({
      status: "created",
      assessment_matched: false,
    });
    const data = await (await h.inbox(await h.login())).json();
    expect(data.packets).toHaveLength(1);
    expect(data.packets[0].assessment).toBeUndefined();
    expect(data.packets[0].research.facts).toEqual([]);
    expect(data.packets[0].research.suggestedQuestions.join(" ")).toContain(
      "no matched assessment",
    );
    expect(data.public_research_available).toBe(false);
  });
  it("matches immutable seven-question assessment and preserves answers in inbox", async () => {
    const h = harness();
    await h.assessment();
    await h.booking();
    const data = await (await h.inbox(await h.login())).json();
    const packet = data.packets[0];
    expect(packet.assessment.scoreMax).toBe(21);
    expect(
      packet.assessment.answers.some(
        (a: { id: string }) => a.id === "friction_home",
      ),
    ).toBe(true);
    expect(packet.contact.business).toBe("Fictional Workshop");
    expect(packet.research.suggestedQuestions.join(" ")).toContain(
      "You selected",
    );
  });
  it("retains original six-question score as source answers without filling the 21-point score", async () => {
    const h = harness();
    const source = testSubmission();
    const legacy = buildAssessmentSubmission(
      source.contact,
      Object.fromEntries(ORIGINAL_ASSESSMENT_QUESTIONS.map((q) => [q.key, 3])),
      {
        submissionId: "legacy",
        submittedAt: source.submitted_at_utc,
        version: LEGACY_ASSESSMENT_VERSION,
      },
    );
    expect((await h.assessment(legacy)).status).toBe(200);
    await h.booking();
    const data = await (await h.inbox(await h.login())).json();
    expect(data.packets[0].assessment.score).toBeUndefined();
    expect(data.packets[0].mappedFields["client.score"]).toBeUndefined();
    expect(
      data.packets[0].assessment.answers.some(
        (a: { id: string; value: unknown }) => a.value === 18,
      ),
    ).toBe(true);
  });
  it("enriches an already booked draft when the assessment arrives later", async () => {
    const h = harness();
    h.ghl.contacts = [h.ghl.defaultContact];
    await h.booking();
    h.advance(1000);
    expect((await h.assessment()).status).toBe(200);
    const data = await (await h.inbox(await h.login())).json();
    expect(data.packets).toHaveLength(1);
    expect(data.packets[0].assessment).toBeDefined();
  });
  it("keeps replay stable and updates one draft on reschedule/cancellation", async () => {
    const h = harness();
    await h.assessment();
    await h.booking();
    const key = `bookings/${digest(h.ghl.event.id)}`;
    const before = await h.store.read(key);
    expect(await (await h.booking()).json()).toMatchObject({
      status: "duplicate",
    });
    expect(await h.store.read(key)).toEqual(before);
    h.advance(2000);
    h.ghl.event.dateUpdated = new Date(TEST_NOW + 1000).toISOString();
    h.ghl.event.startTime = "2026-09-11T16:00:00Z";
    h.ghl.event.endTime = "2026-09-11T16:30:00Z";
    expect(await (await h.booking()).json()).toMatchObject({
      status: "updated",
    });
    h.advance(2000);
    h.ghl.event.dateUpdated = new Date(TEST_NOW + 3000).toISOString();
    h.ghl.event.appointmentStatus = "cancelled";
    await h.booking();
    const data = await (await h.inbox(await h.login())).json();
    expect(data.packets).toHaveLength(1);
    expect(data.packets[0].bookingStatus).toBe("cancelled");
    expect(data.packets[0].assessment).toBeDefined();
  });
  it("ignores older canonical updates and rejects contact reassignment", async () => {
    const h = harness();
    await h.assessment();
    await h.booking();
    h.ghl.event.dateUpdated = "2026-09-01T15:00:00Z";
    expect(await (await h.booking()).json()).toMatchObject({ status: "stale" });
    h.ghl.contacts.push({ ...h.ghl.defaultContact, id: "different" });
    h.ghl.event.contactId = "different";
    expect((await h.booking()).status).toBe(409);
  });
  it("does not turn a zero-answer CRM contact into a completed assessment", async () => {
    const h = harness();
    h.ghl.contacts = [
      { ...h.ghl.defaultContact, email: null, companyName: null },
    ];
    await h.booking();
    const data = await (await h.inbox(await h.login())).json();
    expect(data.packets[0].assessment).toBeUndefined();
    expect(data.packets[0].mappedFields).toBeUndefined();
  });
  it("keeps the manual audit edit through a later incoming packet", async () => {
    const h = harness();
    h.ghl.contacts = [h.ghl.defaultContact];
    await h.booking();
    const cookie = await h.login();
    const packet = (await (await h.inbox(cookie)).json()).packets[0];
    const blank: Store = {
      version: 1,
      settings: defaultSettings(),
      sessions: [],
      lastSaved: null,
      lastExport: null,
    };
    let local = applyIntakePacket(blank, packet).store;
    local.sessions[0].client.business = "Consultant correction";
    local.sessions[0].callNotes = "Private call notes";
    h.advance(1000);
    const second = testSubmission("second-submission");
    second.contact.company = "Changed self-report";
    await h.assessment(second);
    const updated = (await (await h.inbox(cookie)).json()).packets[0];
    local = applyIntakePacket(local, updated).store;
    expect(local.sessions[0].client.business).toBe("Consultant correction");
    expect(local.sessions[0].callNotes).toBe("Private call notes");
    expect(
      local.sessions[0].intake?.conflicts.some(
        (c) => c.field === "client.business",
      ),
    ).toBe(true);
  });
  it("fails without success on booking write failure and recovers on replay", async () => {
    const h = harness();
    await h.assessment();
    h.store.failure = (key) => key.startsWith("bookings/");
    expect((await h.booking()).status).toBe(503);
    h.store.failure = null;
    expect((await h.booking()).status).toBe(200);
  });
  it("rejects forged cursors and never emits tokens or request PII in errors", async () => {
    const h = harness();
    const cookie = await h.login();
    const res = await h.inbox(cookie, "forged.token");
    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).not.toContain("taylor@");
    expect(text).not.toContain(TEST_CONFIG.sessionSecret);
  });
  it("freezes the booked assessment while retaining a later submitted snapshot separately", async () => {
    const h = harness();
    await h.assessment();
    await h.booking();
    h.advance(2000);
    const later = testSubmission("new-assessment");
    later.contact.company = "Later corrected self-report";
    await h.assessment(later);
    await h.booking();
    const packet = (await (await h.inbox(await h.login())).json()).packets[0];
    expect(packet.assessment.submissionId).toBe("submission-test");
    expect(packet.contact.business).toBe("Fictional Workshop");
    expect(
      await h.store.read(`submissions/${digest("new-assessment")}`),
    ).not.toBeNull();
  });
  it("serializes a booking racing assessment receipt creation; retry fills one packet", async () => {
    const h = harness();
    h.ghl.contacts = [h.ghl.defaultContact];
    const original = h.store.cas.bind(h.store);
    let release!: () => void;
    let entered!: () => void;
    const paused = new Promise<void>((resolve) => {
      entered = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let didPause = false;
    h.store.cas = async (key, value, etag) => {
      if (key.startsWith("contact-submissions/") && !didPause) {
        didPause = true;
        entered();
        await gate;
      }
      return original(key, value, etag);
    };
    const pending = h.assessment();
    await paused;
    expect((await h.booking()).status).toBe(409);
    release();
    expect((await pending).status).toBe(200);
    expect((await h.booking()).status).toBe(200);
    const result = await (await h.inbox(await h.login())).json();
    expect(result.packets).toHaveLength(1);
    expect(result.packets[0].assessment.submissionId).toBe("submission-test");
  });
  it("serializes an assessment racing booking index creation; retry enriches that draft", async () => {
    const h = harness();
    h.ghl.contacts = [h.ghl.defaultContact];
    const original = h.store.cas.bind(h.store);
    let release!: () => void;
    let entered!: () => void;
    const paused = new Promise<void>((resolve) => {
      entered = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let didPause = false;
    h.store.cas = async (key, value, etag) => {
      if (key.startsWith("contact-bookings/") && !didPause) {
        didPause = true;
        entered();
        await gate;
      }
      return original(key, value, etag);
    };
    const pending = h.booking();
    await paused;
    expect((await h.assessment()).status).toBe(409);
    release();
    expect((await pending).status).toBe(200);
    expect((await h.assessment()).status).toBe(200);
    const result = await (await h.inbox(await h.login())).json();
    expect(result.packets).toHaveLength(1);
    expect(result.packets[0].assessment.submissionId).toBe("submission-test");
  });
  it("paginates authenticated inbox without repeating or omitting any stored packet", async () => {
    const h = harness();
    h.ghl.contacts = [h.ghl.defaultContact];
    await h.booking();
    const first = (await h.store.read<{
      packet: unknown;
      event: unknown;
      receiptId: null;
    }>(`bookings/${digest(h.ghl.event.id)}`))!.value;
    for (let i = 0; i < 54; i++)
      await h.store.cas(
        `bookings/${digest(`extra-${i}`)}`,
        {
          ...first,
          packet: { ...(first.packet as object), appointmentId: `extra-${i}` },
        },
        null,
      );
    const cookie = await h.login();
    const one = await (await h.inbox(cookie)).json();
    expect(one.packets).toHaveLength(50);
    expect(one.next_cursor).toBeTruthy();
    const two = await (await h.inbox(cookie, one.next_cursor)).json();
    expect(two.packets).toHaveLength(5);
    expect(two.next_cursor).toBeUndefined();
    expect(
      new Set([...one.packets, ...two.packets].map((p) => p.appointmentId))
        .size,
    ).toBe(55);
  });
  it.each(["", "https://assessment.example.test"])(
    "uses nonblank assessment contact values with CRM fallback and preserves original answers (website %j)",
    async (assessmentWebsite) => {
      const h = harness();
      const crmContact = {
        ...h.ghl.defaultContact,
        phone: "+15550102020",
        website: "https://crm.example.test",
      };
      h.ghl.contacts = [structuredClone(crmContact)];
      const submission = testSubmission();
      submission.contact.phone = "";
      submission.contact.website = assessmentWebsite;
      expect((await h.assessment(submission)).status).toBe(200);
      const researchedWebsites: string[] = [];
      const handle = createBridge({
        config: TEST_CONFIG,
        store: h.store,
        ghl: h.ghl,
        now: () => TEST_NOW,
        research: async (website) => {
          researchedWebsites.push(website);
          return { facts: [] };
        },
      });
      expect(
        (
          await handle(
            h.req(
              "booking",
              "POST",
              {
                appointment_id: h.ghl.event.id,
                contact_id: h.ghl.event.contactId,
                location_id: TEST_CONFIG.locationId,
                calendar_id: TEST_CONFIG.calendarId,
              },
              { "X-McCann-Webhook-Secret": TEST_CONFIG.webhookSecret },
            ),
          )
        ).status,
      ).toBe(200);
      const packet = (await (await h.inbox(await h.login())).json()).packets[0];
      const expectedWebsite = assessmentWebsite || crmContact.website;
      expect(packet.contact).toMatchObject({
        phone: crmContact.phone,
        website: expectedWebsite,
        business: submission.contact.company,
      });
      expect(researchedWebsites).toEqual([expectedWebsite]);
      expect(packet.assessment.answers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: "context.phone", value: "" }),
          expect.objectContaining({
            id: "context.website",
            value: assessmentWebsite,
          }),
        ]),
      );
      expect(h.ghl.contacts).toEqual([crmContact]);
      expect(submission.contact.phone).toBe("");
      expect(submission.contact.website).toBe(assessmentWebsite);
    },
  );
  it("reuses stored public research on replay and reschedule, with no repeated fetch", async () => {
    const h = harness();
    await h.assessment();
    let calls = 0;
    const handle = createBridge({
      config: TEST_CONFIG,
      store: h.store,
      ghl: h.ghl,
      now: () => TEST_NOW,
      research: async () => {
        calls++;
        return {
          facts: [
            {
              text: "Website title reports: Example",
              sourceUrl: "https://example.test/",
              sourceTitle: "Example",
              accessedAt: new Date(TEST_NOW).toISOString(),
            },
          ],
        };
      },
    });
    const send = () =>
      handle(
        h.req(
          "booking",
          "POST",
          {
            appointment_id: h.ghl.event.id,
            contact_id: h.ghl.event.contactId,
            location_id: TEST_CONFIG.locationId,
            calendar_id: TEST_CONFIG.calendarId,
          },
          { "X-McCann-Webhook-Secret": TEST_CONFIG.webhookSecret },
        ),
      );
    expect((await send()).status).toBe(200);
    expect((await send()).status).toBe(200);
    h.ghl.event.dateUpdated = new Date(TEST_NOW).toISOString();
    h.ghl.event.startTime = "2026-09-11T16:00:00Z";
    h.ghl.event.endTime = "2026-09-11T16:30:00Z";
    expect((await send()).status).toBe(200);
    expect(calls).toBe(1);
    const result = (await (await h.inbox(await h.login())).json()).packets[0];
    expect(result.research.facts).toHaveLength(1);
  });
  it("persists optional research failure and still makes an audit with useful questions", async () => {
    const h = harness();
    await h.assessment();
    let calls = 0;
    const handle = createBridge({
      config: TEST_CONFIG,
      store: h.store,
      ghl: h.ghl,
      now: () => TEST_NOW,
      research: async () => {
        calls++;
        throw new Error("Private upstream detail");
      },
    });
    const request = () =>
      h.req(
        "booking",
        "POST",
        {
          appointment_id: h.ghl.event.id,
          contact_id: h.ghl.event.contactId,
          location_id: TEST_CONFIG.locationId,
          calendar_id: TEST_CONFIG.calendarId,
        },
        { "X-McCann-Webhook-Secret": TEST_CONFIG.webhookSecret },
      );
    expect((await handle(request())).status).toBe(200);
    expect((await handle(request())).status).toBe(200);
    expect(calls).toBe(1);
    const packet = (await (await h.inbox(await h.login())).json()).packets[0];
    expect(packet.research.facts).toEqual([]);
    expect(packet.research.suggestedQuestions.length).toBeGreaterThan(3);
  });
  it("uses the captured-at-booking assessment even if a later assessment precedes webhook delivery", async () => {
    const h = harness();
    await h.assessment();
    h.ghl.event.dateAdded = new Date(TEST_NOW + 1000).toISOString();
    h.ghl.event.dateUpdated = new Date(TEST_NOW + 1000).toISOString();
    h.advance(2000);
    await h.assessment(testSubmission("after-booking"));
    await h.booking();
    const packet = (await (await h.inbox(await h.login())).json()).packets[0];
    expect(packet.assessment.submissionId).toBe("submission-test");
  });
  it("isolates optional research-cache failure from core booking durability and does not retry the fetch", async () => {
    const h = harness();
    await h.assessment();
    h.store.failure = (key) => key.startsWith("research/");
    let calls = 0;
    const handle = createBridge({
      config: TEST_CONFIG,
      store: h.store,
      ghl: h.ghl,
      now: () => TEST_NOW,
      research: async () => {
        calls++;
        return { facts: [] };
      },
    });
    const request = () =>
      h.req(
        "booking",
        "POST",
        {
          appointment_id: h.ghl.event.id,
          contact_id: h.ghl.event.contactId,
          location_id: TEST_CONFIG.locationId,
          calendar_id: TEST_CONFIG.calendarId,
        },
        { "X-McCann-Webhook-Secret": TEST_CONFIG.webhookSecret },
      );
    expect((await handle(request())).status).toBe(200);
    expect((await handle(request())).status).toBe(200);
    expect(calls).toBe(1);
    const packet = (await (await h.inbox(await h.login())).json()).packets[0];
    expect(packet.assessment).toBeDefined();
    expect(packet.research.suggestedQuestions.join(" ")).toContain(
      "research is unavailable",
    );
  });
});
