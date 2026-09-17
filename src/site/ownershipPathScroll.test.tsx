import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { OwnershipPathScroll } from "./OwnershipPathScroll";

/** Reed polished microcopy 2026-09-17 — must appear when chapter renders. */
const REED_COPY = [
  "Different people. Different versions of the truth.",
  "Office, crew, and owner each hold their own slice. Nobody knows who owns the next step, so work waits and everyone feels the drag.",
  "We name who owns the next step.",
  "The stuck point gets named out loud. One handoff gets a clear next owner. You can see it, not guess it.",
  "One clear path of work.",
  "Roles sit on a single path and the handoffs stick. The fix is who owns what, not another pile of tools.",
  "The Fit Review is a complimentary 30-minute business operations review. You bring what is actually breaking. We build the fix around how your work really runs.",
] as const;

describe("OwnershipPathScroll", () => {
  it("renders Reed polished Stuck beat copy, bridge, and Assess CTA", () => {
    render(
      <MemoryRouter>
        <OwnershipPathScroll />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Different people. Different versions of the truth.",
      }),
    ).toBeVisible();
    expect(screen.getByText(REED_COPY[1])).toBeVisible();
    expect(screen.getByText(REED_COPY[6])).toBeVisible();

    const assess = screen.getByRole("link", {
      name: /Assess your operations/i,
    });
    expect(assess).toHaveAttribute("href", "/assessment");
    expect(document.body.textContent).not.toContain("\u2014");

    const imgs = Array.from(document.querySelectorAll("img")).map(
      (img) => img.getAttribute("src") ?? "",
    );
    expect(imgs.some((s) => s.includes("role-tile-office.svg"))).toBe(true);
    expect(imgs.some((s) => s.includes("role-tile-crew.svg"))).toBe(true);
    expect(imgs.some((s) => s.includes("role-tile-owner.svg"))).toBe(true);
    expect(imgs.some((s) => s.includes("vignette-hospitality"))).toBe(false);
  });

  it("keeps all Reed Stuck / Named / Moving strings in the chapter source", () => {
    const source = readFileSync(
      join(process.cwd(), "src/site/OwnershipPathScroll.tsx"),
      "utf8",
    );
    for (const phrase of REED_COPY) {
      expect(source).toContain(phrase);
    }
    expect(source).toContain("Beat 01 · Stuck");
    expect(source).toContain("Beat 02 · Named");
    expect(source).toContain("Beat 03 · Moving");
    expect(source).not.toContain("role-tile-kitchen");
    expect(source).not.toContain("role-tile-bar");
  });
});
