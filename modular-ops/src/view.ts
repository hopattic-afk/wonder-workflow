import type { ModuleInputs } from "./core/registry";
import type { JobObject, ModuleId, ModuleRun, OpsPath } from "./core/types";
import { moduleRegistry } from "./core/registry";
import type { ExceptionHourDecision, ExceptionHourOutput } from "./modules/exception-hour";
import type { JobFilmDecision, JobFilmOutput } from "./modules/job-film";
import type { LeakRankerDecision, LeakRankerOutput } from "./modules/leak-ranker";
import type { ProofGateDecision } from "./modules/proof-gate";

export interface ModuleView {
  id: ModuleId;
  name: string;
  oneLiner: string;
  enabled: boolean;
  adapterId: string;
  status: ModuleRun["status"];
  note: string;
  inputText: string;
  decisionText: string;
  outputText: string;
}

export interface OpsViewModel {
  pathName: string;
  jobTitle: string;
  modules: ModuleView[];
}

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function buildViewModel(
  path: OpsPath,
  job: JobObject,
  inputs: ModuleInputs,
  runs: ModuleRun[],
): OpsViewModel {
  return {
    pathName: path.name,
    jobTitle: job.title,
    modules: runs.map((run) => {
      const definition = moduleRegistry[run.moduleId];
      return {
        id: run.moduleId,
        name: definition.name,
        oneLiner: definition.oneLiner,
        enabled: run.enabled,
        adapterId: run.adapterId,
        status: run.status,
        note: run.note ?? "",
        inputText: formatInput(run.moduleId, inputs),
        decisionText: formatDecision(run),
        outputText: formatOutput(run),
      };
    }),
  };
}

function formatInput(moduleId: ModuleId, inputs: ModuleInputs): string {
  if (moduleId === "leak-ranker") {
    return inputs["leak-ranker"].misses
      .map((miss) => `${miss.kind} — ${miss.note} — ${money.format(miss.cost)}`)
      .join("\n");
  }
  if (moduleId === "job-film") {
    const film = inputs["job-film"];
    return [
      film.jobTitle,
      ...film.steps.map(
        (step) =>
          `${step.label} — ${step.accountable} — ${authorityLabel(step.authority)} — ${step.status}`,
      ),
    ].join("\n");
  }
  if (moduleId === "proof-gate") {
    const handoff = inputs["proof-gate"];
    return [
      `${handoff.handoffFrom} → ${handoff.handoffTo}`,
      ...handoff.proofs.map(
        (proof) =>
          `${proof.label} — ${proof.required ? "required" : "optional"} — ${proof.onRecord ? "on record" : "missing"}`,
      ),
    ].join("\n");
  }
  const sweep = inputs["exception-hour"];
  return [
    `Cadence: ${sweep.cadence}`,
    `Window: ${sweep.windowMinutes} minutes`,
    ...sweep.exceptions.map((item) => `${item.summary} — ${item.nextAction}`),
  ].join("\n");
}

function formatDecision(run: ModuleRun): string {
  if (run.status !== "ran") return run.note ?? "Not run.";
  if (run.moduleId === "leak-ranker") {
    const decision = run.decisions as LeakRankerDecision;
    return [`Fix first: ${decision.fixFirstId ?? "none"}`, decision.reason].join("\n");
  }
  if (run.moduleId === "job-film") {
    const decision = run.decisions as JobFilmDecision;
    return [
      `Current step: ${decision.currentStepId ?? "none"}`,
      `Decides alone: ${decision.decideAloneIds.join(", ") || "none"}`,
      `Must check up: ${decision.mustCheckUpIds.join(", ") || "none"}`,
      decision.problems.length ? decision.problems.join("\n") : "One accountable name on every step.",
    ].join("\n");
  }
  if (run.moduleId === "proof-gate") {
    const decision = run.decisions as ProofGateDecision;
    return [`Verdict: ${decision.verdict}`, decision.reason].join("\n");
  }
  const decision = run.decisions as ExceptionHourDecision;
  return [
    `Cadence: ${decision.cadence}`,
    `Assigned: ${decision.assignedIds.join(", ") || "none"}`,
    `Deferred: ${decision.deferredIds.join(", ") || "none"}`,
    decision.endedOnTime ? "Ended on time." : "Overran the window.",
  ].join("\n");
}

function formatOutput(run: ModuleRun): string {
  if (run.status !== "ran") return run.note ?? "Not run.";
  if (run.moduleId === "leak-ranker") {
    const output = run.output as LeakRankerOutput;
    const lines = output.ranking.map(
      (row) => `${row.rank}. ${row.kind} — ${row.note} — ${money.format(row.cost)}`,
    );
    if (output.fixFirst) {
      lines.push(`Fix first: ${output.fixFirst.note} (${money.format(output.fixFirst.cost)})`);
    }
    return lines.join("\n");
  }
  if (run.moduleId === "job-film") {
    const output = run.output as JobFilmOutput;
    return [
      output.jobTitle,
      ...output.sequence.map(
        (step) =>
          `${step.order}. ${step.label} — ${step.accountable} — ${authorityLabel(step.authority)} — ${step.status}`,
      ),
    ].join("\n");
  }
  if (run.moduleId === "proof-gate") {
    const decision = run.decisions as ProofGateDecision;
    return decision.reason;
  }
  const output = run.output as ExceptionHourOutput;
  return [
    ...output.assignments.map((row) => `${row.summary}: ${row.nextAction}`),
    ...output.deferred.map((row) => `Deferred ${row.summary}: ${row.reason}`),
    output.endedOnTime ? "Ended on time." : "Overran the window.",
  ].join("\n");
}

function authorityLabel(authority: "decide-alone" | "must-check-up"): string {
  return authority === "decide-alone" ? "decides alone" : "must check up";
}
