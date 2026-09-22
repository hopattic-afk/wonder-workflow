import type { AdapterId, JobObject, ModuleId } from "./types";

/**
 * Optional record ports. Memory is the only adapter that runs.
 * Sheets and GHL stay as this interface until a later swap.
 */
export interface ExternalRecordPort {
  readJob(jobId: string): Promise<JobObject>;
  writeModuleOutput(
    jobId: string,
    moduleId: ModuleId,
    output: unknown,
  ): Promise<void>;
}

export interface RecordAdapter {
  id: AdapterId;
  label: string;
  available: boolean;
  note: string;
}

export const adapters: Record<AdapterId, RecordAdapter> = {
  memory: {
    id: "memory",
    label: "In-memory demo",
    available: true,
    note: "Runs on the job object in this session.",
  },
  sheets: {
    id: "sheets",
    label: "Google Sheets",
    available: false,
    note: "Stub interface only. Sheets is not connected.",
  },
  ghl: {
    id: "ghl",
    label: "GoHighLevel",
    available: false,
    note: "Stub interface only. GoHighLevel is not connected.",
  },
};
