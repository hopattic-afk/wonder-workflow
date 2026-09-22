import type { OpsModule } from "../core/types";

export interface ProofItem {
  id: string;
  label: string;
  required: boolean;
  onRecord: boolean;
}

export interface ProofGateInput {
  handoffFrom: string;
  handoffTo: string;
  proofs: ProofItem[];
}

export interface ProofGateDecision {
  verdict: "pass" | "hold";
  missingLabels: string[];
  reason: string;
}

export interface ProofGateOutput {
  status: "pass" | "hold";
  reason: string;
}

export const proofGate: OpsModule<
  "proof-gate",
  ProofGateInput,
  ProofGateDecision,
  ProofGateOutput
> = {
  id: "proof-gate",
  name: "Proof Gate",
  oneLiner:
    "Stops a handoff until the required proof is on the record, or marks Hold with a reason. No proof, no pass.",
  run(input) {
    const required = input.proofs.filter((proof) => proof.required);
    const missingLabels = required
      .filter((proof) => !proof.onRecord)
      .map((proof) => proof.label);
    let reason: string;
    let verdict: "pass" | "hold";
    if (required.length === 0) {
      verdict = "hold";
      reason = "Hold: no required proof is defined. No proof, no pass.";
    } else if (missingLabels.length > 0) {
      verdict = "hold";
      reason = `Hold: ${missingLabels.join(", ")} is not on the record. No proof, no pass.`;
    } else {
      verdict = "pass";
      reason = "Pass: required proof is on the record.";
    }
    const decisions: ProofGateDecision = { verdict, missingLabels, reason };
    const output: ProofGateOutput = { status: verdict, reason };
    return { decisions, output };
  },
};
