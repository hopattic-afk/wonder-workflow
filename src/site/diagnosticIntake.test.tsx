import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Website, { pages } from "./Website";
import {
  DIAGNOSTIC_EMBED_SCRIPT,
  DIAGNOSTIC_FORM_ID,
  DIAGNOSTIC_FORM_NAME,
  DIAGNOSTIC_FORM_SRC,
  DIAGNOSTIC_IFRAME_ID,
  DIAGNOSTIC_INTAKE_PATH,
} from "./diagnosticForm";

function renderPath(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Website />
    </MemoryRouter>,
  );
}

function directive(csp: string, name: string) {
  const match = csp.match(new RegExp(`(?:^|;)\\s*${name} ([^;]+)`));
  expect(match, `${name} directive`).toBeTruthy();
  return match![1];
}

describe("main navigation", () => {
  it("lists Home first and keeps the wordmark pointed at /", () => {
    for (const path of ["/", "/services", "/request-diagnostic/"]) {
      const { unmount } = renderPath(path);
      const nav = screen.getByRole("navigation", { name: "Main navigation" });
      const [home] = within(nav).getAllByRole("link");
      expect(home).toHaveTextContent(/^Home$/);
      expect(home).toHaveAttribute("href", "/");
      expect(
        screen.getByRole("link", { name: "Wonder & Workflow home" }),
      ).toHaveAttribute("href", "/");
      if (path === "/") {
        expect(home).toHaveAttribute("aria-current", "page");
      } else {
        expect(home).not.toHaveAttribute("aria-current");
      }
      if (path.startsWith("/request-diagnostic")) {
        expect(document.querySelector(".ww-header-assess")).toBeNull();
        expect(
          within(nav).queryByRole("link", { name: /Assess your operations/i }),
        ).toBeNull();
        expect(screen.queryByRole("link", { name: /^Assess$/ })).toBeNull();
      }
      unmount();
    }
  });
});

