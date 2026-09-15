import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { LegacyAssessment } from "../pages/Assessment";
import Website from "./Website";
import { guides, servicesHubFaqs, structuredData } from "./SearchContent";

function renderPath(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Website />
    </MemoryRouter>,
  );
}

function pngSize(path: string) {
  const buffer = readFileSync(path);
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function graphTypes(pathname: string) {
  const schema = structuredData(pathname);
  expect(schema).toBeTruthy();
  return (schema!["@graph"] as Record<string, unknown>[]).map(
    (node) => node["@type"],
  );
}

function faqQuestions(pathname: string) {
  const schema = structuredData(pathname)!;
  const faq = (schema["@graph"] as Record<string, unknown>[]).find(
    (node) => node["@type"] === "FAQPage",
  ) as { mainEntity: { name: string; acceptedAnswer: { text: string } }[] };
  expect(faq).toBeTruthy();
  return faq.mainEntity.map((item) => [item.name, item.acceptedAnswer.text]);
}

describe("P1 JSON-LD on core pages", () => {
  it("homes Organization and WebSite schema without inventing SearchAction", () => {
    const types = graphTypes("/");
    expect(types).toContain("Organization");
    expect(types).toContain("WebSite");
    expect(types).not.toContain("SearchAction");
    expect(JSON.stringify(structuredData("/"))).not.toContain("SearchAction");
    expect(JSON.stringify(structuredData("/"))).not.toContain("AggregateRating");
  });

  it("marks the visible services hub FAQ as FAQPage and does not invent Q&A", () => {
    const { unmount } = renderPath("/services");
    const visible = servicesHubFaqs.map(([question, answer]) => {
      expect(screen.getByText(question)).toBeVisible();
      expect(screen.getByText(answer)).toBeInTheDocument();
      return [question, answer];
    });
    unmount();
    expect(faqQuestions("/services")).toEqual(visible);
    expect(visible.some(([question]) => /law, CPA, or clinical/i.test(question))).toBe(
      true,
    );
  });

  it("adds FAQPage beside Article for guide buyer questions", () => {
    const guide = guides[0];
    const types = graphTypes(`/guides/${guide.slug}`);
    expect(types).toContain("Article");
    expect(types).toContain("FAQPage");
    expect(faqQuestions(`/guides/${guide.slug}`)).toEqual(guide.faqs);
  });

  it("describes the assessment as a 2-minute 7-question check to Fit Review", () => {
    const schema = structuredData("/assessment")!;
    const encoded = JSON.stringify(schema);
    expect(graphTypes("/assessment")).toEqual(
      expect.arrayContaining(["Organization", "HowTo"]),
    );
    expect(encoded).toMatch(/2-minute|two minutes/i);
    expect(encoded).toMatch(/7-question|seven questions/i);
    expect(encoded).toMatch(/Fit Review/);
    expect(encoded).not.toContain("AggregateRating");
    expect(encoded).not.toMatch(/No contact details required/i);

    const prerender = readFileSync(
      join(process.cwd(), "scripts/prerender-entry.tsx"),
      "utf8",
    );
    expect(prerender).toMatch(
      /path: "\/assessment"[\s\S]*schema: structuredData\("\/assessment"\)/,
    );
  });
});

describe("P1 ICP, answerability, and services CTAs", () => {
  it("puts who-it-is-for vignettes on home and about without courting regulated ICPs", () => {
    for (const path of ["/", "/about"]) {
      const { unmount } = renderPath(path);
      expect(
        screen.getAllByText(/owner-operators in service, retail, and hospitality/i)
          .length,
      ).toBeGreaterThan(0);
      expect(screen.getByRole("heading", { name: "Shop floor" })).toBeVisible();
      expect(
        screen.getByRole("heading", { name: "Front-of-house" }),
      ).toBeVisible();
      expect(
        screen.getByRole("heading", { name: "Service dispatch" }),
      ).toBeVisible();
      expect(document.body.textContent).toMatch(/intake/i);
      expect(document.body.textContent).toMatch(/schedul/i);
      expect(document.body.textContent).toMatch(/follow-up/i);
      expect(document.body.textContent).not.toMatch(
        /law firms|CPA practices|clinical practices we serve/i,
      );
      expect(document.body.textContent).not.toContain("\u2014");
      unmount();
    }
  });

  it("keeps the home H1 and adds a supporting 2-minute assessment line", () => {
    renderPath("/");
    expect(
      screen.getByRole("heading", { level: 1, name: /From scattered requests/i }),
    ).toBeVisible();
    expect(
      screen.getByText(
        /Improve one recurring workflow so admin stops eating the week/i,
      ),
    ).toBeVisible();
    expect(screen.getByText(/Start with a 2-minute assessment/i)).toBeVisible();
    expect(document.body.textContent).not.toContain("\u2014");
    expect(document.body.textContent).not.toMatch(/\d+%/);
    expect(document.body.textContent).not.toMatch(/testimonial/i);
  });

  it("makes Assess to /assessment the primary services hub button path", () => {
    renderPath("/services");
    const primary = screen
      .getAllByRole("link", { name: /Assess your operations/i })
      .filter((link) => link.classList.contains("ww-button"));
    expect(primary.length).toBeGreaterThanOrEqual(3);
    expect(
      primary.every((link) => link.getAttribute("href") === "/assessment"),
    ).toBe(true);
    expect(screen.getAllByText(/Prefer email\?/i).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: /Request a diagnostic/i }),
    ).toHaveAttribute("href", "/start");
    expect(
      screen.getByRole("link", { name: /Scope the first workflow/i }),
    ).toHaveAttribute("href", "/start");
    const questionMail = screen.getAllByRole("link", {
      name: "operations@wonderworkflow.com",
    });
    expect(
      questionMail.some(
        (link) =>
          link.getAttribute("href") === "mailto:operations@wonderworkflow.com",
      ),
    ).toBe(true);
    expect(document.body.textContent).not.toContain("\u2014");
  });
});

