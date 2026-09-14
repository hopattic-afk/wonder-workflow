import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import Website, { FIT_REVIEW_MAILTO } from "./Website";

function renderPath(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Website />
    </MemoryRouter>,
  );
}

describe("Phase A email-first Fit Review funnel", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: true,
        media: query,
        addEventListener() {},
        removeEventListener() {},
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
  it("public assessment route lazy-loads Assessment and keeps LegacyAssessment in source", () => {
    const main = readFileSync(join(process.cwd(), "src/main.tsx"), "utf8");
    const assessment = readFileSync(
      join(process.cwd(), "src/pages/Assessment.tsx"),
      "utf8",
    );
    expect(main).toContain("default: module.Assessment");
    expect(main).not.toContain("module.LegacyAssessment");
    expect(assessment).toContain("export function LegacyAssessment()");
  });

  it.each(["/start", "/book"])(
    "%s uses email-first Fit Review language and the prepared mailto",
    (path) => {
      const { container } = renderPath(path);
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Request a Workflow Fit Review",
        }),
      ).toBeVisible();
      expect(
        screen.getByRole("link", { name: /Email to request Fit Review/ }),
      ).toHaveAttribute("href", FIT_REVIEW_MAILTO);
      expect(
        within(container.querySelector(".ww-start-simple") as HTMLElement).getByRole(
          "link",
          { name: "Contact" },
        ),
      ).toHaveAttribute("href", "/contact");
      expect(container.textContent).not.toMatch(
        /assessment is saved|embedded calendar/i,
      );
    },
  );

  it("contact offers the Fit Review mailto without replacing the general inbox link", () => {
    const { container } = renderPath("/contact");
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Request a Workflow Fit Review",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Email operations@wonderworkflow.com" }),
    ).toHaveAttribute("href", FIT_REVIEW_MAILTO);
    expect(
      screen.getByText("No contact form is required. Ian monitors this address."),
    ).toBeVisible();
    expect(
      [...container.querySelectorAll('.ww-prose a[href="mailto:operations@wonderworkflow.com"]')].some(
        (link) => link.textContent === "operations@wonderworkflow.com",
      ),
    ).toBe(true);
  });

  it("keeps the footer inbox mailto without a Fit Review subject", () => {
    renderPath("/contact");
    const footer = screen.getByRole("contentinfo");
    expect(
      footer.querySelector('a[href="mailto:operations@wonderworkflow.com"]'),
    ).toHaveTextContent("operations@wonderworkflow.com");
    expect(
      footer.querySelector(`a[href="${FIT_REVIEW_MAILTO}"]`),
    ).toBeNull();
  });

  it("home invitation keeps Assess as primary and adds an email Fit Review link", () => {
    renderPath("/");
    const invitation = screen
      .getByRole("heading", {
        name: "Find where your operations could improve.",
      })
      .closest("section");
    expect(invitation).not.toBeNull();
    expect(
      invitation!.querySelector('a[href="/assessment"]'),
    ).toHaveTextContent(/Assess your operations/);
    expect(
      invitation!.querySelector(`a[href="${FIT_REVIEW_MAILTO}"]`),
    ).toHaveTextContent(/Request a Fit Review by email/);
  });
});
