import { test, expect, type Page } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
const output = "output/playwright";
const saved = async (page: Page) =>
  expect(page.getByText("Saved locally", { exact: true })).toBeVisible();
async function section(page: Page, name: string) {
  await page
    .getByRole("navigation", { name: "Worksheet sections" })
    .getByRole("button", { name, exact: false })
    .click();
}
test("complete local audit, calculations, documents, backup, refresh, and deletion", async ({
  page,
}) => {
  const errors: string[] = [];
  const outside: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("request", (r) => {
    if (
      !r.url().startsWith("http://127.0.0.1:4173") &&
      !r.url().startsWith("data:") &&
      !r.url().startsWith("blob:")
    )
      outside.push(r.url());
  });
  page.on("dialog", (dialog) => dialog.accept());
  await mkdir(output, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/workspace");
  await expect(
    page.getByRole("heading", { name: "Client audits." }),
  ).toBeVisible();
  await page.screenshot({ path: `${output}/dashboard-1440.png` });
  await page.getByRole("button", { name: "New audit", exact: true }).click();
  await page
    .getByLabel("Business name", { exact: true })
    .fill("Cedar Test Operations");
  await page
    .getByLabel("Contact name", { exact: true })
    .fill("Jordan Fictional");
  await page.getByText("Client details & background", { exact: true }).click();
  await page.getByLabel("Contact title", { exact: true }).fill("Owner");
  await page.getByLabel("Email", { exact: true }).fill("jordan@example.test");
  await page
    .getByLabel("Industry", { exact: true })
    .fill("Fictional field services");
  await expect(page.getByLabel("Currency", { exact: true })).toHaveValue("USD");
  await page.getByRole("button", { name: "Show timer" }).click();
  await page.getByRole("button", { name: "Start call timer" }).click();
  await expect(
    page.getByRole("button", { name: "Pause call timer" }),
  ).toBeVisible();
  await section(page, "Client & goal");
  await page
    .getByLabel("What would you like to improve?")
    .fill("Reclaim administrative hours spent preparing service reports.");
  await page
    .getByLabel("What repetitive task causes the most frustration?")
    .fill("The coordinator copies field notes into reports every week.");
  await section(page, "Walk through the work");
  await page
    .getByLabel("What task are we looking at?", { exact: true })
    .fill("Service report preparation");
  await page
    .getByLabel("What starts the work?")
    .fill("Completed field notes arrive.");
  await page
    .getByLabel("What should be ready at the end?")
    .fill("An approved report in the existing records system.");
  await section(page, "Walk through the work");
  await page.getByRole("button", { name: "Add workflow step" }).click();
  await page.getByLabel("Step name", { exact: true }).fill("Receive notes");
  await page.getByRole("button", { name: "Add workflow step" }).click();
  await page
    .getByLabel("Step name", { exact: true })
    .nth(1)
    .fill("Draft report");
  await page.getByRole("button", { name: "Duplicate step 2" }).click();
  await page
    .getByLabel("Step name", { exact: true })
    .nth(2)
    .fill("Human approval");
  await page.getByRole("button", { name: "Move step 3 up" }).click();
  await expect(
    page.getByLabel("Step name", { exact: true }).nth(1),
  ).toHaveValue("Human approval");
  await page.getByRole("button", { name: "Move step 2 down" }).click();
  await section(page, "Time & tools");
  await page
    .getByLabel("What could we measure before and after?", { exact: true })
    .fill("Preparation hours recorded weekly for this workflow.");
  await section(page, "AI possibilities & review");
  await page.getByLabel("Draft routine reports", { exact: true }).check();
  await page.getByLabel("Who will check the AI's work?").fill("Office manager");
  await page
    .getByLabel("What needs checking before the result is used?")
    .fill("Each report before release.");
  await page
    .getByLabel("Is the business allowed to use this information?")
    .selectOption("Yes");
  await page
    .getByText("Additional review & safety details", { exact: true })
    .click();
  await page
    .getByLabel("Is there someone to handle exceptions?")
    .selectOption("Yes");
  await section(page, "Wrap-up");
  await page
    .getByLabel("What should we do next?", { exact: true })
    .selectOption("Proceed with AI pilot");
  await page
    .getByText("After the call: internal assessment", { exact: true })
    .click();
  await page
    .getByLabel("Internal Recommendation Rationale", { exact: true })
    .fill("PRIVATE INTERNAL RATIONALE MUST NOT PRINT");
  await page.getByRole("button", { name: "Call notes" }).click();
  await page
    .getByLabel("Notes for this conversation · internal only")
    .fill("PRIVATE CALL NOTES MUST NOT PRINT");
  await page.getByRole("button", { name: "Call notes" }).click();
  await page
    .getByRole("navigation", { name: "Audit steps" })
    .getByRole("link", { name: "Calculator" })
    .click();
  await page.getByRole("button", { name: "Add labor role" }).click();
  await page.getByLabel("Role", { exact: true }).fill("Coordinator");
  await page.getByLabel("Current hours per week", { exact: true }).fill("10");
  await page
    .getByLabel("Fully loaded hourly labor cost", { exact: true })
    .fill("30");
  await page.getByLabel("Estimated work reduced (%)").fill("50");
  await page.getByRole("button", { name: "Add labor role" }).click();
  await page
    .getByLabel("Role", { exact: true })
    .nth(1)
    .fill("Review role excluded from reduction");
  await page
    .getByLabel("Current hours per week", { exact: true })
    .nth(1)
    .fill("0");
  await page
    .getByLabel("Fully loaded hourly labor cost", { exact: true })
    .nth(1)
    .fill("40");
  await page.getByLabel("Estimated work reduced (%)").nth(1).fill("0");
  await page.getByRole("button", { name: "Add software", exact: true }).click();
  await page
    .getByLabel("Software name", { exact: true })
    .fill("Existing reports tool");
  await page.getByLabel("Current monthly cost", { exact: true }).fill("300");
  await page
    .getByLabel("Expected future monthly cost", { exact: true })
    .fill("100");
  await page
    .getByLabel("API, integration, or export method?")
    .selectOption("Export available");
  await page.getByRole("button", { name: "Add rework item" }).click();
  await page.getByLabel("Error or rework type").fill("Report correction");
  await page.getByLabel("Incidents per month").fill("4");
  await page.getByLabel("Average cost per incident").fill("100");
  await page.getByLabel("Expected reduction (%)", { exact: true }).fill("50");
  await page.getByRole("button", { name: "Add recurring cost" }).click();
  await page
    .getByLabel("Cost name", { exact: true })
    .fill("Automation software");
  await page.getByLabel("Monthly cost", { exact: true }).fill("100");
  await page.getByLabel("Additional annual cost", { exact: true }).fill("0");
  await expect(page.getByTestId("net-savings")).toContainText("11,100.00");
  await expect(page.getByLabel("Proposed implementation price")).toHaveValue(
    "",
  );
  await saved(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${output}/calculator-1440.png` });
  await page
    .getByRole("navigation", { name: "Audit steps" })
    .getByRole("link", { name: "Recommendation" })
    .click();
  await page
    .getByRole("button", { name: "Generate recommendation", exact: true })
    .click();
  await expect(
    page.getByLabel("Include estimated investment", { exact: true }),
  ).not.toBeChecked();
  const recPreview = page.getByLabel("recommendation print preview");
  await expect(recPreview).toContainText("11,100.00");
  await expect(recPreview).not.toContainText("PRIVATE INTERNAL");
  await expect(recPreview).not.toContainText("PRIVATE CALL");
  await page
    .getByLabel("Business Objective", { exact: true })
    .fill("Reclaim repetitive administrative hours in the report workflow.");
  await page.evaluate(() => {
    (window as unknown as { printCount: number }).printCount = 0;
    window.print = () => {
      (window as unknown as { printCount: number }).printCount++;
    };
  });
  await expect(
    page.getByRole("button", { name: "Print / Save as PDF" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Print / Save as PDF" }).click();
  expect(
    await page.evaluate(
      () => (window as unknown as { printCount: number }).printCount,
    ),
  ).toBe(1);
  await page.emulateMedia({ media: "print" });
  const recPdf = await page.pdf({
    path: `${output}/recommendation.pdf`,
    format: "Letter",
    preferCSSPageSize: true,
    printBackground: true,
  });
  expect(
    (recPdf.toString("latin1").match(/\/Type\s*\/Page\b/g) || []).length,
  ).toBe(1);
  await page.screenshot({
    path: `${output}/recommendation-print.png`,
    fullPage: true,
  });
  await page.emulateMedia({ media: "screen" });
  await page
    .getByRole("navigation", { name: "Audit steps" })
    .getByRole("link", { name: "Proposal", exact: false })
    .click();
  await page
    .getByRole("button", { name: "Generate proposal", exact: true })
    .click();
  await page
    .getByLabel("Standard implementation price", { exact: true })
    .fill("3000");
  await page
    .getByLabel("Payment preset")
    .selectOption("50% deposit / 50% at completion");
  await page.getByLabel("Proposal expiration date").fill("2026-10-01");
  await page
    .getByLabel("Target metric", { exact: true })
    .fill(
      "Validate a reduction in preparation hours against the agreed baseline.",
    );
  await page.getByLabel("Include deliverable 1", { exact: true }).check();
  await page.getByLabel("Business-day estimate 1", { exact: true }).fill("2");
  await expect(page.getByLabel("proposal print preview")).toContainText(
    "3,000.00",
  );
  // Unsigned proposals intentionally stay neutral; saved historical identity is tested separately.
  await expect(page.getByLabel("proposal print preview")).not.toContainText(
    "McCann Contracting LLC",
  );
  await expect(page.getByLabel("Case-study permission")).toHaveValue("");
  await page.getByRole("button", { name: "Print / Save as PDF" }).click();
  await page.emulateMedia({ media: "print" });
  const proposalPdf = await page.pdf({
    path: `${output}/proposal.pdf`,
    format: "Letter",
    preferCSSPageSize: true,
    printBackground: true,
  });
  const pages = (
    proposalPdf.toString("latin1").match(/\/Type\s*\/Page\b/g) || []
  ).length;
  expect(pages).toBeGreaterThanOrEqual(3);
  expect(pages).toBeLessThanOrEqual(5);
  await page.emulateMedia({ media: "screen" });
  await page
    .getByRole("button", { name: "Mark proposal as sent", exact: true })
    .click();
  await expect(page.getByLabel("Audit status")).toHaveValue("Proposal Sent");
  await saved(page);
  await page.reload();
  await expect(
    page.getByLabel("Standard implementation price", { exact: true }),
  ).toHaveValue("3000");
  await expect(page.getByLabel("Audit status")).toHaveValue("Proposal Sent");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export this audit" }).click();
  const download = await downloadPromise;
  const path = await download.path();
  const json = JSON.parse(await readFile(path!, "utf8"));
  expect(json.version).toBe(1);
  expect(json.sessions).toHaveLength(1);
  expect(json.sessions[0].client.business).toBe("Cedar Test Operations");
  expect(json.sessions[0].calculator.labor).toHaveLength(2);
  expect(json.sessions[0].steps).toHaveLength(3);
  await page.getByRole("link", { name: "Back to client dashboard" }).click();
  const row = page
    .locator(".audit-row")
    .filter({ hasText: "Cedar Test Operations" });
  await row.getByLabel("More actions for Cedar Test Operations").click();
  await row.getByRole("button", { name: "Delete audit" }).click();
  await expect(
    page.getByRole("link", { name: "Cedar Test Operations", exact: false }),
  ).toHaveCount(0);
  await page.waitForTimeout(550);
  await page.reload();
  await expect(
    page.getByRole("link", { name: "Cedar Test Operations", exact: false }),
  ).toHaveCount(0);
  expect(errors).toEqual([]);
  expect(outside).toEqual([]);
});

test("responsive routes have no horizontal overflow and remain usable", async ({
  page,
}) => {
  page.on("dialog", (d) => d.accept());
  await page.goto("/workspace");
  await mkdir(output, { recursive: true });
  for (const [width, height] of [
    [1440, 900],
    [1280, 800],
    [834, 1112],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    for (const route of [
      "dashboard",
      "worksheet",
      "calculator",
      "recommendation",
      "proposal",
      "settings",
    ]) {
      if (route === "dashboard") await page.goto("/workspace");
      else if (route === "settings")
        await page.getByRole("link", { name: "Settings & backup" }).click();
      else {
        if (route === "worksheet")
          await page.locator(".business-name").first().click();
        else
          await page
            .getByRole("navigation", { name: "Audit steps" })
            .getByRole("link", {
              name: route[0].toUpperCase() + route.slice(1),
              exact: false,
            })
            .click();
      }
      if (route === "recommendation" || route === "proposal") {
        const generate = page.getByRole("button", {
          name: `Generate ${route}`,
          exact: true,
        });
        if (await generate.isVisible()) await generate.click();
      }
      await page.waitForTimeout(100);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        `${route} at ${width}`,
      ).toBe(true);
      if (route === "dashboard" || (width === 390 && route === "worksheet"))
        await page.screenshot({ path: `${output}/${route}-${width}.png` });
    }
  }
});

test("validated import, invalid rejection, archive, duplicate, delete all, and query prefill", async ({
  page,
}) => {
  page.on("dialog", (d) => d.accept());
  await page.goto(
    "/workspace?business=Prefilled%20Business&contact=Sample&email=sample%40example.test&score=21&tier=High-Impact%20Opportunity&priority=Reports",
  );
  await page.getByRole("button", { name: "New audit", exact: true }).click();
  await expect(page.getByLabel("Business name", { exact: true })).toHaveValue(
    "Prefilled Business",
  );
  await page
    .getByText("Assessment score & referral details", { exact: true })
    .click();
  await expect(page.getByLabel("AI Operations Score (0–21)")).toHaveValue("21");
  await page.getByLabel("AI Operations Score (0–21)").fill("22");
  await expect(
    page.getByRole("alert").filter({ hasText: "Enter a number from 0 to 21." }),
  ).toBeVisible();
  await page.getByLabel("AI Operations Score (0–21)").fill("21");
  await page.getByText("Client details & background", { exact: true }).click();
  await page.getByLabel("Currency", { exact: true }).selectOption("CAD");
  await saved(page);
  await page.getByRole("link", { name: "Back to client dashboard" }).click();
  let row = page
    .locator(".audit-row")
    .filter({ hasText: "Prefilled Business" });
  await row.getByLabel("More actions for Prefilled Business").click();
  await row.getByRole("button", { name: "Duplicate audit" }).click();
  await expect(page.getByLabel("Business name", { exact: true })).toHaveValue(
    "Prefilled Business (copy)",
  );
  await page.getByRole("link", { name: "Back to client dashboard" }).click();
  row = page
    .locator(".audit-row")
    .filter({ hasText: "Prefilled Business (copy)" });
  await row.getByLabel("More actions for Prefilled Business (copy)").click();
  await row.getByRole("button", { name: "Archive audit" }).click();
  await expect(row).toHaveCount(0);
  await page.getByLabel("Show archived").check();
  await expect(row).toHaveCount(1);
  await page.getByRole("link", { name: "Settings & backup" }).click();
  const dlPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export all data", exact: true })
    .click();
  const dl = await dlPromise;
  const payload = await readFile((await dl.path())!);
  await page.getByLabel("Import all data", { exact: true }).setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":999}'),
  });
  await expect(page.getByRole("alert")).toContainText("Import rejected");
  await page
    .getByRole("button", { name: "Delete all local data", exact: true })
    .click();
  await page.getByLabel("Type DELETE to confirm").fill("DELETE");
  await page
    .getByRole("button", { name: "Permanently delete", exact: true })
    .click();
  await page.getByLabel("Import all data", { exact: true }).setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: payload,
  });
  await expect(
    page.getByText("Validated backup", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Replace workspace" }).click();
  await page.getByRole("link", { name: "Dashboard", exact: true }).click();
  await expect(
    page.locator(".business-name").filter({ hasText: "Prefilled Business" }),
  ).toHaveCount(1);
  await page
    .getByRole("link", { name: "Prefilled Business", exact: false })
    .first()
    .click();
  await page.getByText("Client details & background", { exact: true }).click();
  await expect(page.getByLabel("Currency", { exact: true })).toHaveValue("CAD");
});

test("accessibility checks on every primary view", async ({ page }) => {
  await page.goto("/workspace");
  const check = async (name: string) => {
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        description: v.description,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
      name,
    ).toEqual([]);
  };
  await check("dashboard");
  await page.locator(".business-name").first().click();
  await check("worksheet");
  for (const name of [
    "Walk through the work",
    "Time & tools",
    "AI possibilities & review",
    "Wrap-up",
  ]) {
    await page
      .getByRole("navigation", { name: "Worksheet sections" })
      .getByRole("button", { name: new RegExp(name) })
      .click();
    await check(name);
  }
  for (const name of ["Calculator", "Recommendation", "Proposal"]) {
    await page
      .getByRole("navigation", { name: "Audit steps" })
      .getByRole("link", { name })
      .click();
    await check(name);
  }
  await page.getByRole("link", { name: "Settings & backup" }).click();
  await check("settings");
});
