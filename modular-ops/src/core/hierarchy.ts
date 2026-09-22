import { adapters } from "./adapters";
import type { ModuleInputs, ModuleRegistry } from "./registry";
import type { AdapterId, JobObject, ModuleId, ModuleRun } from "./types";

function runModule(
  moduleId: ModuleId,
  inputs: ModuleInputs,
  registry: ModuleRegistry,
): { decisions: unknown; output: unknown } {
  switch (moduleId) {
    case "leak-ranker":
      return registry["leak-ranker"].run(inputs["leak-ranker"]);
    case "job-film":
      return registry["job-film"].run(inputs["job-film"]);
    case "proof-gate":
      return registry["proof-gate"].run(inputs["proof-gate"]);
    case "exception-hour":
      return registry["exception-hour"].run(inputs["exception-hour"]);
  }
}

export function setModuleEnabled(
  job: JobObject,
  moduleId: ModuleId,
  enabled: boolean,
): JobObject {
  return {
    ...job,
    modules: job.modules.map((slot) =>
      slot.moduleId === moduleId ? { ...slot, enabled } : slot,
    ),
  };
}

export function swapAdapter(
  job: JobObject,
  moduleId: ModuleId,
  adapterId: AdapterId,
): JobObject {
  return {
    ...job,
    modules: job.modules.map((slot) =>
      slot.moduleId === moduleId ? { ...slot, adapterId } : slot,
    ),
  };
}

/**
 * Walks the job's module slots in order.
 * Enabling, disabling, or swapping an adapter does not reorder the path or the job.
 */
export function runJob(
  job: JobObject,
  inputs: ModuleInputs,
  registry: ModuleRegistry,
): ModuleRun[] {
  return job.modules.map((slot) => {
    if (!slot.enabled) {
      return {
        moduleId: slot.moduleId,
        enabled: false,
        adapterId: slot.adapterId,
        status: "skipped",
        note: "Module disabled on this job.",
      };
    }
    const adapter = adapters[slot.adapterId];
    if (!adapter.available) {
      return {
        moduleId: slot.moduleId,
        enabled: true,
        adapterId: slot.adapterId,
        status: "adapter-unavailable",
        note: adapter.note,
      };
    }
    const result = runModule(slot.moduleId, inputs, registry);
    return {
      moduleId: slot.moduleId,
      enabled: true,
      adapterId: slot.adapterId,
      status: "ran",
      decisions: result.decisions,
      output: result.output,
    };
  });
}