describe("P1 sitemap and social tags", () => {
  it("lists only canonical URLs and lastmod dates", () => {
    const xml = readFileSync(join(process.cwd(), "public/sitemap.xml"), "utf8");
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      (match) => match[1],
    );
    const lastmods = [...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map(
      (match) => match[1],
    );
    expect(locs.length).toBeGreaterThanOrEqual(22);
    expect(lastmods).toHaveLength(locs.length);
    expect(locs.filter((loc, index) => locs.indexOf(loc) !== index)).toEqual([]);
    expect(locs.every((loc) => loc === "https://wonderworkflow.com/" || !loc.endsWith("/"))).toBe(
      true,
    );
    expect(locs).toContain("https://wonderworkflow.com/assessment");
    expect(locs).not.toContain("https://wonderworkflow.com/assessment/");
    expect(locs).not.toContain("https://wonderworkflow.com/pricing");
    expect(lastmods.every((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))).toBe(
      true,
    );
  });

  it("uses a page-appropriate OG image and summary_large_image tags on core pages", () => {
    const image = join(process.cwd(), "public/brand/og-ops.png");
    expect(existsSync(image)).toBe(true);
    expect(pngSize(image)).toEqual({ width: 1200, height: 630 });

    const html = readFileSync(join(process.cwd(), "index.html"), "utf8");
    expect(html).toContain('property="og:type" content="website"');
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    expect(html).toContain("https://wonderworkflow.com/brand/og-ops.png");
    expect(html).not.toContain("\u2014");

    const prerender = readFileSync(
      join(process.cwd(), "scripts/prerender.mjs"),
      "utf8",
    );
    expect(prerender).toContain("og:type");
    expect(prerender).toContain("twitter:card");
    expect(prerender).toContain("summary_large_image");
    expect(prerender).toContain("/brand/og-ops.png");

    renderPath("/");
    expect(
      document.querySelector('meta[property="og:type"]'),
    ).toHaveAttribute("content", "website");
    expect(
      document.querySelector('meta[name="twitter:card"]'),
    ).toHaveAttribute("content", "summary_large_image");
    expect(
      document.querySelector('meta[property="og:image"]'),
    ).toHaveAttribute(
      "content",
      "https://wonderworkflow.com/brand/og-ops.png",
    );

    const { unmount } = render(<LegacyAssessment />);
    expect(
      document.querySelector("#ww-structured-data")?.textContent,
    ).toMatch(/HowTo/);
    expect(document.body.textContent).not.toMatch(/No contact details required/i);
    unmount();
  });
});
