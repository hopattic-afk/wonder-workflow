import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Website from "./Website";
import {
  ASSESS_CLOSE_HEAD,
  ASSESS_CLOSE_LEDE,
  AUTOMATION_HEAD,
  FEEL_FACE,
  FEEL_SEASONING,
  FIT_REVIEW_LOCK,
  HOME_H1,
  INFLECTION_FORKS,
  UNDERSTAND_HEAD,
  UNDERSTAND_LEDE,
} from "./publicOffer";
import {
  assessGlowFromProgress,
  beatOpacities,
  chapterProgress,
} from "./feelUnderstandAssessMotion";

const root = process.cwd();
function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}
function renderHome() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Website />
    </MemoryRouter>,
  );
}

describe("Feel→Understand→Assess homepage chapter", () => {
  it("locks Feel, Understand, Assess, inflection, and automation copy after the hero", () => {
    renderHome();

    expect(
      screen.getByRole("heading", { level: 1, name: HOME_H1 }),
    ).toBeVisible();
    expect(document.body.textContent).toMatch(
      /The way work gets done\s+can't keep up with the work\./,
    );
    expect(document.body.textContent).toContain(FEEL_SEASONING);
    expect(
      screen.getByRole("heading", { hidden: true, name: UNDERSTAND_HEAD }),
    ).toBeInTheDocument();
    expect(document.body.textContent).toContain(UNDERSTAND_LEDE);
    expect(
      screen.getAllByRole("heading", { hidden: true, name: ASSESS_CLOSE_HEAD })
        .length,
    ).toBeGreaterThan(0);
    expect(document.body.textContent).toContain(ASSESS_CLOSE_LEDE);
    expect(document.body.textContent).toContain(FIT_REVIEW_LOCK);

    for (const fork of INFLECTION_FORKS) {
      expect(
        screen.getByRole("heading", { name: fork.title }),
      ).toBeVisible();
      expect(document.body.textContent).toContain(fork.body);
    }

    expect(
      screen.getByRole("heading", { name: AUTOMATION_HEAD }),
    ).toBeVisible();
    expect(document.body.textContent).toMatch(
      /don't need a chatbot/i,
    );

    const chapter = document.querySelector("#feel-understand-assess");
    expect(chapter).toBeTruthy();
    const chapterText = chapter?.textContent ?? "";
    expect(chapterText).toMatch(
      /The way work gets done\s+can't keep up with the work\./,
    );
    expect(chapterText).toContain(AUTOMATION_HEAD);
    expect(chapterText.search(/The way work gets done/)).toBeLessThan(
      chapterText.indexOf(AUTOMATION_HEAD),
    );
  });

  it("sends in-chapter Assess CTAs to /assessment and drops the Ownership path", () => {
    renderHome();

    expect(document.querySelector("#ownership-path")).toBeNull();
    expect(document.querySelector(".ops-chapter")).toBeNull();
    expect(document.body.textContent).not.toContain(
      "Different people. Different versions of the truth.",
    );
    expect(document.body.textContent).not.toMatch(/Beat 01 · Stuck/);
    expect(
      document.querySelector('img[src*="role-tile-office"]'),
    ).toBeNull();
    expect(
      document.querySelector('img[src*="role-tile-crew"]'),
    ).toBeNull();
    expect(
      document.querySelector('img[src*="role-tile-owner"]'),
    ).toBeNull();

    const chapterAssess = document
      .querySelector("#feel-understand-assess")
      ?.querySelectorAll('a[href="/assessment"]');
    expect(chapterAssess && chapterAssess.length).toBeGreaterThan(0);
    expect(
      Array.from(chapterAssess ?? []).some((link) =>
        /Assess your operations/i.test(link.textContent ?? ""),
      ),
    ).toBe(true);

    const headerAssess = document.querySelectorAll(
      ".ww-header a[href='/assessment'], .ww-header a[href=\"/assessment\"]",
    );
    expect(headerAssess.length).toBeGreaterThan(0);

    expect(document.body.textContent).not.toContain("\u2014");
  });

  it("keeps tokens paper/ink/accent and never uses violet on the chapter", () => {
    const css = read("src/site/feel-understand-assess.css");
    expect(css).toMatch(/#fafaf8/i);
    expect(css).toMatch(/#20232b/i);
    expect(css).toMatch(/#7ba1af/i);
    expect(css).not.toContain("#56438a");
    expect(css).not.toContain("ww-live-scene");
    expect(css).not.toContain("ww-operating-scene");
    expect(read("src/site/Website.tsx")).not.toContain("OwnershipPathScroll");
    expect(read("src/site/Website.tsx")).toContain("FeelUnderstandAssess");
  });
});

describe("Feel→Understand→Assess scroll math", () => {
  it("maps chapter scroll into 0–1 progress", () => {
    expect(chapterProgress(0, 3200, 1000)).toBe(0);
    expect(chapterProgress(-1100, 3200, 1000)).toBe(0.5);
    expect(chapterProgress(-2200, 3200, 1000)).toBe(1);
    expect(chapterProgress(200, 3200, 1000)).toBe(0);
    expect(chapterProgress(-4000, 3200, 1000)).toBe(1);
  });

  it("crossfades Feel, Understand, and Assess on proto windows", () => {
    const start = beatOpacities(0);
    expect(start.feel).toBe(1);
    expect(start.understand).toBe(0);
    expect(start.assess).toBe(0);

    const earlyFeel = beatOpacities(0.1);
    expect(earlyFeel.feel).toBeGreaterThan(0.8);

    const midFeel = beatOpacities(0.18);
    expect(midFeel.feel).toBeGreaterThan(0.8);
    expect(midFeel.understand).toBe(0);

    const understand = beatOpacities(0.5);
    expect(understand.feel).toBe(0);
    expect(understand.understand).toBeGreaterThan(0.8);
    expect(understand.assess).toBe(0);

    const assess = beatOpacities(0.85);
    expect(assess.feel).toBe(0);
    expect(assess.understand).toBe(0);
    expect(assess.assess).toBeGreaterThan(0.8);
  });

  it("fills header Assess on the Assess beat, after the chapter, and for reduced motion", () => {
    expect(assessGlowFromProgress(0.2, false)).toBe(false);
    expect(assessGlowFromProgress(0.67, false)).toBe(true);
    expect(assessGlowFromProgress(1, false)).toBe(true);
    expect(assessGlowFromProgress(0, true)).toBe(true);
  });
});
