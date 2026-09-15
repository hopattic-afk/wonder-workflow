import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeAll, describe, expect, it } from "vitest";
import { LegacyAssessment } from "../pages/Assessment";
import { ASSESSMENT_BOOKING_URL } from "../domain/assessment";
import Website, { pages } from "./Website";

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

const ICP_INDUSTRIES = [
  "cleaning",
  "landscaping",
  "detailing",
  "signs",
  "print",
  "restoration",
  "moving",
  "fitness",
  "coffee",
  "pet services",
];

describe("Remy public messaging: Operations Fit Review", () => {
  beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: true,
        media: query,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
        dispatchEvent() {
          return false;
        },
      }),
    });
    class FakeIntersectionObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    Object.defineProperty(window, "IntersectionObserver", {
      writable: true,
      value: FakeIntersectionObserver,
    });
  });

  it("names the offer Operations Fit Review on home, start, book, contact, services, and assessment chrome", () => {
    renderPath("/");
    expect(screen.getAllByText(/Operations Fit Review/).length).toBeGreaterThan(
      0,
    );
    expect(document.body.textContent).not.toMatch(/Workflow Fit Review/);
    expect(document.body.textContent).toMatch(
      /30-minute business operations review/i,
    );

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
    expect(document.body.textContent).not.toMatch(/Workflow Fit Review/);

    renderPath("/services");
    expect(
      screen.getByRole("heading", { name: "Operations Fit Review" }),
    ).toBeVisible();
    expect(document.body.textContent).not.toMatch(/Workflow Fit Review/);

    const assessment = render(<LegacyAssessment />);
    expect(
      assessment.container.querySelector(
        '[aria-label="Operations Fit Review (opens in a new tab)"]',
      ),
    ).toHaveTextContent("Operations Fit Review");
    expect(assessment.container.textContent).not.toMatch(/Workflow Fit Review/);
  });

  it("states 1-50 field and service ICP on the homepage and excludes law, CPA, and clinical work", () => {
    renderPath("/");
    const home = document.body.textContent ?? "";
    expect(home).toMatch(/1-50/);
    for (const industry of ICP_INDUSTRIES) {
      expect(home.toLowerCase()).toContain(industry);
    }
    expect(home).toMatch(/law/i);
    expect(home).toMatch(/CPA/);
    expect(home).toMatch(/clinical/i);
    expect(home).toMatch(/Not a fit/i);
  });

  it("leads homepage hero and section headers with owner nouns, not workflow jargon", () => {
    renderPath("/");
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /When everything still\s+falls on you/i,
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: /When the day still lives in group texts/i,
      }),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: /Missed calls/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /Quotes waiting/i })).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: /One real path of work/i,
      }),
    ).toBeVisible();
    const hero = document.querySelector(".ww-hero")?.textContent ?? "";
    expect(hero.toLowerCase()).not.toMatch(/^[^]*workflow fit review/);
  });

  it("states tool-agnostic diagnosis and that another tool may not be needed", () => {
    renderPath("/");
    expect(
      screen.getByRole("heading", { name: /You may not need another tool/i }),
    ).toBeVisible();
    expect(document.body.textContent).toMatch(
      /diagnoses structure and ownership/i,
    );
  });

  it("shows the next-step ladder as structure only, with no published dollar fees", () => {
    renderPath("/");
    expect(document.body.textContent).toMatch(/Ops Audit or Systems Assessment/);
    expect(document.body.textContent).toMatch(/Implementation/);
    expect(document.body.textContent).toMatch(/Optional support/i);
    expect(document.body.textContent).toMatch(
      /Software and vendor costs stay separate/i,
    );
    expect(document.body.textContent).not.toMatch(/\$\d/);
    expect(document.body.textContent).not.toContain("\u2014");

    renderPath("/services");
    expect(
      screen.getByRole("heading", { name: "Ops Audit or Systems Assessment" }),
    ).toBeVisible();
    expect(document.body.textContent).not.toMatch(/\$\d/);
  });

  it("aligns assessment and booking copy to one real path of work and one improvement", () => {
    renderPath("/start");
    expect(document.body.textContent).toMatch(/one real path of work/i);
    expect(document.body.textContent).toMatch(/one improvement/i);

    const html = read("src/pages/Assessment.tsx");
    expect(html).toContain("ONE_PATH_COPY");
    expect(html).toContain("BOOKING_IFRAME_TITLE");
    expect(html).toContain("ASSESSMENT_BOOKING_URL");
    expect(read("src/domain/assessment.ts")).toContain(ASSESSMENT_BOOKING_URL);
    expect(read("src/site/publicOffer.ts")).toMatch(/one real path of work/i);
    expect(read("src/site/publicOffer.ts")).toMatch(/pick one improvement/i);
    expect(read("src/site/publicOffer.ts")).toContain(
      "Book your complimentary 30-minute Operations Fit Review",
    );
  });

  it("places honest proof slots and next-step transparency near primary CTAs", () => {
    renderPath("/");
    expect(screen.getByRole("heading", { name: /Shops like yours/i })).toBeVisible();
    expect(document.body.textContent).toMatch(
      /will not invent testimonials or metrics/i,
    );
    expect(
      screen.getByRole("link", { name: /Read the implementation study/i }),
    ).toHaveAttribute("href", "/case-studies/operations-assessment");
    expect(document.body.textContent).toMatch(
      /complimentary Operations Fit Review/i,
    );
    expect(
      screen.getAllByRole("link", { name: /Assess your operations/i })[0],
    ).toHaveAttribute("href", "/assessment");
  });

  it("keeps GHL widget IDs, GA4, LegacyAssessment, and CRM flags untouched", () => {
    const index = read("index.html");
    expect(index).toContain("G-Q5FNTC3EXW");
    expect(index).toContain('data-widget-id="6aa0a1639fbeb2a2186527c7"');
    expect(read("src/domain/assessment.ts")).toContain(
      "https://api.leadconnectorhq.com/widget/booking/tFmtpPmm23VC7ygrKxvK",
    );
    expect(read("src/main.tsx")).toContain("LegacyAssessment");
    expect(read("scripts/prerender-entry.tsx")).toContain("LegacyAssessment");
    expect(read("server/config.ts")).toMatch(
      /Never force WW_CRM_SYNC_ENABLED/,
    );
  });

  it("does not invent dollar fees or em dashes in customer-facing offer copy", () => {
    for (const path of PUBLIC_COPY_FILES) {
      const source = read(path);
      expect(source, path).not.toMatch(/\$\d/);
      expect(source, path).not.toContain("Workflow Fit Review");
    }
    expect(pages["/"][0]).toBe("When work still falls on you");
    expect(pages["/"][1]).toMatch(/Operations Fit Review/);
    expect(pages["/"][0] + pages["/"][1]).not.toContain("\u2014");
    expect(pages["/start"][1]).toMatch(/Operations Fit Review/);
    expect(pages["/contact"][1]).toMatch(/Operations Fit Review|operations/i);
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
