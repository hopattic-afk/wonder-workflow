import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { LegacyAssessment } from "../pages/Assessment";
import { honestyFaqs, structuredData } from "./SearchContent";
import Website from "./Website";
import { HOME_DESCRIPTION, HOME_TITLE } from "./publicOffer";

function graphTypes(pathname: string) {
  const schema = structuredData(pathname);
  expect(schema).toBeTruthy();
  return JSON.stringify(schema);
}

describe("technical SEO for the brand pack PR", () => {
  it("home JSON-LD is Organization plus WebSite with no fake SearchAction or ratings", () => {
    const json = graphTypes("/");
    expect(json).toContain('"@type":"Organization"');
    expect(json).toContain('"@type":"WebSite"');
    expect(json).toContain(HOME_DESCRIPTION.slice(0, 40));
    expect(json).not.toContain("SearchAction");
    expect(json).not.toContain("AggregateRating");
  });

  it("services index and guides emit FAQPage matching visible FAQs", () => {
    const servicesJson = graphTypes("/services");
    expect(servicesJson).toContain('"@type":"FAQPage"');
    expect(servicesJson).toContain(honestyFaqs[1][0]);
    const guideJson = graphTypes(
      "/guides/what-business-processes-should-i-automate-first",
    );
    expect(guideJson).toContain('"@type":"FAQPage"');
    expect(guideJson).toContain("Should I automate the most time-consuming process first?");
  });

  it("assessment JSON-LD is a light HowTo and is written on the public path", () => {
    const json = graphTypes("/assessment");
    expect(json).toContain('"@type":"HowTo"');
    expect(json).toContain("Operations Fit Review");
    render(<LegacyAssessment />);
    expect(
      document.querySelector("#ww-structured-data")?.textContent,
    ).toContain("HowTo");
  });

  it("key titles lead with owner outcomes, not AI Operations first", () => {
    expect(HOME_TITLE.toLowerCase()).not.toMatch(/^ai operations/);
    expect(HOME_TITLE.toLowerCase()).not.toMatch(/^ops workflows/);
    render(
      <MemoryRouter initialEntries={["/missing-machine-file"]}>
        <Website />
      </MemoryRouter>,
    );
    expect(
      document.querySelector<HTMLMetaElement>('meta[name="description"]')
        ?.content,
    ).not.toMatch(/AI operations/i);
    const css = readFileSync(join(process.cwd(), "src/site/website.css"), "utf8");
    const home = readFileSync(join(process.cwd(), "src/site/Website.tsx"), "utf8");
    expect(css).not.toContain("ww-workflow-hero");
    expect(home).not.toContain("ww-workflow-hero");
    expect(home).toContain("ww-home-hero");
  });

  it("sitemap lastmod matches trailing-slash canonicals and Search Console docs exist", () => {
    const sitemap = readFileSync(join(process.cwd(), "public/sitemap.xml"), "utf8");
    expect(sitemap).toContain("<lastmod>2026-09-17</lastmod>");
    expect(sitemap).toContain("<loc>https://wonderworkflow.com/assessment/</loc>");
    expect(sitemap).not.toContain("<loc>https://wonderworkflow.com/assessment</loc>");
    expect(sitemap).not.toContain("https://wonderworkflow.com/pricing");
    const checklist = readFileSync(
      join(process.cwd(), "docs/search-console-checklist.md"),
      "utf8",
    );
    expect(checklist).toContain("https://search.google.com/search-console");
    expect(checklist).toContain("https://wonderworkflow.com/sitemap.xml");
    expect(checklist).toContain("G-Q5FNTC3EXW");
    const netlify = readFileSync(join(process.cwd(), "netlify.toml"), "utf8");
    expect(netlify).toMatch(/from = "\/ai\.txt"[\s\S]*?status = 404/);
    expect(netlify).toMatch(/from = "\/ads\.txt"[\s\S]*?status = 404/);
  });
});
