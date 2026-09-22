import { describe, expect, it } from "vitest";
import { adapters } from "./adapters";
import {
  runJob,
  setModuleEnabled,
  swapAdapter,
} from "./hierarchy";
import { moduleRegistry } from "./registry";
import { leakRanker } from "../modules/leak-ranker";
import {
  demoInputs,
  demoJob,
  samplePath,
} from "../demo/sample-path";

describe("path → job → modules", () => {
  it("wires the demo path to one job and the four locked modules", () => {
    expect(samplePath.name).toBe("Fit Review field path");
    expect(samplePath.jobs).toHaveLength(1);
    expect(samplePath.jobs[0]).toEqual(demoJob);
    expect(demoJob.modules.map((slot) => slot.moduleId)).toEqual([
      "leak-ranker",
      "job-film",
      "proof-gate",
      "exception-hour",
    ]);
    expect(demoJob.modules.every((slot) => slot.enabled)).toBe(true);
    expect(demoJob.modules.every((slot) => slot.adapterId === "memory")).toBe(
      true,
    );
  });

  it("runs enabled memory modules and leaves the job identity in place", () => {
    const runs = runJob(demoJob, demoInputs, moduleRegistry);

    expect(runs.map((run) => run.moduleId)).toEqual([
      "leak-ranker",
      "job-film",
      "proof-gate",
      "exception-hour",
    ]);
    expect(runs.every((run) => run.status === "ran")).toBe(true);
    expect(runs[0]?.decisions).toMatchObject({ fixFirstId: "m-quote" });
    expect(runs[2]?.output).toMatchObject({ status: "hold" });
    expect(runs[3]?.output).toMatchObject({ endedOnTime: true, cadence: "daily" });
  });

  it("disables one module without rewriting the other three", () => {
    const bent = setModuleEnabled(demoJob, "leak-ranker", false);
    const runs = runJob(bent, demoInputs, moduleRegistry);

    expect(bent.id).toBe(demoJob.id);
    expect(bent.modules.map((slot) => slot.moduleId)).toEqual(
      demoJob.modules.map((slot) => slot.moduleId),
    );
    expect(runs[0]).toMatchObject({
      moduleId: "leak-ranker",
      status: "skipped",
      enabled: false,
    });
    expect(runs[0]?.output).toBeUndefined();
    expect(runs.slice(1).every((run) => run.status === "ran")).toBe(true);
    expect(demoJob.modules[0]?.enabled).toBe(true);
  });

  it("swaps a module adapter without changing hierarchy order", () => {
    const bent = swapAdapter(demoJob, "proof-gate", "ghl");
    const runs = runJob(bent, demoInputs, moduleRegistry);

    expect(bent.modules.map((slot) => slot.moduleId)).toEqual([
      "leak-ranker",
      "job-film",
      "proof-gate",
      "exception-hour",
    ]);
    expect(runs[2]).toMatchObject({
      moduleId: "proof-gate",
      adapterId: "ghl",
      status: "adapter-unavailable",
    });
    expect(runs[2]?.note).toMatch(/stub/i);
    expect(runs[0]?.status).toBe("ran");
    expect(runs[1]?.status).toBe("ran");
    expect(runs[3]?.status).toBe("ran");
  });

  it("keeps Sheets and GHL as unavailable stub adapters", () => {
    expect(adapters.memory.available).toBe(true);
    expect(adapters.sheets.available).toBe(false);
    expect(adapters.ghl.available).toBe(false);
    expect(adapters.sheets.note).toMatch(/stub/i);
    expect(adapters.ghl.note).toMatch(/stub/i);
  });

  it("survives replacing Leak Ranker without changing Job Film output", () => {
    const baseline = runJob(demoJob, demoInputs, moduleRegistry);
    const bentRegistry = {
      ...moduleRegistry,
      "leak-ranker": {
        ...leakRanker,
        run: () => ({
          decisions: {
            fixFirstId: "bent",
            rankedIds: ["bent"],
            reason: "Bent module.",
          },
          output: { ranking: [], fixFirst: null },
        }),
      },
    };
    const bent = runJob(demoJob, demoInputs, bentRegistry);

    expect(bent.find((run) => run.moduleId === "leak-ranker")?.decisions).toMatchObject({
      fixFirstId: "bent",
    });
    expect(bent.find((run) => run.moduleId === "job-film")?.output).toEqual(
      baseline.find((run) => run.moduleId === "job-film")?.output,
    );
  });
});
