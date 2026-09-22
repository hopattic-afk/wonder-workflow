import type { OpsModule } from "../core/types";

export interface ExceptionItem {
  id: string;
  summary: string;
  nextAction: string;
}

export interface ExceptionHourInput {
  cadence: "daily";
  windowMinutes: number;
  minutesPerException: number;
  exceptions: ExceptionItem[];
}

export interface ExceptionAssignment {
  exceptionId: string;
  summary: string;
  nextAction: string;
}

export interface DeferredException {
  exceptionId: string;
  summary: string;
  reason: string;
}

export interface ExceptionHourDecision {
  cadence: "daily";
  assignedIds: string[];
  deferredIds: string[];
  endedOnTime: true;
}

export interface ExceptionHourOutput {
  cadence: "daily";
  windowMinutes: number;
  assignments: ExceptionAssignment[];
  deferred: DeferredException[];
  endedOnTime: true;
}

export const exceptionHour: OpsModule<
  "exception-hour",
  ExceptionHourInput,
  ExceptionHourDecision,
  ExceptionHourOutput
> = {
  id: "exception-hour",
  name: "Exception Hour (Daily Sweep)",
  oneLiner:
    "A short fixed daily review that only looks at exceptions, assigns one next action each, and ends on time.",
  run(input) {
    const capacity =
      input.minutesPerException > 0
        ? Math.floor(input.windowMinutes / input.minutesPerException)
        : 0;
    const assignments: ExceptionAssignment[] = input.exceptions
      .slice(0, capacity)
      .map((item) => ({
        exceptionId: item.id,
        summary: item.summary,
        nextAction: item.nextAction.trim() || `Review: ${item.summary}`,
      }));
    const deferred: DeferredException[] = input.exceptions.slice(capacity).map((item) => ({
      exceptionId: item.id,
      summary: item.summary,
      reason: "Outside the daily sweep window.",
    }));
    const decisions: ExceptionHourDecision = {
      cadence: "daily",
      assignedIds: assignments.map((row) => row.exceptionId),
      deferredIds: deferred.map((row) => row.exceptionId),
      endedOnTime: true,
    };
    const output: ExceptionHourOutput = {
      cadence: "daily",
      windowMinutes: input.windowMinutes,
      assignments,
      deferred,
      endedOnTime: true,
    };
    return { decisions, output };
  },
};
