import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Assessment, { LegacyAssessment } from "./Assessment";
import { assessmentScore, QUESTIONS } from "../domain/assessment";

describe("public browser-only assessment", () => {
  const request = vi.fn();
  beforeEach(() => {
    vi.useFakeTimers();
    request.mockReset();
    vi.stubGlobal("fetch", request);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
  function answer(value: number) {
    const question = screen.getByRole("region", { name: "Current question" });
    const buttons = within(question)
      .getAllByRole("button")
      .filter((button) => button.classList.contains("assessment-option"));
    fireEvent.click(buttons[value]);
    act(() => vi.advanceTimersByTime(301));
  }
  it.each([0, 1, 2, 3])(
    "uses all seven original questions and existing score/tier for option %i",
    (value) => {
      const { container } = render(<Assessment />);
      const answers: Record<string, number> = {};
      for (const question of QUESTIONS) {
        expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
          question.label,
        );
        answers[question.key] = value;
        answer(value);
      }
      const expected = assessmentScore(answers);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        `${expected.score} / ${expected.max_score}`,
      );
      expect(screen.getByText(expected.tier)).toBeVisible();
      expect(
        screen.getByText(
          "Your answers stay in this browser tab. Share your result when you contact us.",
        ),
      ).toBeVisible();
      expect(
        screen.getByRole("link", { name: "Discuss your result" }),
      ).toHaveAttribute("href", "/contact");
      expect(
        screen.getByRole("link", {
          name: "Email operations@wonderworkflow.com",
        }),
      ).toHaveAttribute("href", "mailto:operations@wonderworkflow.com");
      expect(
        container.querySelector("input, textarea, select, iframe, form"),
      ).toBeNull();
      expect(request).not.toHaveBeenCalled();
      expect(
        screen.queryByText(
          /assessment is saved|preview|book your Workflow Fit Review/i,
        ),
      ).not.toBeInTheDocument();
    },
  );
  it("preserves answers for back and review, and recomputes after an edit", () => {
    render(<Assessment />);
    answer(3);
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(
      screen.getByRole("button", { name: QUESTIONS[0].options[3] }),
    ).toHaveAttribute("aria-pressed", "true");
    answer(0);
    for (let index = 1; index < QUESTIONS.length; index++) answer(3);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "18 / 21",
    );
    fireEvent.click(screen.getByRole("button", { name: "Review answers" }));
    expect(
      screen.getByRole("button", { name: QUESTIONS[0].options[0] }),
    ).toHaveAttribute("aria-pressed", "true");
    for (let index = 0; index < QUESTIONS.length; index++) answer(0);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "0 / 21",
    );
    expect(request).not.toHaveBeenCalled();
  });
  it("retains the legacy component without mounting it and discards answers on unmount", () => {
    expect(typeof LegacyAssessment).toBe("function");
    const { unmount } = render(<Assessment />);
    answer(3);
    unmount();
    render(<Assessment />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      QUESTIONS[0].label,
    );
    expect(
      screen.getByRole("button", { name: QUESTIONS[0].options[3] }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(request).not.toHaveBeenCalled();
  });
});