describe("diagnostic short intake", () => {
  it("sends Request a diagnostic to the intake and leaves Assess CTAs on the assessment", () => {
    renderPath("/services");
    expect(
      screen.getByRole("link", { name: "Request a diagnostic" }),
    ).toHaveAttribute("href", DIAGNOSTIC_INTAKE_PATH);
    const assess = screen.getAllByRole("link", {
      name: /Assess your operations/i,
    });
    expect(assess.length).toBeGreaterThan(0);
    for (const link of assess) {
      expect(link).toHaveAttribute("href", "/assessment");
    }
    expect(
      screen.getByRole("link", { name: /Scope the first improvement/i }),
    ).toHaveAttribute("href", "/start");
    expect(
      screen.getByRole("link", { name: /^Assess$/ }),
    ).toHaveAttribute("href", "/assessment");
  });

  it("keeps the diagnostic form as the only primary action", () => {
    for (const path of ["/request-diagnostic", "/request-diagnostic/"]) {
      const { unmount } = renderPath(path);
      expect(document.querySelector(".ww-header-assess")).toBeNull();
      expect(screen.queryByRole("link", { name: /^Assess$/ })).toBeNull();
      expect(
        screen.queryByRole("link", { name: /Assess your operations/i }),
      ).toBeNull();
      expect(
        screen.queryByRole("link", { name: /Book a Fit Review/i }),
      ).toBeNull();
      expect(document.getElementById(DIAGNOSTIC_IFRAME_ID)).toHaveAttribute(
        "src",
        DIAGNOSTIC_FORM_SRC,
      );
      expect(document.getElementById(DIAGNOSTIC_IFRAME_ID)).toHaveAttribute(
        "data-form-id",
        DIAGNOSTIC_FORM_ID,
      );
      unmount();
    }

    const home = renderPath("/");
    expect(document.querySelector(".ww-header-assess")).toBeTruthy();
    expect(screen.getByRole("link", { name: /^Assess$/ })).toHaveAttribute(
      "href",
      "/assessment",
    );
    expect(
      screen.getByRole("link", { name: /Book a Fit Review/i }),
    ).toHaveAttribute("href", "/assessment");
    home.unmount();

    renderPath("/services");
    expect(document.querySelector(".ww-header-assess")).toHaveClass("is-glow");
    expect(
      within(
        screen.getByRole("navigation", { name: "Main navigation" }),
      ).getByRole("link", { name: /Assess your operations/i }),
    ).toHaveAttribute("href", "/assessment");
    expect(
      within(screen.getByRole("contentinfo")).getByRole("link", {
        name: /Assess your operations/i,
      }),
    ).toHaveAttribute("href", "/assessment");
  });

  it("embeds the HighLevel short intake on the trailing-slash route", () => {
    for (const path of ["/request-diagnostic", "/request-diagnostic/"]) {
      const { unmount } = renderPath(path);
      expect(
        screen.getByRole("heading", { level: 1, name: "Request a diagnostic" }),
      ).toBeVisible();
      expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
      expect(
        document.querySelector(".ww-diagnostic")?.textContent?.replace(/\s+/g, " ").trim(),
      ).toBe("Request a diagnostic");
      expect(screen.getByRole("banner")).toBeVisible();
      expect(screen.getByRole("contentinfo")).toBeVisible();
      const frame = document.getElementById(DIAGNOSTIC_IFRAME_ID);
      expect(frame).toHaveAttribute("src", DIAGNOSTIC_FORM_SRC);
      expect(frame).toHaveAttribute("title", DIAGNOSTIC_FORM_NAME);
      expect(frame).toHaveAttribute("data-form-id", DIAGNOSTIC_FORM_ID);
      expect(frame).toHaveAttribute("data-layout", "{'id':'INLINE'}");
      expect(frame).toHaveAttribute("data-trigger-type", "alwaysShow");
      expect(frame).toHaveAttribute("data-activation-type", "alwaysActivated");
      expect(frame).toHaveAttribute("data-deactivation-type", "neverDeactivate");
      expect(frame).toHaveAttribute("data-form-name", DIAGNOSTIC_FORM_NAME);
      expect(frame).toHaveAttribute("data-cookie-consent", "true");
      expect(
        document.querySelector(`script[src="${DIAGNOSTIC_EMBED_SCRIPT}"]`),
      ).toBeTruthy();
      expect(
        document.querySelector('link[rel="canonical"]'),
      ).toHaveAttribute(
        "href",
        "https://wonderworkflow.com/request-diagnostic/",
      );
      expect(document.body.textContent).not.toContain("\u2014");
      expect(document.body.textContent).not.toMatch(/\$\d/);
      expect(document.body.textContent).not.toMatch(/\/assessment/);
      unmount();
    }
  });

  it("registers trailing-slash metadata without pricing or an assessment redirect", () => {
    expect(pages["/request-diagnostic"]?.[0]).toBe("Request a diagnostic");
    expect(pages["/request-diagnostic"]?.[1]).toBe("Request a diagnostic");
    expect(pages["/request-diagnostic"]?.[1]).not.toMatch(/\$\d/);
    expect(pages["/request-diagnostic"]?.[1]).not.toContain("\u2014");
    const css = readFileSync(join(process.cwd(), "src/site/website.css"), "utf8");
    expect(css).toMatch(/--ww-paper:\s*#fafaf8/i);
    expect(css).toMatch(/--ww-ink:\s*#20232b/i);
    expect(css).toMatch(/--ww-accent:\s*#7ba1af/i);
    expect(css).toMatch(/\.ww-diagnostic-embed[\s\S]*min-height:\s*760px/);
    expect(css).toMatch(/\.ww-diagnostic[\s\S]*var\(--ww-paper\)/);
    expect(css).toMatch(/\.ww-diagnostic-embed[\s\S]*var\(--ww-accent\)/);
    const sitemap = readFileSync(
      join(process.cwd(), "public/sitemap.xml"),
      "utf8",
    );
    expect(sitemap).toContain(
      "<loc>https://wonderworkflow.com/request-diagnostic/</loc>",
    );
    expect(sitemap).not.toContain(
      "<loc>https://wonderworkflow.com/request-diagnostic</loc>",
    );
    const llms = readFileSync(join(process.cwd(), "public/llms.txt"), "utf8");
    expect(llms).toContain("https://wonderworkflow.com/assessment");
    expect(llms).not.toContain("/request-diagnostic");
    expect(llms).toBe(
      readFileSync(join(process.cwd(), "public/.well-known/llms.txt"), "utf8"),
    );
  });

  it("allows the form embed host in script-src and frame-src only", () => {
    const netlify = readFileSync(join(process.cwd(), "netlify.toml"), "utf8");
    const match = netlify.match(/Content-Security-Policy = "([^"]+)"/);
    expect(match, "CSP header").toBeTruthy();
    const csp = match![1];
    const scriptSrc = directive(csp, "script-src");
    const frameSrc = directive(csp, "frame-src");
    const connectSrc = directive(csp, "connect-src");
    const imgSrc = directive(csp, "img-src");
    const host = "https://api.wonderworkflow.com";

    expect(scriptSrc).toContain(host);
    expect(frameSrc).toContain(host);
    expect(connectSrc).not.toContain(host);
    expect(imgSrc).not.toContain(host);
    expect(scriptSrc).not.toMatch(/unsafe-inline|unsafe-eval/);

    expect(scriptSrc).toContain("https://widgets.leadconnectorhq.com");
    expect(frameSrc).toContain("https://widgets.leadconnectorhq.com");
    expect(frameSrc).toContain("https://api.leadconnectorhq.com");
    expect(frameSrc).toContain("https://services.leadconnectorhq.com");
    expect(connectSrc).toContain("https://services.leadconnectorhq.com");
    expect(connectSrc).toContain("https://api.leadconnectorhq.com");
    expect(imgSrc).toContain("https://api.leadconnectorhq.com");
    expect(imgSrc).toContain("https://assets.cdn.filesafe.space");

    expect(readFileSync(join(process.cwd(), "index.html"), "utf8")).toContain(
      'data-widget-id="6aad8507aaad87c6c4b513a1"',
    );
  });
});
