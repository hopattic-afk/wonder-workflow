import { describe, expect, it } from "vitest";
import { jobFilm } from "./job-film";
import { demoFilm } from "../demo/sample-path";

describe("Job Film / Authority Ladder", () => {
  it("shows one live job as a step sequence with one accountable name", () => {
    const { decisions, output } = jobFilm.run(demoFilm);

    expect(output.jobTitle).toBe("Oak Street kitchen");
    expect(output.sequence.map((step) => step.accountable)).toEqual([
      "Sam Reed",
      "Riley Chen",
      "Jordan Hale",
      "Avery Brooks",
    ]);
    expect(output.sequence.map((step) => step.order)).toEqual([1, 2, 3, 4]);
    expect(decisions.currentStepId).toBe("quote");
    expect(decisions.decideAloneIds).toEqual(["measure", "schedule"]);
    expect(decisions.mustCheckUpIds).toEqual(["quote", "walkthrough"]);
    expect(decisions.problems).toEqual([]);
  });

  it("flags a step that does not have exactly one accountable name", () => {
    const { decisions } = jobFilm.run({
      jobTitle: "Oak Street kitchen",
      steps: [
        {
          id: "measure",
          label: "Measure",
          accountable: "  ",
          authority: "decide-alone",
          status: "current",
        },
      ],
    });

    expect(decisions.problems).toEqual([
      "Step “Measure” needs exactly one accountable name.",
    ]);
    expect(decisions.currentStepId).toBe("measure");
  });
});
