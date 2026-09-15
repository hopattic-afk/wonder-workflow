import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

test("homepage kills animated workflow theater and keeps the assessment CTA", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator(".ww-launch-intro")).toHaveCount(0);
  await expect(page.locator(".ww-operating-scene")).toHaveCount(0);
  await expect(page.getByText("One request. A connected workflow.")).toHaveCount(
    0,
  );
  await expect(page.locator(".ww-hero h1")).toBeVisible();
  await page
    .locator(".ww-hero")
    .getByRole("link", { name: "Assess your operations" })
    .click();
  await expect(page).toHaveURL(/assessment$/);
});

test("type-led homepage remains readable on mobile and with reduced motion", async ({
  page,
}) => {
  await mkdir("output/wonder-workflow/qa", { recursive: true });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.locator(".ww-hero h1")).toBeVisible();
    await expect(page.locator("video")).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `output/wonder-workflow/qa/type-led-home-${width}.png`,
      fullPage: true,
    });
  }
});
