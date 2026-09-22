import { describe, expect, it } from "vitest";
import { proofGate } from "./proof-gate";
import { demoHandoff } from "../demo/sample-path";

describe("Proof Gate", () => {
  it("holds the handoff when required proof is missing", () => {
    const { decisions, output } = proofGate.run(demoHandoff);

    expect(decisions.verdict).toBe("hold");
    expect(output.status).toBe("hold");
    expect(decisions.missingLabels).toEqual(["Site photos"]);
    expect(decisions.reason).toMatch(/site photos/i);
    expect(decisions.reason).toMatch(/no proof, no pass/i);
    expect(output.reason).toBe(decisions.reason);
  });

  it("passes only when every required proof is on the record", () => {
    const { decisions, output } = proofGate.run({
      ...demoHandoff,
      proofs: demoHandoff.proofs.map((proof) =>
        proof.required ? { ...proof, onRecord: true } : proof,
      ),
    });

    expect(decisions.verdict).toBe("pass");
    expect(output.status).toBe("pass");
    expect(decisions.missingLabels).toEqual([]);
    expect(decisions.reason).toMatch(/on the record/i);
  });

  it("holds when no required proof is defined", () => {
    const { decisions } = proofGate.run({
      handoffFrom: "Riley Chen",
      handoffTo: "Jordan Hale",
      proofs: [
        {
          id: "paint",
          label: "Paint preference",
          required: false,
          onRecord: true,
        },
      ],
    });

    expect(decisions.verdict).toBe("hold");
    expect(decisions.reason).toMatch(/no proof, no pass/i);
  });

  it("ignores optional proof that is not on the record", () => {
    const { decisions } = proofGate.run({
      handoffFrom: "Riley Chen",
      handoffTo: "Jordan Hale",
      proofs: [
        {
          id: "quote",
          label: "Signed quote",
          required: true,
          onRecord: true,
        },
        {
          id: "paint",
          label: "Paint preference",
          required: false,
          onRecord: false,
        },
      ],
    });

    expect(decisions.verdict).toBe("pass");
    expect(decisions.missingLabels).toEqual([]);
  });
});
