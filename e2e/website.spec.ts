import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { QUESTIONS } from "../src/domain/assessment";
import { mkdir } from "node:fs/promises";

test("public pages remain readable and accessible on desktop and mobile", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mkdir("output/wonder-workflow/qa", { recursive: true });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      "/",
      "/services",
      "/how-we-work",
      "/about",
      "/start",
      "/privacy",
      "/terms",
      "/contact",
      "/ai-operations",
      "/book",
    ]) {
      await page.goto(path);
      await expect(page.locator(".ww-site h1")).toBeVisible();
      await expect(page.locator(".ww-launch-intro")).toHaveCount(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .exclude("chat-widget")
        .analyze();
      expect(result.violations, `${path} at ${width}px`).toEqual([]);
      if (path === "/")
        await page.screenshot({
          path: `output/wonder-workflow/qa/home-${width}.png`,
          fullPage: true,
        });
    }
  }
});

test("mobile navigation and campaign context reach the assessment", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(
    "/about?utm_source=facebook&utm_campaign=launch&email=omit-me",
  );
  await page.getByRole("button", { name: "Menu +" }).click();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Assess your operations" })
    .click();
  await expect(page).toHaveURL(
    /\/assessment\?utm_source=facebook&utm_campaign=launch$/,
  );
  await expect(
    page.getByRole("heading", { name: QUESTIONS[0].label, exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/About 2 minutes/)).toBeVisible();
  await expect(page).toHaveTitle(
    "Operations Assessment | Wonder & Workflow",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://wonderworkflow.com/assessment",
  );
  await expect(
    page.getByRole("link", { name: "Privacy (opens in a new tab)" }),
  ).toHaveAttribute("target", "_blank");
  await expect(page.getByText(/No contact details required/i)).toHaveCount(0);
});

test("start, book, and contact send Fit Review traffic to the assessment", async ({
  page,
}) => {
  for (const path of ["/start", "/book"]) {
    await page.goto(path);
    await expect(
      page.getByRole("heading", { name: "Book an Operations Fit Review" }),
    ).toBeVisible();
    await expect(
      page.locator(".ww-start-simple").getByRole("link", {
        name: "Assess your operations",
      }),
    ).toHaveCount(2);
    await expect(
      page.locator(".ww-start-simple").getByRole("link", {
        name: "operations@wonderworkflow.com",
      }),
    ).toHaveAttribute("href", "mailto:operations@wonderworkflow.com");
  }
  await page.goto("/contact");
  await expect(
    page.getByRole("heading", { name: "Assess your operations" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Request an Operations Fit Review" }),
  ).toHaveAttribute("href", /\/assessment$/);
  await page.getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Assess your operations" })
    .click();
  await expect(page).toHaveURL(/\/assessment$/);
});

test("intro plays automatically, skips, and repeats on a fresh page load", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const video = page.locator(".ww-launch-intro video");
  await expect(video).toBeVisible();
  await expect
    .poll(() =>
      video.evaluate((v: HTMLVideoElement) => !v.paused && v.currentTime > 0),
    )
    .toBe(true);
  await page.getByRole("button", { name: "Skip intro" }).click();
  await expect(page.locator(".ww-launch-intro")).toHaveCount(0);
  await expect(
    page.locator(".ww-hero").getByRole("link", { name: "Assess your operations" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator(".ww-launch-intro video")).toBeVisible();
  await page.getByRole("button", { name: "Skip intro" }).click();
  await expect(page.locator(".ww-launch-intro")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Play logo film" }),
  ).toHaveCount(0);
});

test("intro finishes naturally and reduced motion or failed video never blocks content", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator(".ww-launch-intro video")).toBeVisible();
  await expect(page.locator(".ww-launch-intro")).toHaveCount(0, { timeout: 12000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/services");
  await page.goto("/");
  await expect(page.locator("video")).toHaveCount(0);
  await expect(page.locator(".ww-hero h1")).toBeVisible();
});

test("failed intro reveals the website", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.route("**/brand/launch.mp4", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator(".ww-launch-intro")).toHaveCount(0, { timeout: 12000 });
  await expect(page.locator(".ww-hero h1")).toBeVisible();
});

test("Escape dismisses the intro", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator(".ww-launch-intro video")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".ww-launch-intro")).toHaveCount(0);
  await expect(page.locator(".ww-hero h1")).toBeVisible();
});
