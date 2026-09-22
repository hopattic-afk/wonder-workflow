import { describe, expect, it } from "vitest";
import { buildViewModel } from "./view";
import { runJob } from "./core/hierarchy";
import { moduleRegistry } from "./core/registry";
import { demoInputs, demoJob, samplePath } from "./demo/sample-path";

describe("view model", () => {
  it("exposes path, job, and each module's inputs, decisions, and outputs", () => {
    const runs = runJob(demoJob, demoInputs, moduleRegistry);
    const view = buildViewModel(samplePath, demoJob, demoInputs, runs);

    expect(view.pathName).toBe("Fit Review field path");
    expect(view.jobTitle).toBe("Oak Street kitchen");
    expect(view.modules.map((module) => module.name)).toEqual([
      "Leak Ranker (The Plug)",
      "Job Film / Authority Ladder",
      "Proof Gate",
      "Exception Hour (Daily Sweep)",
    ]);
    expect(view.modules[0]?.inputText).toMatch(/Quote sat six days/);
    expect(view.modules[0]?.decisionText).toMatch(/m-quote/);
    expect(view.modules[0]?.outputText).toMatch(/\$2,400/);
    expect(view.modules[2]?.decisionText).toMatch(/hold/i);
    expect(view.modules[3]?.outputText).toMatch(/ended on time/i);
  });
});
