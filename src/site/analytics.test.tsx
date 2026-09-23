import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Website from "./Website";

const MEASUREMENT_ID = "G-Q5FNTC3EXW";
const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

function contentSecurityPolicy(netlify: string) {
  const match = netlify.match(
    /Content-Security-Policy = "([^"]+)"/,
  );
  expect(match, "CSP header in netlify.toml").toBeTruthy();
  return match![1];
}

function directive(csp: string, name: string) {
  const match = csp.match(new RegExp(`(?:^|;)\\s*${name} ([^;]+)`));
  expect(match, `${name} directive`).toBeTruthy();
  return match![1];
}

function inlineGtagBootstrap(html: string) {
  const scripts = [...html.matchAll(/<script(\b[^>]*)>([\s\S]*?)<\/script>/gi)];
  const bootstrap = scripts.find(
    ([, attrs, body]) =>
      !/\bsrc\s*=/i.test(attrs) &&
      body.includes("dataLayer") &&
      body.includes(`gtag('config', '${MEASUREMENT_ID}')`),
  );
  expect(bootstrap, "inline gtag bootstrap in index.html").toBeTruthy();
  return bootstrap![2];
}

describe("sitewide Google Analytics 4 (gtag)", () => {
  it("installs gtag once in the shared document head", () => {
    const html = read("index.html");
    const loader =
      `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
    expect(html).toContain(`<script async src="${loader}"></script>`);
    expect(html.split(loader).length - 1).toBe(1);
    expect(html.split(MEASUREMENT_ID).length - 1).toBe(2);

    const bootstrap = inlineGtagBootstrap(html);
    expect(bootstrap).toContain("window.dataLayer = window.dataLayer || []");
    expect(bootstrap).toContain("function gtag()");
    expect(bootstrap).toContain("gtag('js', new Date())");
    expect(bootstrap).toContain(
      "/^\\/(workspace|audit|meetings|settings)(\\/|$)/.test(location.pathname)",
    );
    expect(html).toMatch(
      new RegExp(
        `<head>[\\s\\S]*${MEASUREMENT_ID}[\\s\\S]*</head>\\s*<body>`,
      ),
    );

    const prerender = read("scripts/prerender.mjs");
    expect(prerender).toContain('readFile("dist/index.html"');
    expect(read("scripts/prerender-entry.tsx")).toContain(
      'path: "/assessment"',
    );
    expect(read("src/main.tsx")).not.toMatch(/gtag|googletagmanager|G-Q5FNTC3EXW/);
  });

  it("allows Google Tag Manager and Analytics in CSP without script-src unsafe-inline", () => {
    const html = read("index.html");
    const csp = contentSecurityPolicy(read("netlify.toml"));
    const scriptSrc = directive(csp, "script-src");
    const connectSrc = directive(csp, "connect-src");
    const imgSrc = directive(csp, "img-src");
    const hash = createHash("sha256")
      .update(inlineGtagBootstrap(html))
      .digest("base64");

    expect(scriptSrc).toContain("https://widgets.leadconnectorhq.com");
    expect(scriptSrc).toContain("https://www.googletagmanager.com");
    expect(scriptSrc).toContain("https://www.google-analytics.com");
    expect(scriptSrc).not.toMatch(/'unsafe-inline'/);
    expect(scriptSrc).toContain(`'sha256-${hash}'`);

    expect(connectSrc).toContain("https://widgets.leadconnectorhq.com");
    expect(connectSrc).toContain("https://www.googletagmanager.com");
    expect(connectSrc).toContain("https://www.google-analytics.com");
    expect(connectSrc).toContain("https://analytics.google.com");
    expect(connectSrc).toContain("https://*.google-analytics.com");
    expect(connectSrc).toContain("https://*.analytics.google.com");

    expect(imgSrc).toContain("https://www.google-analytics.com");
    expect(imgSrc).toContain("https://*.google-analytics.com");
    expect(imgSrc).toContain("https://www.googletagmanager.com");

    expect(read("index.html")).not.toMatch(/http-equiv=["']Content-Security-Policy/i);
  });

  it("allows Lead Connector services host for Website Chat without loosening script-src", () => {
    const csp = contentSecurityPolicy(read("netlify.toml"));
    const connectSrc = directive(csp, "connect-src");
    const frameSrc = directive(csp, "frame-src");
    const scriptSrc = directive(csp, "script-src");
    const defaultSrc = directive(csp, "default-src");

    expect(connectSrc).toContain("https://services.leadconnectorhq.com");
    expect(frameSrc).toContain("https://services.leadconnectorhq.com");
    expect(scriptSrc).not.toContain("https://services.leadconnectorhq.com");
    expect(scriptSrc).not.toMatch(/unsafe-eval/);
    expect(defaultSrc.trim()).toBe("'self'");
  });

  it("allows the Website Chat avatar image host without widening script or connect", () => {
    const csp = contentSecurityPolicy(read("netlify.toml"));
    const imgSrc = directive(csp, "img-src");
    const scriptSrc = directive(csp, "script-src");
    const connectSrc = directive(csp, "connect-src");
    const avatarHost = "https://assets.cdn.filesafe.space";

    expect(imgSrc).toContain(avatarHost);
    expect(imgSrc).toContain("https://widgets.leadconnectorhq.com");
    expect(imgSrc).toContain("https://api.leadconnectorhq.com");
    expect(scriptSrc).not.toContain("filesafe.space");
    expect(connectSrc).not.toContain("filesafe.space");
    expect(read("index.html")).toContain(
      'data-widget-id="6aad8507aaad87c6c4b513a1"',
    );
  });

  it("discloses Google Analytics on the privacy page without em dashes", () => {
    render(
      <MemoryRouter initialEntries={["/privacy"]}>
        <Website />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { name: "Website analytics" }),
    ).toBeVisible();
    expect(
      screen.getByText(
        /This website uses Google Analytics to measure visits to public pages\./,
      ),
    ).toBeVisible();
    expect(document.body.textContent).not.toContain("\u2014");
  });
});
