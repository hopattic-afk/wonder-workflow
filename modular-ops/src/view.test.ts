import { describe, expect, it } from "vitest";
import { buildViewModel } from "./view";
import { runJob, setModuleEnabled } from "./core/hierarchy";
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

  it("shapes each module as an operator board from the same run", () => {
    const runs = runJob(demoJob, demoInputs, moduleRegistry);
    const view = buildViewModel(samplePath, demoJob, demoInputs, runs);
    const leak = view.modules[0]?.board;
    const film = view.modules[1]?.board;
    const gate = view.modules[2]?.board;
    const sweep = view.modules[3]?.board;

    expect(leak?.kind).toBe("leak-ranker");
    if (leak?.kind === "leak-ranker") {
      expect(leak.capture.map((row) => row.kind)).toEqual(["call", "quote", "handoff", "wait"]);
      expect(leak.rows.map((row) => row.kind)).toEqual(["quote", "handoff", "call", "wait"]);
      expect(leak.rows[0]?.note).toBe("Quote sat six days");
      expect(leak.fixFirst).toBe("Quote sat six days ($2,400)");
      expect(leak.fixNote).toBe("Quote sat six days");
      expect(leak.fixCost).toBe("$2,400");
      expect(leak.reason).toBe(
        "Fix the quote leak first. It costs 2400, more than the other misses in this log.",
      );
      expect(leak.reason).not.toContain("\u2014");
    }
    expect(film?.kind).toBe("job-film");
    if (film?.kind === "job-film") {
      expect(film.steps.find((step) => step.tone === "current")?.label).toBe("Quote");
      expect(film.steps[0]?.authority).toBe("decides alone");
    }
    expect(gate?.kind).toBe("proof-gate");
    if (gate?.kind === "proof-gate") {
      expect(gate.verdict).toBe("hold");
      expect(gate.proofs.map((proof) => proof.label)).toContain("Site photos");
    }
    expect(sweep?.kind).toBe("exception-hour");
    if (sweep?.kind === "exception-hour") {
      expect(sweep.clear).toBe(false);
      expect(sweep.assignments).toHaveLength(4);
      expect(sweep.deferred).toHaveLength(1);
      expect(sweep.closing).toBe("Ended on time.");
    }
  });

  it("keeps a disabled module off the working board", () => {
    const runs = runJob(setModuleEnabled(demoJob, "leak-ranker", false), demoInputs, moduleRegistry);
    const view = buildViewModel(samplePath, demoJob, demoInputs, runs);
    expect(view.modules[0]?.board).toEqual({
      kind: "idle",
      message: "Module disabled on this job.",
    });
  });

  it("treats an empty sweep as clear", () => {
    const view = buildViewModel(samplePath, demoJob, demoInputs, [
      {
        moduleId: "exception-hour",
        enabled: true,
        adapterId: "memory",
        status: "ran",
        decisions: {
          cadence: "daily",
          assignedIds: [],
          deferredIds: [],
          endedOnTime: true,
        },
        output: {
          cadence: "daily",
          windowMinutes: 20,
          assignments: [],
          deferred: [],
          endedOnTime: true,
        },
      },
    ]);
    expect(view.modules[0]?.board).toEqual(
      expect.objectContaining({ kind: "exception-hour", clear: true }),
    );
  });
});
