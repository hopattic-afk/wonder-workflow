import type { ModuleId, OpsModule } from "./types";
import type { ExceptionHourInput } from "../modules/exception-hour";
import { exceptionHour } from "../modules/exception-hour";
import type { JobFilmInput } from "../modules/job-film";
import { jobFilm } from "../modules/job-film";
import type { LeakRankerInput } from "../modules/leak-ranker";
import { leakRanker } from "../modules/leak-ranker";
import type { ProofGateInput } from "../modules/proof-gate";
import { proofGate } from "../modules/proof-gate";

export interface ModuleInputs {
  "leak-ranker": LeakRankerInput;
  "job-film": JobFilmInput;
  "proof-gate": ProofGateInput;
  "exception-hour": ExceptionHourInput;
}

export type ModuleRegistry = {
  [K in ModuleId]: OpsModule<K, ModuleInputs[K], unknown, unknown>;
};

export const moduleRegistry: ModuleRegistry = {
  "leak-ranker": leakRanker,
  "job-film": jobFilm,
  "proof-gate": proofGate,
  "exception-hour": exceptionHour,
};
