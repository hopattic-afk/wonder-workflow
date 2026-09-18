import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { HomepageShip } from "./HomepageShip";
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
});

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
    expect(document.body.textContent).not.toMatch(/Missed calls while you’re on a job/);
    expect(document.body.textContent).not.toMatch(/Missed intake/);
    expect(document.querySelector(".ww-operating-scene")).toBeNull();
    expect(document.querySelector(".ops-chapter")).toBeNull();

    const cardAssess = document.querySelectorAll(
      ".ship-fork-card a[href='/assessment'], .ship-season-card a[href='/assessment']",
    );
    expect(cardAssess).toHaveLength(0);
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
});
