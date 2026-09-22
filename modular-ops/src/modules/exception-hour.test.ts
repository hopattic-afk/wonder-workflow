import { describe, expect, it } from "vitest";
import { exceptionHour } from "./exception-hour";
import { demoSweep } from "../demo/sample-path";

describe("Exception Hour (Daily Sweep)", () => {
  it("assigns one next action to each exception that fits and ends on time", () => {
    const { decisions, output } = exceptionHour.run(demoSweep);

    expect(decisions.cadence).toBe("daily");
    expect(output.cadence).toBe("daily");
    expect(decisions.assignedIds).toEqual([
      "ex-deposit",
      "ex-measure",
      "ex-material",
      "ex-access",
    ]);
    expect(decisions.deferredIds).toEqual(["ex-callback"]);
    expect(output.assignments).toHaveLength(4);
    expect(output.assignments.map((row) => row.nextAction)).toEqual([
      "Riley confirms the deposit note before scheduling.",
      "Sam remeasures the island before the quote moves.",
      "Jordan checks the cabinet lead time today.",
      "Avery confirms gate access before the crew rolls.",
    ]);
    expect(output.deferred[0]?.reason).toMatch(/window/i);
    expect(decisions.endedOnTime).toBe(true);
    expect(output.endedOnTime).toBe(true);
  });

  it("defers every exception when the window cannot hold one", () => {
    const { decisions, output } = exceptionHour.run({
      cadence: "daily",
      windowMinutes: 4,
      minutesPerException: 5,
      exceptions: [{ id: "ex-1", summary: "Late quote", nextAction: "Send it." }],
    });

    expect(decisions.assignedIds).toEqual([]);
    expect(decisions.deferredIds).toEqual(["ex-1"]);
    expect(output.endedOnTime).toBe(true);
  });

  it("fills a blank next action with one review action", () => {
    const { output } = exceptionHour.run({
      cadence: "daily",
      windowMinutes: 10,
      minutesPerException: 5,
      exceptions: [{ id: "ex-1", summary: "Unsigned change", nextAction: "  " }],
    });

    expect(output.assignments).toEqual([
      {
        exceptionId: "ex-1",
        summary: "Unsigned change",
        nextAction: "Review: Unsigned change",
      },
    ]);
  });
});
