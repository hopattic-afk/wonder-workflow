import type { ModuleInputs } from "../core/registry";
import type { JobObject, OpsPath } from "../core/types";
import type { ExceptionHourInput } from "../modules/exception-hour";
import type { JobFilmInput } from "../modules/job-film";
import type { LeakRankerInput } from "../modules/leak-ranker";
import type { ProofGateInput } from "../modules/proof-gate";

export const demoMissLog: LeakRankerInput["misses"] = [
  {
    id: "m-call",
    kind: "call",
    note: "No callback after the site visit",
    cost: 480,
  },
  {
    id: "m-quote",
    kind: "quote",
    note: "Quote sat six days",
    cost: 2400,
  },
  {
    id: "m-handoff",
    kind: "handoff",
    note: "Crew started without the measurement sheet",
    cost: 960,
  },
  {
    id: "m-wait",
    kind: "wait",
    note: "Homeowner waited on a material confirm",
    cost: 310,
  },
];

export const demoFilm: JobFilmInput = {
  jobTitle: "Oak Street kitchen",
  steps: [
    {
      id: "measure",
      label: "Measure",
      accountable: "Sam Reed",
      authority: "decide-alone",
      status: "done",
    },
    {
      id: "quote",
      label: "Quote",
      accountable: "Riley Chen",
      authority: "must-check-up",
      status: "current",
    },
    {
      id: "schedule",
      label: "Schedule crew",
      accountable: "Jordan Hale",
      authority: "decide-alone",
      status: "upcoming",
    },
    {
      id: "walkthrough",
      label: "Walkthrough",
      accountable: "Avery Brooks",
      authority: "must-check-up",
      status: "upcoming",
    },
  ],
};

export const demoHandoff: ProofGateInput = {
  handoffFrom: "Riley Chen",
  handoffTo: "Jordan Hale",
  proofs: [
    { id: "quote", label: "Signed quote", required: true, onRecord: true },
    { id: "photos", label: "Site photos", required: true, onRecord: false },
    { id: "deposit", label: "Deposit note", required: true, onRecord: true },
    { id: "paint", label: "Paint preference", required: false, onRecord: false },
  ],
};

export const demoSweep: ExceptionHourInput = {
  cadence: "daily",
  windowMinutes: 20,
  minutesPerException: 5,
  exceptions: [
    {
      id: "ex-deposit",
      summary: "Deposit note not confirmed",
      nextAction: "Riley confirms the deposit note before scheduling.",
    },
    {
      id: "ex-measure",
      summary: "Island measure does not match the sketch",
      nextAction: "Sam remeasures the island before the quote moves.",
    },
    {
      id: "ex-material",
      summary: "Cabinet lead time unknown",
      nextAction: "Jordan checks the cabinet lead time today.",
    },
    {
      id: "ex-access",
      summary: "Gate code missing for the crew",
      nextAction: "Avery confirms gate access before the crew rolls.",
    },
    {
      id: "ex-callback",
      summary: "Homeowner callback still open",
      nextAction: "Sam returns the homeowner call after the sweep.",
    },
  ],
};

export const demoInputs: ModuleInputs = {
  "leak-ranker": { misses: demoMissLog },
  "job-film": demoFilm,
  "proof-gate": demoHandoff,
  "exception-hour": demoSweep,
};

export const demoJob: JobObject = {
  id: "job-oak-street",
  title: "Oak Street kitchen",
  modules: [
    { moduleId: "leak-ranker", enabled: true, adapterId: "memory" },
    { moduleId: "job-film", enabled: true, adapterId: "memory" },
    { moduleId: "proof-gate", enabled: true, adapterId: "memory" },
    { moduleId: "exception-hour", enabled: true, adapterId: "memory" },
  ],
};

export const samplePath: OpsPath = {
  id: "path-fit-review",
  name: "Fit Review field path",
  jobs: [demoJob],
};
