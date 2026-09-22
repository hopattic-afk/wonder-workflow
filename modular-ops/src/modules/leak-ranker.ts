import type { OpsModule } from "../core/types";

export type MissKind = "call" | "quote" | "handoff" | "wait";

export interface MissLogEntry {
  id: string;
  kind: MissKind;
  note: string;
  cost: number;
}

export interface LeakRankerInput {
  misses: MissLogEntry[];
}

export interface RankedLeak {
  id: string;
  kind: MissKind;
  note: string;
  cost: number;
  rank: number;
}

export interface LeakRankerDecision {
  fixFirstId: string | null;
  rankedIds: string[];
  reason: string;
}

export interface LeakRankerOutput {
  ranking: RankedLeak[];
  fixFirst: RankedLeak | null;
}

export const leakRanker: OpsModule<
  "leak-ranker",
  LeakRankerInput,
  LeakRankerDecision,
  LeakRankerOutput
> = {
  id: "leak-ranker",
  name: "Leak Ranker (The Plug)",
  oneLiner:
    "Takes a short log of misses and ranks which leak costs the most so you fix that one first.",
  run(input) {
    const ranking: RankedLeak[] = input.misses
      .map((miss, index) => ({ miss, index }))
      .sort((left, right) => right.miss.cost - left.miss.cost || left.index - right.index)
      .map(({ miss }, index) => ({ ...miss, rank: index + 1 }));
    const fixFirst = ranking[0] ?? null;
    const decisions: LeakRankerDecision = {
      fixFirstId: fixFirst?.id ?? null,
      rankedIds: ranking.map((row) => row.id),
      reason: fixFirst
        ? `Fix the ${fixFirst.kind} leak first. It costs ${fixFirst.cost}, more than the other misses in this log.`
        : "No misses in the log.",
    };
    const output: LeakRankerOutput = { ranking, fixFirst };
    return { decisions, output };
  },
};
