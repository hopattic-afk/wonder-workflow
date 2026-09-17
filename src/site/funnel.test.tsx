import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToString } from "react-dom/server";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { LegacyAssessment } from "../pages/Assessment";
import { QUESTIONS } from "../domain/assessment";
import Website, { pages } from "./Website";

function renderPath(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Website />
    </MemoryRouter>,
  );
}

describe("P0 public funnel and machine files", () => {
  it("prerender and live assessment omit the old no-contact trust line", () => {
    const prerender = readFileSync(
      join(process.cwd(), "scripts/prerender-entry.tsx"),
      "utf8",
    );
    expect(prerender).toContain("LegacyAssessment");
    expect(prerender).not.toMatch(/html: renderToString\(<Assessment \/>\)/);
    expect(prerender).toContain("Operations Assessment");

    const assessment = readFileSync(
      join(process.cwd(), "src/pages/Assessment.tsx"),
      "utf8",
    );
    expect(assessment).not.toContain("No contact details required");
    expect(assessment).not.toContain("calculated in this browser tab");

    const html = renderToString(<LegacyAssessment />);
    expect(html).toContain(QUESTIONS[0].label);
    expect(html).not.toMatch(/No contact details required/i);
    expect(html).not.toMatch(/calculated in this browser tab/i);
    expect(html).not.toContain("\u2014");
  });

  it("home title and eyebrow lead with locked field-shop copy", () => {
    expect(pages["/"][0]).toBe(
      "Business operations help for hospitality, field, and service shops",
    );
    const source = readFileSync(join(process.cwd(), "src/site/publicOffer.ts"), "utf8");
    expect(source).toContain(
      "For owners of 1–50 person field, service, retail, and hospitality shops",
    );
    expect(source).not.toContain("AI operations for service businesses");
    expect(pages["/"][0] + pages["/"][1]).not.toContain("\u2014");
  });

  it("start and book describe save-then-calendar booking with an assessment CTA", () => {
    for (const path of ["/start", "/book"]) {
      const { unmount } = renderPath(path);
      expect(
        screen.getByRole("heading", { name: "Book an Operations Fit Review" }),
      ).toBeVisible();
      expect(screen.getByText(/contact details and save/i)).toBeVisible();
      expect(
        screen.getByText(/Operations Fit Review calendar appears on the same page/i),
      ).toBeVisible();
      const assess = screen.getAllByRole("link", {
        name: /Assess your operations/i,
      });
      expect(
        assess.some((link) => link.getAttribute("href") === "/assessment"),
      ).toBe(true);
      expect(
        screen
          .getAllByRole("link", { name: "operations@wonderworkflow.com" })
          .every(
            (link) =>
              link.getAttribute("href") ===
              "mailto:operations@wonderworkflow.com",
          ),
      ).toBe(true);
      expect(document.body.textContent).not.toContain("\u2014");
      unmount();
    }
  });

  it("contact offers assessment Fit Review CTAs and keeps mailto for questions", () => {
    renderPath("/contact");
    expect(
      screen.getByRole("heading", { name: "Assess your operations" }),
    ).toBeVisible();
    expect(
      screen.getAllByRole("link", { name: /Assess your operations/i })[0],
    ).toHaveAttribute("href", "/assessment");
    expect(
      screen.getByRole("link", { name: /Request an Operations Fit Review/i }),
    ).toHaveAttribute("href", "/assessment");
    expect(
      screen
        .getAllByRole("link", { name: "operations@wonderworkflow.com" })
        .every(
          (link) =>
            link.getAttribute("href") === "mailto:operations@wonderworkflow.com",
        ),
    ).toBe(true);
    expect(document.body.textContent).not.toContain("\u2014");
  });

  it("client /pricing does not keep a homepage canonical", () => {
    renderPath("/pricing");
    expect(document.title).toBe(
      "Operations Fit Review, diagnostic, and implementation | Wonder & Workflow",
    );
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://wonderworkflow.com/services",
    );
    expect(
      screen.getByRole("heading", { name: /Start small enough to understand/i }),
    ).toBeVisible();
  });

  it("ships a real llms.txt and Netlify rules that stop pricing and machine-file soft 404s", () => {
    const llms = readFileSync(join(process.cwd(), "public/llms.txt"), "utf8");
    const wellKnown = readFileSync(
      join(process.cwd(), "public/.well-known/llms.txt"),
      "utf8",
    );
    expect(llms).toBe(wellKnown);
    expect(llms).toContain("Wonder & Workflow");
    expect(llms).toMatch(/field and service shops/i);
    expect(llms).toContain("https://wonderworkflow.com/assessment");
    expect(llms).toContain("operations@wonderworkflow.com");
    expect(llms).toMatch(/not a marketing agency/i);
    expect(llms).toMatch(/No public pricing/i);
    expect(llms).not.toContain("\u2014");

    const netlify = readFileSync(join(process.cwd(), "netlify.toml"), "utf8");
    expect(netlify.indexOf('from = "/pricing"')).toBeGreaterThan(-1);
    expect(netlify.indexOf('from = "/pricing"')).toBeLessThan(
      netlify.indexOf('from = "/*"'),
    );
    expect(netlify).toMatch(/from = "\/pricing"\s+to = "\/services"\s+status = 301/);
    expect(netlify).toContain('from = "/.well-known/llms.txt"');
    expect(netlify).toContain("Content-Type = \"text/plain; charset=utf-8\"");
    expect(netlify).toMatch(/from = "\/ai\.txt"[\s\S]*?status = 404/);
  });
});
