import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";
import { createBridge } from "../server/bridge";
import type { BridgeConfig } from "../server/config";
import type { DurableStore, Stored } from "../server/storage";
import type { GhlAppointment, GhlClient, GhlContact } from "../server/ghl";
import { QUESTIONS, ASSESSMENT_BOOKING_URL } from "../src/domain/assessment";
import {
  INTAKE_LOCATION_ID,
  INTAKE_CALENDAR_ID,
} from "../src/domain/intakeSchema";

async function fillAssessment(page: Page) {
  for (const question of QUESTIONS) {
    await expect(
      page.getByRole("heading", { name: question.label, exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel("First name", { exact: true })).toHaveCount(0);
    await page
      .getByRole("button", { name: question.options[3], exact: true })
      .click();
  }
  await page.getByLabel("First name", { exact: true }).fill("Taylor");
  await page.getByLabel("Last name", { exact: true }).fill("Example");
  await page.getByLabel("Email", { exact: true }).fill("taylor@example.test");
  await page
    .getByLabel("Business / company", { exact: true })
    .fill("Fictional Workshop");
  await page
    .getByLabel("Team size", { exact: true })
    .selectOption("6–20 people");
  await page
    .getByLabel("Industry", { exact: true })
    .selectOption("Construction / trades");
  await page
    .getByLabel("Your main operational priority", { exact: true })
    .selectOption("Reduce repetitive admin");
  await page.getByText("Add optional details", { exact: true }).click();
  await page
    .getByLabel("Current tools (optional, not scored)", { exact: true })
    .fill("Email, spreadsheets, and an existing AI drafting tool");
  await page
    .getByLabel("What is slowing you down? (optional)", { exact: true })
    .fill("Re-entering quote details each week");
}

test("unavailable submission service retains answers and never shows a false saved result", async ({page}) => {
  await page.route("**/api/integration-status",route=>route.fulfill({json:{acceptingSubmissions:false}}));
  await page.goto("/assessment/");
  await fillAssessment(page);
  await page.getByRole("button",{name:"Get My AI Operations Score"}).click();
  await expect(page.getByRole("alert")).toContainText("We can’t save your assessment right now");
  await expect(page.getByLabel("Email",{exact:true})).toHaveValue("taylor@example.test");
  await expect(page.locator(".assessment-calendar")).toHaveCount(0);
  await expect(page.getByText(/Preview only|Preview My Score|Direct Calendar Preview/)).toHaveCount(0);
});

test("question screens support keyboard choices, backtracking, and mobile layout", async ({
  page,
}) => {
  const writes: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST") writes.push(request.url());
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/assessment/?utm_source=facebook");
  await expect(page.getByLabel("First name", { exact: true })).toHaveCount(0);
  const firstHeading = page.getByRole("heading", {
    name: QUESTIONS[0].label,
    exact: true,
  });
  await expect(firstHeading).toBeFocused();
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: QUESTIONS[0].options[3], exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: QUESTIONS[1].label, exact: true }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(firstHeading).toBeFocused();
  await expect(
    page.getByRole("button", { name: QUESTIONS[0].options[3], exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: QUESTIONS[0].options[0], exact: true })
    .click();
  for (const question of QUESTIONS.slice(1)) {
    await page
      .getByRole("button", { name: question.options[3], exact: true })
      .click();
  }
  await page.getByLabel("First name", { exact: true }).fill("Preserved");
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page
    .getByRole("button", { name: QUESTIONS[6].options[3], exact: true })
    .click();
  await expect(page.getByLabel("First name", { exact: true })).toHaveValue(
    "Preserved",
  );
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(new URL(page.url()).searchParams.get("utm_source")).toBe("facebook");
  expect(writes).toEqual([]);
});

test("assessment → canonical booking → protected inbox → audit using fake CRM and storage", async ({
  page,
}) => {
  const config: BridgeConfig = {
    origin: "https://audit.example.test",
    inboxKey: "test-only-inbox-key-0123456789-abcdefgh",
    sessionSecret: "test-only-session-key-0123456789-abcdef",
    webhookSecret: "test-only-webhook-key-0123456789-abcdef",
    ghlToken: "test-only-no-real-token",
    locationId: INTAKE_LOCATION_ID,
    calendarId: INTAKE_CALENDAR_ID,
    timezone: "America/Edmonton",
  };
  const records = new Map<string, Stored>();
  let revision = 0;
  const store: DurableStore = {
    async read<T>(key: string) {
      return structuredClone((records.get(key) as Stored<T>) ?? null);
    },
    async cas(key, value, etag) {
      if ((records.get(key)?.etag ?? null) !== etag) return false;
      records.set(key, {
        value: structuredClone(value),
        etag: String(++revision),
      });
      return true;
    },
    async keys(prefix) {
      return [...records.keys()].filter((key) => key.startsWith(prefix)).sort();
    },
  };
  let contact: GhlContact | null = null;
  const now = Date.now();
  let event: GhlAppointment = {
    id: "fake-appointment",
    locationId: config.locationId,
    calendarId: config.calendarId,
    contactId: "fake-contact",
    startTime: new Date(now + 86400000).toISOString(),
    dateUpdated: new Date(now).toISOString(),
    appointmentStatus: "confirmed",
  };
  const ghl: GhlClient = {
    async find() {
      return contact ? [contact] : [];
    },
    async getContact() {
      if (!contact) throw new Error("Fake contact missing");
      return contact;
    },
    async upsertEmail(email) {
      contact = { id: "fake-contact", locationId: config.locationId, email };
      return contact.id;
    },
    async appointment() {
      return event;
    },
  };
  const handle = createBridge({ config, store, ghl });
  // The browser transport is local and mocked. The actual handler, validation,
  // mapping, and storage logic run; no real CRM, hosting, or login is configured.
  let cookie = "";
  let sessionCookieHeader = "";
  await page.route("**/api/**", async (route) => {
    const incoming = route.request();
    const url = new URL(incoming.url());
    const headers = new Headers(incoming.headers());
    headers.set("origin", config.origin);
    headers.set("sec-fetch-site", "same-origin");
    if (cookie) headers.set("cookie", cookie);
    const response = await handle(
      new Request(config.origin + url.pathname + url.search, {
        method: incoming.method(),
        headers,
        ...(incoming.postData() ? { body: incoming.postData()! } : {}),
      }),
      "test-browser",
    );
    const setCookie = response.headers.get("set-cookie");
    if (url.pathname === "/api/session" && incoming.method() === "POST")
      sessionCookieHeader = setCookie ?? "";
    if (setCookie) cookie = setCookie.split(";")[0];
    const responseHeaders = Object.fromEntries(response.headers);
    delete responseHeaders["set-cookie"];
    await route.fulfill({
      status: response.status,
      headers: responseHeaders,
      body: await response.text(),
    });
  });
  await page.route("https://api.leadconnectorhq.com/**", route => route.fulfill({contentType:"text/html",body:"<html lang='en'><title>Booking test fixture</title><body><h1>Choose a time</h1></body></html>"}));
  await page.goto("/assessment");
  await fillAssessment(page);
  await page
    .getByRole("button", { name: "Get My AI Operations Score", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "21 / 21", exact: true }),
  ).toBeVisible();
  await expect(page.locator("iframe.assessment-calendar")).toHaveAttribute("src",ASSESSMENT_BOOKING_URL);
  await expect(page.frameLocator("iframe.assessment-calendar").getByRole("heading",{name:"Choose a time"})).toBeVisible();
  await expect(page.getByRole("link",{name:/Calendar Preview|Book your/})).toHaveCount(0);
  await page.getByRole("button",{name:"Reload calendar"}).click();
  await expect(page.frameLocator("iframe.assessment-calendar").getByRole("heading",{name:"Choose a time"})).toBeVisible();
  await mkdir("output/wonder-workflow/qa",{recursive:true});
  for (const width of [1440,390]) {
    await page.setViewportSize({width,height:900});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:"output/wonder-workflow/qa/embedded-booking-"+width+".png",fullPage:true});
  }
  expect(contact!.email).toBe("taylor@example.test");
  const webhook = () =>
    handle(
      new Request(config.origin + "/api/booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-McCann-Webhook-Secret": config.webhookSecret,
        },
        body: JSON.stringify({
          appointment_id: event.id,
          contact_id: event.contactId,
          location_id: config.locationId,
          calendar_id: config.calendarId,
        }),
      }),
      "fake-ghl",
    );
  const booking = await webhook();
  expect(booking.status).toBe(200);
  await page.goto("/meetings");
  await page.getByLabel("Meeting inbox access key").fill(config.inboxKey);
  const rememberDevice = page.getByRole("checkbox", {
    name: "Remember this device for 30 days",
  });
  await expect(rememberDevice).not.toBeChecked();
  await rememberDevice.check();
  const loginAccessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(loginAccessibility.violations).toEqual([]);
  await page
    .getByRole("button", { name: "Connect meetings", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Open prepared audit", exact: true })
    .click();
  expect(sessionCookieHeader).toContain("Max-Age=2592000");
  const auditUrl = page.url();
  await expect(page.getByLabel("Business name", { exact: true })).toHaveValue(
    "Fictional Workshop",
  );
  await page.getByText(/Original assessment answers ·/).click();
  await expect(page.getByText(/21\/21/)).toBeVisible();
  await expect(
    page.getByText("Email, spreadsheets, and an existing AI drafting tool", {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByLabel("What would you like to improve?", { exact: true })
    .fill("My call notes stay here");
  await expect(page.getByText("Saved locally", { exact: true })).toBeVisible();
  event = {
    ...event,
    startTime: new Date(now + 2 * 86400000).toISOString(),
    dateUpdated: new Date(now + 1000).toISOString(),
  };
  expect((await webhook()).status).toBe(200);
  expect((await webhook()).status).toBe(200);
  await page.reload();
  await expect(
    page.getByLabel("What would you like to improve?", { exact: true }),
  ).toHaveValue("My call notes stay here");
  await expect(page).toHaveURL(auditUrl);
  await page
    .getByRole("link", { name: "Prepared meetings", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Open prepared audit", exact: true }),
  ).toHaveCount(1);
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
  const signedInCookie = cookie;
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.getByLabel("Meeting inbox access key")).toBeVisible();
  expect(
    (
      await handle(
        new Request(`${config.origin}/api/inbox`, {
          headers: { Cookie: signedInCookie },
        }),
        "test-browser",
      )
    ).status,
  ).toBe(401);
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain(
    config.inboxKey,
  );
});
