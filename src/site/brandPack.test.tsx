import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { LegacyAssessment } from "../pages/Assessment";
import { ASSESSMENT_BOOKING_URL } from "../domain/assessment";
import Website, { pages } from "./Website";
import {
  ABOUT_OPS_INSERT,
  BRAND_ACCENT,
  FIT_REVIEW_NAME,
  HOME_DECK,
  HOME_DESCRIPTION,
  HOME_H1,
  HOME_INVITATION_TITLE,
  HOME_PAIN_CARDS,
  HOME_PROOF_CARDS,
  HOME_PROOF_EYEBROW,
  HOME_PROOF_TITLE,
  HOME_TITLE,
  LOGO_AVATAR,
  LOGO_OG,
  LOGO_STACKED_INK,
  LOGO_STACKED_PAPER,
  WHO_FOR_BODY,
  WHO_FOR_EXCLUDE,
} from "./publicOffer";

const root = process.cwd();
function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}
function renderPath(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Website />
    </MemoryRouter>,
  );
}

const PUBLIC_COPY_FILES = [
  "src/site/Website.tsx",
  "src/site/SearchContent.tsx",
  "src/pages/Assessment.tsx",
  "src/site/publicOffer.ts",
  "scripts/prerender-entry.tsx",
  "public/llms.txt",
  "public/.well-known/llms.txt",
  "public/404.html",
  "index.html",
];

