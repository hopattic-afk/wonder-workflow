import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { HomepageShip } from "./HomepageShip";
import { guides, services } from "./SearchContent";
import Website from "./Website";
import {
  ASSESS_BEAT_LABEL,
  ASSESS_CLOSE,
  AUTOMATION_BODY,
  AUTOMATION_H2,
  AUTOMATION_TRUTH,
  FEEL_FACE,
  FEEL_SUPPORT,
  FIT_REVIEW_LINE,
  HOMEPAGE_MEDIA,
  UNDERSTAND_H2,
  UNDERSTAND_LEAD,
  UNDERSTAND_STEPS,
  WHO_FOR_BODY,
  WHO_FOR_HEADING,
} from "./publicOffer";

const root = process.cwd();

function renderHome() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Website />
    </MemoryRouter>,
  );
}

function homepageAssessLinks() {
  return Array.from(document.querySelectorAll('a[href="/assessment"]')).filter(
    (link) => /assess|fit review/i.test(link.textContent ?? ""),
  );
}

describe("Homepage ship chapter", () => {
  it("locks Reed Feel / Understand / Assess copy and photography", () => {
    render(
      <MemoryRouter>
        <HomepageShip />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: FEEL_FACE })).toBeVisible();
    expect(screen.getByText(FEEL_SUPPORT)).toBeVisible();
    expect(
      screen.getByRole("heading", { name: UNDERSTAND_H2 }),
    ).toBeInTheDocument();
    expect(screen.getByText(UNDERSTAND_LEAD)).toBeInTheDocument();
    for (const step of UNDERSTAND_STEPS) {
      expect(screen.getByText(step)).toBeInTheDocument();
    }
    expect(document.querySelector(".ship-close-lines")?.textContent).toContain(
      ASSESS_CLOSE[0],
    );
    expect(document.querySelector(".ship-close-lines")?.textContent).toContain(
      ASSESS_CLOSE[1],
    );
    expect(screen.getByText(FIT_REVIEW_LINE)).toBeInTheDocument();

    const hero = document.querySelector<HTMLImageElement>(".ship-feel-hero");
    expect(hero).toBeTruthy();
    expect(hero).toHaveAttribute("src", HOMEPAGE_MEDIA.feel);
    expect(hero?.getAttribute("src")).toContain("warehouse-pace-web.jpg");

    const srcs = Array.from(document.querySelectorAll("img")).map(
      (img) => img.getAttribute("src") ?? "",
    );
    expect(srcs).toContain(HOMEPAGE_MEDIA.desk);
    expect(srcs).toContain(HOMEPAGE_MEDIA.field);
    expect(srcs).toContain(HOMEPAGE_MEDIA.shop);
    expect(srcs).toContain(HOMEPAGE_MEDIA.pile);
    expect(srcs.some((src) => src.includes("role-tile-office.svg"))).toBe(false);
    expect(document.body.textContent).not.toContain("\u2014");
    expect(document.body.innerHTML).not.toContain("#56438a");

    expect(document.querySelector(".ship-step-num")).toBeNull();
    expect(document.querySelector(".ship-steps")?.textContent ?? "").not.toMatch(
      /\b0[123]\b/,
    );
    expect(
      document.querySelectorAll("[data-beat]").length,
    ).toBe(3);
    for (const beat of ["feel", "understand", "assess"]) {
      expect(document.querySelector(`[data-beat="${beat}"]`)).toBeTruthy();
    }
  });

  it("keeps automation after the chapter and never leads with AI", () => {
    const source = readFileSync(
      join(root, "src/site/HomepageShip.tsx"),
      "utf8",
    );
    const offer = readFileSync(join(root, "src/site/publicOffer.ts"), "utf8");
    expect(source.indexOf("{FEEL_FACE}")).toBeLessThan(
      source.indexOf("{AUTOMATION_H2}"),
    );
    expect(source).toContain("{AUTOMATION_BODY}");
    expect(source).toContain("{AUTOMATION_TRUTH}");
    expect(offer).toContain(AUTOMATION_BODY);
    expect(offer).toContain(AUTOMATION_TRUTH);
    expect(source).not.toMatch(/AI makes you money|chatbot pitch|robot/i);
    expect(source).not.toContain("OwnershipPathScroll");
  });

  it("keeps the Feel photo in normal flow with a viewport min-height", () => {
    const css = readFileSync(join(root, "src/site/homepage-ship.css"), "utf8");
    const media = css.match(/\.ship-feel-media\s*\{[^}]*\}/)?.[0] ?? "";
    const hero = css.match(/\.ship-feel-hero\s*\{[^}]*\}/)?.[0] ?? "";
    expect(media).not.toMatch(/position:\s*absolute/);
    expect(hero).toMatch(/min-height:\s*min\(\s*100vh\s*,/);
    expect(hero).toMatch(/object-fit:\s*cover/);
    expect(css).not.toMatch(/position:\s*sticky/);
    expect(css).not.toMatch(/340vh/);
  });

  it("flows Feel, Understand, and Assess without a sticky scrub chapter", () => {
    const source = readFileSync(
      join(root, "src/site/HomepageShip.tsx"),
      "utf8",
    );
    const css = readFileSync(join(root, "src/site/homepage-ship.css"), "utf8");
    expect(css).not.toMatch(/position:\s*sticky/);
    expect(css).not.toMatch(/340vh/);
    expect(css).not.toMatch(/\.ship-beat\s*\{[^}]*position:\s*absolute/);
    expect(css).not.toMatch(/\.ship-beat\s*\{[^}]*opacity:\s*0/);
    expect(source).not.toContain("translate3d");
    expect(source).not.toContain("progressFromScroll");
    expect(source).not.toContain("ship-step-num");
  });

  it("uses an accent fill and ink label for the paper-header Assess control at rest", () => {
    const css = readFileSync(join(root, "src/site/website.css"), "utf8");
    const rest = css.match(/\.ww-header-assess\s*\{[^}]*\}/)?.[0] ?? "";
    expect(rest).toMatch(/background:\s*#7ba1af/i);
    expect(rest).toMatch(/color:\s*#20232b\s*!important/i);
    expect(rest).not.toMatch(/:hover/);
  });

  it("paints the Assess button label in accent on the ink fill at rest", () => {
    const css = readFileSync(join(root, "src/site/homepage-ship.css"), "utf8");
    const rest = css.match(/\.ship a\.ship-btn-primary\s*\{[^}]*\}/)?.[0] ?? "";
    expect(rest).toMatch(/background:\s*(var\(--ww-ink\)|#20232b)/i);
    expect(rest).toMatch(/color:\s*(var\(--ww-accent\)|#7ba1af)/i);
    expect(rest).not.toMatch(/:hover/);
  });
});

const MARKETING_PATHS = [
  "/",
  "/services",
  "/how-we-work",
  "/about",
  "/guides",
  "/start",
  "/privacy",
  "/terms",
  "/contact",
  "/case-studies/operations-assessment",
  ...services.map((service) => `/services/${service.slug}`),
  ...guides.map((guide) => `/guides/${guide.slug}`),
];

function decorativeStepNumerals() {
  return Array.from(document.querySelectorAll("p, span, li")).flatMap((el) => {
    if (el.children.length > 0) return [];
    const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
    return /^0\d$/.test(text) || /^0\d\s*\//.test(text) ? [text] : [];
  });
}

describe("Homepage ship page chrome", () => {
  it("caps Assess / Fit Review book CTAs at three and keeps Chat / Work secondary", () => {
    renderHome();

    expect(
      screen.getByRole("heading", { level: 1, name: /outgrown the way the work gets done/i }),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: FEEL_FACE })).toBeVisible();

    const assess = homepageAssessLinks();
    const labels = assess.map((link) =>
      (link.textContent ?? "").replace(/\s+/g, " ").trim(),
    );
    expect(labels.some((label) => /^Assess/.test(label) && !/operations/i.test(label))).toBe(
      true,
    );
    expect(labels.some((label) => label.includes(ASSESS_BEAT_LABEL))).toBe(true);
    expect(labels).toContain("Book a Fit Review");
    expect(assess).toHaveLength(3);

    const chats = screen.getAllByRole("link", { name: "Chat with us" });
    expect(chats.length).toBeGreaterThanOrEqual(2);
    expect(
      chats.every((link) => link.getAttribute("href") === "mailto:operations@wonderworkflow.com"),
    ).toBe(true);
    expect(screen.getAllByRole("link", { name: "Work with us" })[0]).toHaveAttribute(
      "href",
      "mailto:operations@wonderworkflow.com",
    );
    expect(screen.getAllByRole("link", { name: "See how we work" })[0]).toHaveAttribute(
      "href",
      "/services",
    );
  });

  it("renders inflection, seasoning, automation, and ICP without card Assess CTAs or pain laundry", () => {
    renderHome();

    expect(screen.getByRole("heading", { name: /If you find yourself at any of these forks/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: "First hires" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Volume spike" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Buried in the day" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Things falling through" })).toBeVisible();
    expect(screen.getByText("Who's getting left on read while you're on the tools?")).toBeVisible();
    expect(screen.getByRole("heading", { name: AUTOMATION_H2 })).toBeVisible();
    expect(screen.getByRole("heading", { name: WHO_FOR_HEADING })).toBeVisible();
    expect(document.body.textContent).toContain(WHO_FOR_BODY);
    expect(document.body.textContent).toMatch(/hospitality, retail/);
    expect(document.body.textContent).not.toMatch(/Not for:/);
    expect(document.body.textContent).not.toMatch(/all-in-one field app/);
    expect(document.body.textContent).not.toMatch(/fractional COO embed/);
    expect(document.querySelector(".ship-icp-not")).toBeNull();
    expect(document.body.textContent).not.toMatch(/Missed calls while you’re on a job/);
    expect(document.body.textContent).not.toMatch(/Missed intake/);
    expect(document.querySelector(".ww-operating-scene")).toBeNull();
    expect(document.querySelector(".ops-chapter")).toBeNull();

    const cardAssess = document.querySelectorAll(
      ".ship-fork-card a[href='/assessment'], .ship-season-card a[href='/assessment']",
    );
    expect(cardAssess).toHaveLength(0);
  });

  it("drops decorative 01/02/03 eyebrows and step numerals on marketing pages", () => {
    for (const path of MARKETING_PATHS) {
      const { unmount } = render(
        <MemoryRouter initialEntries={[path]}>
          <Website />
        </MemoryRouter>,
      );
      expect(decorativeStepNumerals(), path).toEqual([]);
      expect(document.querySelector(".ship-step-num"), path).toBeNull();
      expect(document.querySelector(".ww-step-index"), path).toBeNull();
      unmount();
    }
  });

  it("commits optimized homepage media and attribution, not original rasters", () => {
    const dir = join(root, "public/brand/homepage-ship");
    for (const file of [
      "warehouse-pace-web.jpg",
      "desk-papers-web.jpg",
      "field-van-web.jpg",
      "shop-floor-web.jpg",
      "schedule-board-web.jpg",
      "ATTRIBUTION.md",
    ]) {
      expect(existsSync(join(dir, file)), file).toBe(true);
    }
    expect(existsSync(join(dir, "warehouse-pace.jpg"))).toBe(false);
    const attribution = readFileSync(join(dir, "ATTRIBUTION.md"), "utf8");
    expect(attribution).toContain("Unsplash");
    expect(attribution).toContain("Ruchindra Gunasekara");
    expect(existsSync(join(root, "public/fonts/InstrumentSerif-Regular.woff2"))).toBe(true);
  });

  it("sets a paper html and body background before the dark app shell can flash", () => {
    const html = readFileSync(join(root, "index.html"), "utf8");
    expect(html).toMatch(
      /<style>html,body\{background-color:#FAFAF8\}<\/style>/,
    );
    expect(html.indexOf("<style>html,body{background-color:#FAFAF8}</style>")).toBeLessThan(
      html.indexOf("</head>"),
    );
    const appCss = readFileSync(join(root, "src/styles/app.css"), "utf8");
    const rootBlock = appCss.match(/:root\s*\{[^}]*\}/)?.[0] ?? "";
    expect(rootBlock).not.toMatch(/background:\s*#0b0b0b/i);
    expect(appCss).toMatch(/\.app\s*\{[^}]*background:\s*#0b0b0b/i);
  });
});
