import type { OpsModule } from "../core/types";

export type Authority = "decide-alone" | "must-check-up";
export type StepStatus = "done" | "current" | "upcoming";

export interface FilmStep {
  id: string;
  label: string;
  accountable: string;
  authority: Authority;
  status: StepStatus;
}

export interface JobFilmInput {
  jobTitle: string;
  steps: FilmStep[];
}

export interface JobFilmDecision {
  stepCount: number;
  currentStepId: string | null;
  decideAloneIds: string[];
  mustCheckUpIds: string[];
  problems: string[];
}

export interface JobFilmStepView {
  order: number;
  id: string;
  label: string;
  accountable: string;
  authority: Authority;
  status: StepStatus;
}

export interface JobFilmOutput {
  jobTitle: string;
  sequence: JobFilmStepView[];
}

export const jobFilm: OpsModule<"job-film", JobFilmInput, JobFilmDecision, JobFilmOutput> = {
  id: "job-film",
  name: "Job Film / Authority Ladder",
  oneLiner:
    "Shows one live job as a step sequence, with one accountable name per step and who can decide alone versus who must check up.",
  run(input) {
    const problems = input.steps.flatMap((step) =>
      step.accountable.trim()
        ? []
        : [`Step “${step.label}” needs exactly one accountable name.`],
    );
    const current = input.steps.find((step) => step.status === "current");
    const decisions: JobFilmDecision = {
      stepCount: input.steps.length,
      currentStepId: current?.id ?? null,
      decideAloneIds: input.steps
        .filter((step) => step.authority === "decide-alone")
        .map((step) => step.id),
      mustCheckUpIds: input.steps
        .filter((step) => step.authority === "must-check-up")
        .map((step) => step.id),
      problems,
    };
    const output: JobFilmOutput = {
      jobTitle: input.jobTitle,
      sequence: input.steps.map((step, index) => ({
        order: index + 1,
        id: step.id,
        label: step.label,
        accountable: step.accountable.trim(),
        authority: step.authority,
        status: step.status,
      })),
    };
    return { decisions, output };
  },
};
