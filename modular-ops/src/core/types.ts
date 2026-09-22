export type ModuleId =
  | "leak-ranker"
  | "job-film"
  | "proof-gate"
  | "exception-hour";

export type AdapterId = "memory" | "sheets" | "ghl";

export interface ModuleSlot {
  moduleId: ModuleId;
  enabled: boolean;
  adapterId: AdapterId;
}

/** One live job. Modules hang off this object; they do not own the path. */
export interface JobObject {
  id: string;
  title: string;
  modules: ModuleSlot[];
}

/** Top of the kit. A path holds job objects. It is not a tenant. */
export interface OpsPath {
  id: string;
  name: string;
  jobs: JobObject[];
}

export type ModuleRunStatus = "ran" | "skipped" | "adapter-unavailable";

export interface ModuleRun {
  moduleId: ModuleId;
  enabled: boolean;
  adapterId: AdapterId;
  status: ModuleRunStatus;
  decisions?: unknown;
  output?: unknown;
  note?: string;
}

export interface OpsModule<TId extends ModuleId, TInput, TDecision, TOutput> {
  id: TId;
  name: string;
  oneLiner: string;
  run(input: TInput): { decisions: TDecision; output: TOutput };
}
