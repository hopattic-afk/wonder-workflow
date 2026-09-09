import { useState } from "react";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { Worksheet } from "./Worksheet";
import { newSession, newStep, newSoftware } from "../domain/defaults";
import { sessionSchema } from "../domain/validation";
import type { Session } from "../domain/types";

function setup(initial = newSession()) {
  let latest = initial;
  function Harness() {
    const [session, setSession] = useState(initial);
    return (
      <MemoryRouter>
        <Worksheet
          session={session}
          onChange={(next) => {
            latest = next;
            setSession(next);
          }}
        />
      </MemoryRouter>
    );
  }
  render(<Harness />);
  return { getSession: () => latest };
}
function go(name: string) {
  fireEvent.click(
    within(
      screen.getByRole("navigation", { name: "Worksheet sections" }),
    ).getByRole("button", { name: new RegExp(name) }),
  );
}

describe("short call worksheet", () => {
  it("shows five sections and keeps detailed client questions optional", () => {
    setup();
    expect(
      within(
        screen.getByRole("navigation", { name: "Worksheet sections" }),
      ).getAllByRole("button"),
    ).toHaveLength(5);
    expect(screen.getByLabelText("Business name")).toBeVisible();
    expect(
      screen.getByLabelText("What would you like to improve?"),
    ).toBeVisible();
    expect(screen.getByLabelText("Annual revenue band")).not.toBeVisible();
    expect(
      screen.getByLabelText("AI Operations Score (0–21)"),
    ).not.toBeVisible();
    fireEvent.click(
      screen.getByText("Assessment score & referral details", { exact: true }),
    );
    expect(screen.getByLabelText("AI Operations Score (0–21)")).toBeVisible();
    go("Wrap-up");
    expect(screen.getByLabelText("Process repeatability")).not.toBeVisible();
    fireEvent.click(
      screen.getByText("After the call: internal assessment", { exact: true }),
    );
    expect(screen.getByLabelText("Process repeatability")).toBeVisible();
  });
  it("retains saved detailed fields when editing the short form and changing sections", () => {
    const original = newSession();
    original.client.score = 21;
    original.client.revenue = "$1M–$2.9M";
    original.worksheet.department = "Operations";
    original.worksheet.rationale = "Private saved rationale";
    original.steps = [
      { ...newStep(), name: "Receive notes", input: "Keep this step detail" },
    ];
    original.software = [
      {
        ...newSoftware(),
        name: "Existing tool",
        futureMonthly: 100,
        integration: "Export available",
      },
    ];
    const { getSession } = setup(original);
    fireEvent.change(screen.getByLabelText("What would you like to improve?"), {
      target: { value: "Less repetitive work" },
    });
    go("Walk through the work");
    fireEvent.change(screen.getByLabelText("Step name"), {
      target: { value: "Receive updated notes" },
    });
    go("Time & tools");
    fireEvent.change(screen.getByLabelText("Software name"), {
      target: { value: "Updated tool name" },
    });
    const expected = structuredClone(original);
    expected.worksheet.reason = "Less repetitive work";
    expected.steps[0].name = "Receive updated notes";
    expected.software[0].name = "Updated tool name";
    expect(getSession()).toEqual(expected);
    expect(sessionSchema.safeParse(getSession()).success).toBe(true);
  });
  it("explains future AI possibilities, retains advanced selections, and keeps risk warnings visible", () => {
    const original = newSession();
    original.worksheet.classifications = [
      "AI-assisted software synchronization",
    ];
    const { getSession } = setup(original);
    go("AI possibilities & review");
    expect(screen.getByText("possible future uses")).toBeVisible();
    fireEvent.click(screen.getByLabelText("Draft routine reports"));
    expect(getSession().worksheet.classifications).toEqual([
      "AI-assisted software synchronization",
      "AI report drafting",
    ]);
    expect(
      screen.getByLabelText("Keep information in different tools in sync"),
    ).not.toBeVisible();
    fireEvent.click(screen.getByLabelText("Money or financial decisions"));
    go("Wrap-up");
    expect(
      screen.getByText(
        "Consequential outputs require a qualified human-review step and agreed controls.",
      ),
    ).toBeVisible();
    expect(getSession().worksheet.classifications).toContain(
      "AI report drafting",
    );
  });
});
