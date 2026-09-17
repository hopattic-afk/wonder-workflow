import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Website, { pages } from "./Website";
import { guides, services, structuredData } from "./SearchContent";
import { ASSESSMENT_BOOKING_URL } from "../domain/assessment";

const CONSULTANT = "/services/operations-consultant-for-small-business";
const AUDIT = "/services/operations-audit-for-small-business";
const BOTTLENECK = "/guides/how-to-stop-being-the-bottleneck-in-your-business";

function renderPath(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Website />
    </MemoryRouter>,
  );
}

function sitemap() {
  return readFileSync(join(process.cwd(), "public/sitemap.xml"), "utf8");
}

function json(pathname: string) {
  return JSON.stringify(structuredData(pathname));
}

describe("Stage 1 SEO pages", () => {
  it("registers the three Stage 1 routes in listings, metadata, and sitemap", () => {
    expect(services.map((s) => s.slug)).toContain(
      "operations-consultant-for-small-business",
    );
    expect(services.map((s) => s.slug)).toContain(
      "operations-audit-for-small-business",
    );
    expect(guides.map((g) => g.slug)).toContain(
      "how-to-stop-being-the-bottleneck-in-your-business",
    );

    expect(pages[CONSULTANT]?.[0]).toMatch(/operations consultant for small business/i);
    expect(pages[AUDIT]?.[0]).toMatch(/operations audit for small business/i);
    expect(pages[BOTTLENECK]?.[0]).toMatch(
      /how to stop being the bottleneck in your business/i,
    );

    for (const path of [CONSULTANT, AUDIT, BOTTLENECK]) {
      expect(sitemap()).toContain(`<loc>https://wonderworkflow.com${path}/</loc>`);
      expect(sitemap()).not.toContain(`<loc>https://wonderworkflow.com${path}</loc>`);
    }

    renderPath("/services");
    expect(
      screen.getByRole("link", {
        name: /Operations consultant for small business/i,
      }),
    ).toHaveAttribute("href", CONSULTANT);
    expect(
      screen.getByRole("link", {
        name: /Operations audit for small business/i,
      }),
    ).toHaveAttribute("href", AUDIT);
    expect(document.body.textContent).not.toMatch(/Six ways to start/i);

    renderPath("/guides");
    expect(
      screen.getByRole("link", {
        name: /How to stop being the bottleneck in your business/i,
      }),
    ).toHaveAttribute("href", BOTTLENECK);
  });

  it("operations consultant page covers process-consultant H2s, ICP, exclusions, and assessment CTA", () => {
    renderPath(CONSULTANT);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Operations consultant for small business/i,
      }),
    ).toBeVisible();
    const processHeadings = screen.getAllByRole("heading", {
      level: 2,
      name: /business process consultant/i,
    });
    expect(processHeadings.length).toBeGreaterThanOrEqual(2);
    const copy = document.body.textContent ?? "";
    expect(copy).toMatch(/1–50|1-50/);
    expect(copy).toMatch(/cleaning/i);
    expect(copy).toMatch(/landscaping/i);
    expect(copy).toMatch(/service/i);
    expect(copy).toMatch(/law/i);
    expect(copy).toMatch(/CPA/i);
    expect(copy).toMatch(/clinical/i);
    expect(copy).toMatch(/AI agency/i);
    expect(copy).toMatch(/fractional COO/i);
    expect(copy).not.toMatch(/\$\d/);
    expect(copy).not.toContain("\u2014");
    expect(
      document.querySelector(".ww-search-page header a.ww-button"),
    ).toHaveAttribute("href", "/assessment");
    const schema = json(CONSULTANT);
    expect(schema).toContain('"@type":"Service"');
    expect(schema).toContain("Operations consultant for small business");
    expect(schema).toContain('"@type":"FAQPage"');
    expect(schema).not.toContain("AggregateRating");
  });

  it("operations audit page contrasts complimentary Fit Review with multi-week paid audits", () => {
    renderPath(AUDIT);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Operations audit for small business/i,
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /Operations Fit Review/i,
      }),
    ).toBeVisible();
    const copy = document.body.textContent ?? "";
    expect(copy).toMatch(/complimentary/i);
    expect(copy).toMatch(/30-minute business operations review/i);
    expect(copy).toMatch(/multi-week/i);
    expect(copy).toMatch(/paid audit/i);
    expect(copy).not.toMatch(/\$\d/);
    expect(copy).not.toContain("\u2014");
    expect(
      document.querySelector(".ww-search-page header a.ww-button"),
    ).toHaveAttribute("href", "/assessment");
    const schema = json(AUDIT);
    expect(schema).toContain('"@type":"Service"');
    expect(schema).toContain("Operations audit for small business");
    expect(schema).toContain('"@type":"FAQPage"');
  });

  it("bottleneck guide uses owner nouns and points to the assessment", () => {
    renderPath(BOTTLENECK);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /How to stop being the bottleneck in your business/i,
      }),
    ).toBeVisible();
    const copy = document.body.textContent ?? "";
    expect(copy).toMatch(/intake/i);
    expect(copy).toMatch(/handoffs/i);
    expect(copy).toMatch(/quotes/i);
    expect(copy).toMatch(/admin/i);
    expect(copy).not.toMatch(/\$\d/);
    expect(copy).not.toContain("\u2014");
    expect(
      document.querySelector(".ww-search-cta a.ww-button"),
    ).toHaveAttribute("href", "/assessment");
    const schema = json(BOTTLENECK);
    expect(schema).toContain('"@type":"Article"');
    expect(schema).toContain("How to stop being the bottleneck in your business");
    expect(schema).toContain('"@type":"FAQPage"');
    expect(schema).toContain("2026-09-15");
  });

  it("sitemap lists every service and guide slug with trailing slashes", () => {
    const xml = sitemap();
    for (const service of services) {
      expect(xml).toContain(
        `<loc>https://wonderworkflow.com/services/${service.slug}/</loc>`,
      );
    }
    for (const guide of guides) {
      expect(xml).toContain(
        `<loc>https://wonderworkflow.com/guides/${guide.slug}/</loc>`,
      );
    }
  });

  it("does not change LegacyAssessment, GHL widgets, or GA4", () => {
    const index = readFileSync(join(process.cwd(), "index.html"), "utf8");
    expect(index).toContain("G-Q5FNTC3EXW");
    expect(index).toContain('data-widget-id="6aa0a1639fbeb2a2186527c7"');
    expect(ASSESSMENT_BOOKING_URL).toContain("tFmtpPmm23VC7ygrKxvK");
    expect(
      readFileSync(join(process.cwd(), "src/main.tsx"), "utf8"),
    ).toContain("LegacyAssessment");
    expect(
      readFileSync(join(process.cwd(), "scripts/prerender-entry.tsx"), "utf8"),
    ).toContain("LegacyAssessment");
  });
});
