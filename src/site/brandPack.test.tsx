import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { LegacyAssessment } from "../pages/Assessment";
import { ASSESSMENT_BOOKING_URL } from "../domain/assessment";
import Website, { pages } from "./Website";
import {
  BRAND_ACCENT,
  FIT_REVIEW_NAME,
  HOME_DESCRIPTION,
  HOME_H1,
  HOME_TITLE,
  LOGO_AVATAR,
  LOGO_OG,
  LOGO_STACKED_INK,
  LOGO_STACKED_PAPER,
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
  it("locks meta, quiet H1, Feel photography, and the three Assess placements", () => {
    expect(pages["/"][0]).toBe(HOME_TITLE);
    expect(pages["/"][1]).toBe(HOME_DESCRIPTION);
    renderPath("/");
    expect(document.title).toBe(`${HOME_TITLE} | Wonder & Workflow`);
    expect(
      screen.getByRole("heading", { level: 1, name: HOME_H1 }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: "The way work gets done can't keep up with the work.",
      }),
    ).toBeVisible();
    expect(document.querySelector(".ship-feel-hero")).toHaveAttribute(
      "src",
      "/brand/homepage-ship/warehouse-pace-web.jpg",
    );
    expect(document.body.textContent).not.toMatch(
      /Missed calls while you’re on a job/,
    );
    expect(document.body.textContent).toMatch(
      /fix how work gets done, without defaulting to another tool/,
    );
    const assess = Array.from(
      document.querySelectorAll('a[href="/assessment"]'),
    ).filter((link) => /assess|fit review/i.test(link.textContent ?? ""));
    expect(assess).toHaveLength(3);
  });

  it("covers who it is for, owner-scale forks, and quiet services chrome", () => {
    renderPath("/");
    expect(
      screen.getByRole("heading", {
        name: /Built for shops where the owner still holds the day together/i,
      }),
    ).toBeVisible();
    expect(document.body.textContent).toMatch(/Cleaning, landscaping, detailing/);
    expect(document.body.textContent).toMatch(/hospitality, retail/);
    expect(document.body.textContent).toMatch(/all-in-one field app/);
    expect(document.body.textContent).toMatch(/fractional COO/);
    expect(screen.getByRole("heading", { name: /First hires/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /Volume spike/i })).toBeVisible();
    expect(document.body.textContent).not.toMatch(/\$\d/);
    expect(
      screen.getByRole("navigation", { name: "Main navigation" }),
    ).toHaveTextContent(/See how we work/);
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
    expect(index).toContain('data-widget-id="6aad8507aaad87c6c4b513a1"');
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
