import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { QUESTIONS } from "../src/domain/assessment";

const FIT_REVIEW_MAILTO =
  "mailto:operations@wonderworkflow.com?subject=Workflow%20Fit%20Review%20request&body=Hi%20Ian%2C%0A%0AI%20completed%20the%20operations%20assessment.%0AScore%3A%20%0ATier%3A%20%0AOne%20workflow%20to%20discuss%3A%20%0A%0AThanks.";

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
}

test("browser-local assessment scores in-tab and sends visitors to contact, never POST /api/assessment", async ({
  page,
}) => {
  const posts: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST") posts.push(request.url());
  });
  await page.goto("/assessment/");
  await expect(page.locator("input, textarea, select, form, iframe")).toHaveCount(
    0,
  );
  await fillAssessment(page);
  await expect(page.getByRole("heading", { name: "21 / 21", exact: true })).toBeVisible();
  await expect(page.getByText("High-Impact Opportunity")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Discuss your result" }),
  ).toHaveAttribute("href", "/contact");
  await expect(
    page.getByRole("link", { name: "Email operations@wonderworkflow.com" }),
  ).toHaveAttribute("href", "mailto:operations@wonderworkflow.com");
  await expect(page.locator("input, textarea, select, form, iframe")).toHaveCount(
    0,
  );
  expect(posts.filter((url) => url.includes("/api/assessment"))).toEqual([]);
  await page.getByRole("link", { name: "Discuss your result" }).click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(
    page.getByRole("heading", { name: "Request a Workflow Fit Review" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Email operations@wonderworkflow.com" }),
  ).toHaveAttribute("href", FIT_REVIEW_MAILTO);
  await expect(page.locator("form")).toHaveCount(0);
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
  await expect(page.getByRole("heading", { name: "18 / 21", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Review answers", exact: true }).click();
  await expect(
    page.getByRole("button", { name: QUESTIONS[0].options[0], exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(new URL(page.url()).searchParams.get("utm_source")).toBe("facebook");
  expect(writes).toEqual([]);
});

test("start, book, and contact use the email Fit Review path; footer mailto stays plain", async ({
  page,
}) => {
  for (const path of ["/start", "/book"]) {
    await page.goto(path);
    await expect(
      page.getByRole("heading", { name: "Request a Workflow Fit Review" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Email to request Fit Review/ }),
    ).toHaveAttribute("href", FIT_REVIEW_MAILTO);
    await expect(page.getByText(/assessment is saved|embedded calendar/i)).toHaveCount(
      0,
    );
    await expect(
      page.locator(".ww-start-simple").getByRole("link", { name: "Contact" }),
    ).toHaveAttribute("href", /\/contact/);
  }
  await page.goto("/contact");
  await expect(
    page.getByRole("heading", { name: "Request a Workflow Fit Review" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Email operations@wonderworkflow.com" }),
  ).toHaveAttribute("href", FIT_REVIEW_MAILTO);
  await expect(
    page.locator('footer a[href="mailto:operations@wonderworkflow.com"]'),
  ).toHaveText("operations@wonderworkflow.com");
});