describe("Ian-approved brand pack", () => {
  it("ships paper, ink, accent, muted, and line tokens and retires violet wash", () => {
    const css = read("src/site/website.css");
    expect(css).toMatch(/--ww-paper:\s*#fafaf8/i);
    expect(css).toMatch(/--ww-ink:\s*#20232b/i);
    expect(css).toMatch(/--ww-accent:\s*#7ba1af/i);
    expect(css).toMatch(/--ww-accent-text:\s*#3e6673/i);
    expect(css).toMatch(/--ww-muted:\s*#535760/i);
    expect(css).toMatch(/--ww-line:\s*#d5d6dc/i);
    expect(css).not.toMatch(/--ww-violet:\s*#56438a/i);
    expect(css).not.toContain("#56438a");
    expect(css).not.toContain("#eeeaf6");
    expect(read("src/pages/assessment.css")).not.toContain("#56438a");
    expect(read("index.html")).toContain(BRAND_ACCENT.toLowerCase() === BRAND_ACCENT ? "#7BA1AF" : BRAND_ACCENT);
  });

  it("uses stacked wordmark plus steps-left, and avatar-steps for the small mark", () => {
    for (const file of [
      "public/brand/primary-stacked-paper.svg",
      "public/brand/primary-stacked-paper.png",
      "public/brand/primary-stacked-ink.svg",
      "public/brand/primary-stacked-ink.png",
      "public/brand/avatar-steps.svg",
      "public/brand/avatar-steps.png",
      "public/brand/secondary-horizontal-paper.svg",
      "public/brand/og-stacked-paper.png",
    ]) {
      expect(existsSync(join(root, file)), file).toBe(true);
    }
    const paper = read("public/brand/primary-stacked-paper.svg");
    const ink = read("public/brand/primary-stacked-ink.svg");
    const avatar = read("public/brand/avatar-steps.svg");
    expect(paper).toContain("#7BA1AF");
    expect(paper).toContain("Wonder");
    expect(paper).toContain("Workflow");
    expect(ink).toContain("#20232B");
    expect(avatar).toContain("#7BA1AF");
    expect(avatar).not.toMatch(/<text[^>]*>Wonder/i);

    renderPath("/");
    const headerLogo = document.querySelector(".ww-wordmark img, .ww-wordmark svg");
    expect(headerLogo).toBeTruthy();
    const headerSrc = headerLogo?.getAttribute("src") ?? "";
    const headerMarkup = document.querySelector(".ww-header")?.innerHTML ?? "";
    expect(
      headerSrc.includes("primary-stacked-paper") ||
        headerMarkup.includes("ww-brand-lockup"),
    ).toBe(true);
    expect(headerMarkup).not.toContain("/brand/emblem.png");

    renderPath("/about");
    const about = document.querySelector(".ww-about-statement")?.innerHTML ?? "";
    expect(
      about.includes("primary-stacked-ink") || about.includes('data-variant="ink"'),
    ).toBe(true);

    const html = read("index.html");
    expect(html).toContain(LOGO_AVATAR);
    expect(html).toContain(LOGO_OG);
    expect(html).not.toContain("/brand/emblem.png");
    expect(html).not.toContain("/brand/logo-on-black.png");
  });

  it("kills homepage product theater and the old 3D emblem as master brand", () => {
    const source = read("src/site/Website.tsx");
    expect(source).not.toContain("One request. A connected workflow.");
    expect(source).not.toContain("WorkflowEntrance");
    expect(source).not.toContain("LaunchFilm");
    expect(source).not.toContain("ww-workflow-hero");
    expect(source).not.toContain("/brand/launch.mp4");
    expect(source).not.toContain("/brand/emblem.png");
    renderPath("/");
    expect(document.querySelector(".ww-launch-intro")).toBeNull();
    expect(document.querySelector(".ww-operating-scene")).toBeNull();
    expect(document.body.textContent).not.toMatch(/Illustrative workflow/i);
    expect(document.body.textContent).not.toMatch(/connected tools, useful AI/i);
  });
});

describe("Homepage verbal rewrite", () => {
  it("locks meta, H1, eyebrow, deck, tool-agnostic line, and assessment CTAs", () => {
    expect(pages["/"][0]).toBe(HOME_TITLE);
    expect(pages["/"][1]).toBe(HOME_DESCRIPTION);
    renderPath("/");
    expect(document.title).toBe(`${HOME_TITLE} | Wonder & Workflow`);
    expect(
      screen.getByRole("heading", { level: 1, name: HOME_H1 }),
    ).toBeVisible();
    expect(
      screen.getByText("For owners of 1–50 person field, service, retail, and hospitality shops"),
    ).toBeVisible();
    expect(document.body.textContent).toContain(HOME_DECK);
    expect(HOME_DECK).not.toMatch(/one real path of work/i);
    expect(HOME_DECK).toMatch(/not a canned intake script/i);
    expect(document.body.textContent).toMatch(
      /Invoices in the wrong hands\. Inventory that walks\. Work that waits on you/,
    );
    expect(
      document.body.textContent,
    ).toMatch(/structure and ownership problem, not a software problem/);
    expect(
      document.body.textContent,
    ).toMatch(/You may not need another tool/);
    expect(
      document.body.textContent,
    ).toMatch(/About 2 minutes\. Then book a complimentary 30-minute Operations Fit Review/);
    const heroCta = document
      .querySelector(".ww-hero")
      ?.querySelector('a[href="/assessment"]');
    expect(heroCta).toHaveTextContent(/Assess your operations/i);
  });

  it("covers who it is for, owner-noun pain cards, how we work, ladder without prices, proof, and footer", () => {
    renderPath("/");
    expect(
      screen.getByRole("heading", {
        name: /Built for shops where the owner still holds the day together/i,
      }),
    ).toBeVisible();
    expect(document.body.textContent).toContain(WHO_FOR_BODY);
    expect(document.body.textContent).toMatch(
      /hospitality \(restaurants, bars, hotels, catering\)/i,
    );
    expect(document.body.textContent).toMatch(/retail/i);
    expect(document.body.textContent).toMatch(/construction and trades/i);
    expect(document.body.textContent).toMatch(/field and home services/i);
    expect(document.body.textContent).toMatch(/signs, print, and production/i);
    expect(document.body.textContent).toMatch(/1–50/);
    expect(document.body.textContent).toContain(WHO_FOR_EXCLUDE);
    expect(document.body.textContent).toMatch(
      /Not promoted as a fit for law, accounting, or clinical/,
    );
    expect(document.body.textContent).toMatch(/all-in-one field app/);
    expect(document.body.textContent).toMatch(/fractional COO/);
    expect(
      screen.queryByRole("heading", { name: /Missed intake/i }),
    ).toBeNull();
    expect(
      screen.queryByRole("heading", { name: /Admin that chases you/i }),
    ).toBeNull();
    for (const [title] of HOME_PAIN_CARDS) {
      expect(screen.getByRole("heading", { name: title })).toBeVisible();
    }
    expect(document.querySelectorAll(".ww-problem-list article")).toHaveLength(3);
    expect(document.body.textContent).toMatch(
      /If nothing moves without you, the process is the product/,
    );
    expect(
      screen.getByRole("heading", {
        name: /One real path of work\. One practical improvement/i,
      }),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: /^Walk it$/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /Simplify it/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /Hand it over/i })).toBeVisible();
    expect(
      screen.getByRole("heading", { name: /A clear ladder\. No mystery pitch/i }),
    ).toBeVisible();
    expect(document.body.textContent).toMatch(/Operations assessment/);
    expect(document.body.textContent).toMatch(/Paid diagnostic/);
    expect(document.body.textContent).toMatch(/Optional support/);
    expect(document.body.textContent).not.toMatch(/\$\d/);
    expect(screen.getByText(HOME_PROOF_EYEBROW)).toBeVisible();
    expect(
      screen.getByRole("heading", { name: HOME_PROOF_TITLE }),
    ).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: /Shops like yours/i }),
    ).toBeNull();
    const proofCards = document.querySelectorAll(".ww-proof-grid article");
    expect(proofCards).toHaveLength(3);
    expect(
      document.querySelector(".ww-proof-grid .ww-proof-note")?.textContent,
    ).toMatch(/no invented testimonials/i);
    expect(
      document.querySelector(".ww-proof-grid article .ww-proof-note"),
    ).toBeNull();
    for (const card of HOME_PROOF_CARDS) {
      expect(screen.getByRole("heading", { name: card.title })).toBeVisible();
      expect(document.body.textContent).toContain(card.body);
      expect(document.body.textContent).toContain(card.note);
    }
    expect(document.body.textContent).toMatch(/kitchen folder/i);
    expect(document.body.textContent).toMatch(/QR code/i);
    expect(document.body.textContent).toMatch(/one email/i);
    expect(document.body.textContent).toMatch(/inventory/i);
    expect(document.body.textContent).toMatch(/walk off/i);
    expect(document.body.textContent).toMatch(/one example of stuck work, not the product/i);
    expect(document.body.textContent).toMatch(/no invented testimonials/i);
    expect(document.body.textContent).not.toMatch(
      /Find where jobs get stuck between intake and paid/i,
    );
    expect(
      screen.getByRole("heading", { name: HOME_INVITATION_TITLE }),
    ).toBeVisible();
    expect(document.body.textContent).toMatch(
      /fix how work gets done, without defaulting to another tool/,
    );
    expect(
      screen.getByRole("navigation", { name: "Main navigation" }),
    ).toHaveTextContent(/Services/);
    expect(
      screen.getByRole("navigation", { name: "Main navigation" }),
    ).not.toHaveTextContent(/Get started/i);
  });
});

describe("Remy / Operations Fit Review sitewide", () => {
  it("names Operations Fit Review on start, book, contact, services, assessment chrome, and machine files", () => {
    for (const path of ["/start", "/book"]) {
      const { unmount } = renderPath(path);
      expect(
        screen.getByRole("heading", { name: "Book an Operations Fit Review" }),
      ).toBeVisible();
      expect(document.body.textContent).not.toMatch(/Workflow Fit Review/);
      unmount();
    }
    renderPath("/contact");
    expect(
      screen.getByRole("link", { name: /Request an Operations Fit Review/i }),
    ).toHaveAttribute("href", "/assessment");
    renderPath("/services");
    expect(
      screen.getByRole("heading", { name: FIT_REVIEW_NAME }),
    ).toBeVisible();
    const assessment = render(<LegacyAssessment />);
    expect(
      assessment.container.querySelector(
        '[aria-label="Operations Fit Review (opens in a new tab)"]',
      ),
    ).toHaveTextContent("Operations Fit Review");
    expect(read("public/llms.txt")).toContain(FIT_REVIEW_NAME);
    expect(read("public/llms.txt")).toBe(read("public/.well-known/llms.txt"));
    expect(read("public/404.html")).toContain(FIT_REVIEW_NAME);
    expect(read("public/404.html")).toContain(BRAND_ACCENT);
  });

  it("keeps LegacyAssessment, GHL widgets, GA4, booking ID, and CRM flags", () => {
    const index = read("index.html");
    expect(index).toContain("G-Q5FNTC3EXW");
    expect(index).toContain('data-widget-id="6aa0a1639fbeb2a2186527c7"');
    expect(read("src/domain/assessment.ts")).toContain(
      "https://api.leadconnectorhq.com/widget/booking/tFmtpPmm23VC7ygrKxvK",
    );
    expect(ASSESSMENT_BOOKING_URL).toContain("tFmtpPmm23VC7ygrKxvK");
    expect(read("src/main.tsx")).toContain("LegacyAssessment");
    expect(read("scripts/prerender-entry.tsx")).toContain("LegacyAssessment");
    expect(read("server/config.ts")).toMatch(/Never force WW_CRM_SYNC_ENABLED/);
    expect(read(".env.example")).toContain("WW_CRM_SYNC_ENABLED=false");
  });

  it("does not invent dollar fees, testimonials, or em dashes in customer-facing offer copy", () => {
    for (const path of PUBLIC_COPY_FILES) {
      const source = read(path);
      expect(source, path).not.toMatch(/\$\d/);
      expect(source, path).not.toContain("Workflow Fit Review");
      expect(source, path).not.toContain("\u2014");
    }
    expect(pages["/"][0] + pages["/"][1]).not.toContain("\u2014");
    expect(pages["/start"][1]).toMatch(/Operations Fit Review/);
  });

  it("adds the About unique-ops insert and Fit Review definition", () => {
    renderPath("/about");
    expect(document.body.textContent).toContain(ABOUT_OPS_INSERT);
    expect(document.body.textContent).toMatch(
      /unique operations problem/i,
    );
    expect(document.body.textContent).toMatch(
      /complimentary 30-minute business operations review/i,
    );
    expect(document.body.textContent).toMatch(/several issues/i);
    expect(document.body.textContent).not.toContain("\u2014");
  });

  it("preserves honesty FAQs on services", () => {
    renderPath("/services");
    expect(
      screen.getByText("Can you guarantee how many hours we will save?"),
    ).toBeVisible();
    expect(screen.getByText("Will this replace an employee?")).toBeVisible();
    expect(
      screen.getByText("Do you provide compliance or security certification?"),
    ).toBeVisible();
  });
});
