import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";
import fixture from "../docs/examples/prepared-meeting.example.json" with { type: "json" };

test("prepared meeting import preserves edits, handles retries and displays original answers", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/settings");
  await expect(
    page.getByRole("heading", { name: "Meeting file import", exact: true }),
  ).toBeVisible();
  const packet = {
    ...fixture,
    assessment: { ...fixture.assessment, score: 21, scoreMax: 21 },
  };
  async function load(value: unknown) {
    await page
      .getByText("Test a prepared meeting file", { exact: true })
      .click();
    await page
      .getByLabel("Prepared meeting file", { exact: false })
      .setInputFiles({
        name: "meeting.json",
        mimeType: "application/json",
        buffer: Buffer.from(JSON.stringify(value)),
      });
  }
  await load(packet);
  await expect(
    page.getByRole("heading", { name: "Review meeting information" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add or update audit" }).click();
  await page.getByRole("link", { name: "Open prepared audit" }).click();
  const auditUrl = page.url();
  await expect(page.getByLabel("Business name", { exact: true })).toHaveValue(
    packet.contact.business,
  );
  await expect(
    page.getByLabel("What would you like to improve?", { exact: true }),
  ).toHaveValue(packet.mappedFields["worksheet.reason"]);
  await page
    .getByText("Original assessment answers · 2", { exact: true })
    .click();
  await expect(
    page.getByText("Example question: what tools are involved?", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText(/21\/21/)).toBeVisible();
  await page
    .getByText("Business background · 1 sourced notes", { exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Example source — test only" }),
  ).toHaveAttribute("href", "https://example.com");
  await expect(
    page.getByRole("heading", { name: "Questions to focus on" }),
  ).toBeVisible();
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(axe.violations).toEqual([]);
  await mkdir("output/playwright", { recursive: true });
  await page.screenshot({
    path: "output/playwright/meeting-prep-1440.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "output/playwright/meeting-prep-390.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page
    .getByLabel("What would you like to improve?", { exact: true })
    .fill("My notes from the call");
  await expect(page.getByText("Saved locally", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Settings & backup" }).click();
  await load(packet);
  await page.getByRole("button", { name: "Add or update audit" }).click();
  await expect(
    page.getByText("This meeting information is already in your workspace.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Open prepared audit" }).click();
  await expect(page).toHaveURL(auditUrl);
  await expect(
    page.getByLabel("What would you like to improve?", { exact: true }),
  ).toHaveValue("My notes from the call");
  await page.getByRole("link", { name: "Settings & backup" }).click();
  const newer = {
    ...packet,
    updatedAt: "2026-09-06T17:00:00Z",
    mappedFields: { "worksheet.reason": "New assessment information" },
  };
  await load(newer);
  await page.getByRole("button", { name: "Add or update audit" }).click();
  await page.getByRole("link", { name: "Open prepared audit" }).click();
  await expect(
    page.getByText("New information to review · 1", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel("What would you like to improve?", { exact: true }),
  ).toHaveValue("My notes from the call");
  await page.reload();
  await expect(
    page.getByText("New information to review · 1", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Settings & backup" }).click();
  await load({ ...packet, locationId: "another-location" });
  await expect(page.getByRole("alert")).toContainText("Meeting file rejected");
  await expect(
    page.getByRole("button", { name: "Add or update audit" }),
  ).toHaveCount(0);
  expect(errors).toEqual([]);
});
