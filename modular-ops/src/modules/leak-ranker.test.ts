import { describe, expect, it } from "vitest";
import { leakRanker } from "./leak-ranker";
import { demoMissLog } from "../demo/sample-path";

describe("Leak Ranker (The Plug)", () => {
  it("ranks misses by cost and names the single leak to fix first", () => {
    const { decisions, output } = leakRanker.run({ misses: demoMissLog });

    expect(output.ranking.map((row) => row.id)).toEqual([
      "m-quote",
      "m-handoff",
      "m-call",
      "m-wait",
    ]);
    expect(output.ranking.map((row) => row.rank)).toEqual([1, 2, 3, 4]);
    expect(decisions.fixFirstId).toBe("m-quote");
    expect(output.fixFirst?.kind).toBe("quote");
    expect(output.fixFirst?.cost).toBe(2400);
    expect(decisions.reason).toMatch(/quote/i);
    expect(decisions.reason).toMatch(/2400/);
  });

  it("keeps earlier log order when costs tie", () => {
    const { decisions } = leakRanker.run({
      misses: [
        { id: "a", kind: "call", note: "Missed call", cost: 100 },
        { id: "b", kind: "wait", note: "Waited", cost: 100 },
      ],
    });

    expect(decisions.rankedIds).toEqual(["a", "b"]);
    expect(decisions.fixFirstId).toBe("a");
  });

  it("returns no fix-first when the log is empty", () => {
    const { decisions, output } = leakRanker.run({ misses: [] });

    expect(decisions.fixFirstId).toBeNull();
    expect(decisions.rankedIds).toEqual([]);
    expect(output.fixFirst).toBeNull();
    expect(decisions.reason).toMatch(/no misses/i);
  });
});
