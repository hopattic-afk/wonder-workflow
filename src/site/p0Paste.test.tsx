import { createElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ASSESSMENT_BOOKING_URL, CONTACT_LABELS, QUESTIONS } from "../domain/assessment";
import { LegacyAssessment } from "../pages/Assessment";
import Website from "./Website";

const HERO_SUPPORT_CUT =
  "Work waits on you. We dig into what's actually breaking and build the fix around how your shop really runs.";

function renderPath(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Website />
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Reed P0 paste pack", () => {
  it("wires homepage Feel, Understand, Assess, forks, seasoning, automation, and who-for", () => {
    renderPath("/");

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Your business has outgrown the way the work gets done.",
      }),
    ).toBeVisible();
    expect(document.body.textContent).not.toContain(HERO_SUPPORT_CUT);

    expect(
      screen.getByRole("heading", {
        name: "The way work gets done can't keep up with the work.",
      }),
    ).toBeVisible();
    expect(
      screen.getByText(
        "Demand rose. Headcount rose. The path that finishes the work stayed the same, so capacity and pace keep colliding.",
      ),
    ).toBeVisible();

    expect(
      screen.getByRole("heading", { name: "Dig into what's actually breaking." }),
    ).toBeVisible();
    expect(
      screen.getByText(
        "We find where work stalls, then fix how the day actually runs. Easy changes first: clearer ownership, better use of tools you already have. Automation only when it earns its keep. Not another pile of tools. Not an AI agency pitch.",
      ),
    ).toBeVisible();
    for (const step of [
      "Sit with the work as it happens and name the friction in plain language.",
      "See where handoffs stall, details live in one head, and status has to be chased.",
      "Design the smallest change that clears the path: strategy and execution together, not a deck left behind.",
    ]) {
      expect(screen.getByText(step)).toBeVisible();
      expect(step).not.toMatch(/\d/);
    }

    const close = document.querySelector(".ship-close-lines")?.textContent ?? "";
    expect(close).toContain("You bring what's actually breaking.");
    expect(close).toContain(
      "We build the fix around how your work really runs.",
    );
    expect(
      screen.getByText(
        "Fit Review: a complimentary 30-minute business operations review.",
      ),
    ).toBeVisible();

    const beat = document.querySelector('[data-beat="assess"]');
    expect(beat).toBeTruthy();
    const beatLinks = Array.from(beat!.querySelectorAll("a"));
    expect(
      beatLinks.find((link) =>
        (link.textContent ?? "").includes("Assess your operations"),
      )?.getAttribute("href"),
    ).toBe("/assessment");
    expect(
      beatLinks.find((link) =>
        (link.textContent ?? "").includes("Request a diagnostic"),
      )?.getAttribute("href"),
    ).toBe("/request-diagnostic");
    expect(
      beatLinks.find((link) => (link.textContent ?? "").includes("Chat with us"))
        ?.getAttribute("href"),
    ).toBe("mailto:operations@wonderworkflow.com");
    expect(
      beatLinks.find((link) => (link.textContent ?? "").includes("Work with us"))
        ?.getAttribute("href"),
    ).toBe("mailto:operations@wonderworkflow.com");

    expect(
      screen.getByRole("heading", {
        name: "If you find yourself at any of these forks, start with a Fit Review.",
      }),
    ).toBeVisible();
    expect(
      screen.getByText(
        "People joined. Decisions still route through you. The day no longer fits in one head.",
      ),
    ).toBeVisible();
    expect(
      screen.getByText(
        "Bookings, jobs, or orders climbed. The path from yes to done did not.",
      ),
    ).toBeVisible();
    expect(
      screen.getByText(
        "Status, approvals, and exceptions wait on you before anyone else can move.",
      ),
    ).toBeVisible();
    expect(
      screen.getByText(
        "Job notes, materials counts, and handoffs drop between people and tools.",
      ),
    ).toBeVisible();
    expect(
      document.querySelectorAll(
        ".ship-fork-card a, .ship-season-card a",
      ),
    ).toHaveLength(0);

    expect(
      screen.getByRole("heading", { name: "Where the day frays." }),
    ).toBeVisible();
    expect(screen.getByText("Equal weight. Not the brand face.")).toBeVisible();
    expect(document.body.textContent).not.toMatch(/No Assess on these cards/);
    expect(
      screen.getByText(
        "Who's left on read in the inbox or CRM while you're on the tools?",
      ),
    ).toBeVisible();
    expect(
      screen.getByText(
        "Phone rings while the crew waits on site. Which one loses today?",
      ),
    ).toBeVisible();
    expect(
      screen.getByText(
        "Did the job details stay in someone's head instead of the job board?",
      ),
    ).toBeVisible();
    expect(
      screen.getByText(
        '"Where are we at?" hits the group text, and nobody has the same answer.',
      ),
    ).toBeVisible();
    expect(
      screen.getByText(
        "Spreadsheet said you had extra fasteners. The truck didn't.",
      ),
    ).toBeVisible();
    expect(
      screen.getByText(
        "Catering order on the sheet. Did it actually show up on the truck the kitchen expected?",
      ),
    ).toBeVisible();

    expect(
      screen.getByRole("heading", { name: "Automation that keeps work moving." }),
    ).toBeVisible();
    expect(
      screen.getByText(
        "When the ops picture is clear, we may add automation that holds under real load. Reliability first. Easy fixes and clearer ownership before expensive builds.",
      ),
    ).toBeVisible();
    expect(
      screen.getByText(
        "These shops don't need a chatbot. They need work that keeps moving after the easy fixes are in place.",
      ),
    ).toBeVisible();

    expect(
      screen.getByRole("heading", {
        name: "Built for shops where the owner still holds the day together.",
      }),
    ).toBeVisible();
    expect(
      screen.getByText(
        'Hospitality, cleaning, landscaping, detailing, signs and print, restoration, moving, retail, and similar service businesses. Strongest fit when a small crew already shares the day and handoffs matter. Smaller shops still welcome when the ops problem is real. If work lives in group texts, whiteboards, and "just ask me," you\'re in the right place.',
      ),
    ).toBeVisible();
    expect(document.body.textContent).not.toMatch(/Not for:/);
    expect(document.body.textContent).not.toMatch(/fractional COO/);
    expect(document.body.textContent).not.toMatch(/\u2014/);
    expect(document.body.textContent).not.toMatch(/toolbox/i);
    expect(document.body.textContent).not.toMatch(/\$\d/);
  });

  it("keeps the assessment intro, trust line, and first scored question", () => {
    render(createElement(LegacyAssessment));

    expect(
      screen.getByRole("heading", {
        name: "See where your operations are stuck",
      }),
    ).toBeVisible();
    expect(
      screen.getByText(
        "About two minutes. Surfaces where work waits on you, who owns what, and what goes missing between people and tools.",
      ),
    ).toBeVisible();
    expect(
      screen.getByText(
        "Indicative score, not a diagnosis or savings guarantee.",
      ),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: QUESTIONS[0].label }),
    ).toBeVisible();
    expect(document.body.textContent).not.toMatch(/AI Operations Score/i);
    expect(document.body.textContent).not.toMatch(/\u2014/);
  });

  it("saves with the Fit Review label and thanks the visitor without selling the review", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ acceptingSubmissions: true }),
      })
      .mockImplementationOnce(async (_url: string, options: { body: string }) => ({
        ok: true,
        json: async () => ({
          contact_saved: true,
          submission_id: JSON.parse(options.body).submission_id,
          booking_url: ASSESSMENT_BOOKING_URL,
        }),
      }));
    vi.stubGlobal("fetch", fetchMock);
    render(createElement(LegacyAssessment));

    for (const question of QUESTIONS) {
      const option = await screen.findByRole("button", {
        name: question.options[3],
      });
      await waitFor(() => expect(option).not.toBeDisabled());
      fireEvent.click(option);
    }
    const contact = {
      first_name: "Taylor",
      last_name: "Example",
      email: "taylor@example.test",
      company: "Fictional Workshop",
      team_size: "6–20 people",
      industry: "Construction / trades",
      operational_priority: "Reduce repetitive admin",
    };
    for (const key of Object.keys(contact) as (keyof typeof contact)[]) {
      fireEvent.change(screen.getByLabelText(CONTACT_LABELS[key], { exact: true }), {
        target: { value: contact[key] },
      });
    }

    const submit = await screen.findByRole("button", {
      name: "Save and continue to Fit Review",
    });
    fireEvent.click(submit);

    expect(
      await screen.findByRole("heading", {
        name: "Your operations snapshot is ready",
      }),
    ).toBeVisible();
    expect(
      screen.getByText(
        "Next is a complimentary 30-minute Fit Review: a free business operations review. Bring what's actually breaking. We'll prioritize on the call and book from there.",
      ),
    ).toBeVisible();
    expect(document.body.textContent).not.toMatch(/AI Operations Score/i);
    expect(document.body.textContent).not.toMatch(/\$\d/);
  });

  it("publishes the diagnostic bypass with support, form, and success copy", () => {
    renderPath("/request-diagnostic");

    expect(
      screen.getByRole("heading", { name: "Request a diagnostic" }),
    ).toBeVisible();
    expect(
      screen.getByText(
        "Already feel like a fit? Skip the assessment. Short intake, then we schedule a call to dig into what's actually breaking.",
      ),
    ).toBeVisible();
    expect(
      screen.getByText(
        "Tell us what's breaking. We'll follow up by email with the next step.",
      ),
    ).toBeVisible();
    expect(screen.getByTitle("Request a diagnostic")).toHaveAttribute(
      "src",
      "https://api.wonderworkflow.com/widget/form/fYq3Zvb80SesdYASeP96",
    );
    expect(
      screen.getByText(
        "After you submit, watch your inbox for scheduling. No pricing on this page. Fit Review stays complimentary if that is the right next door.",
      ),
    ).toBeVisible();
    expect(
      screen.getByText("Thanks. Check your email for the next step."),
    ).toBeVisible();
    expect(document.body.textContent).not.toMatch(/\u2014/);
    expect(document.body.textContent).not.toMatch(/\$\d/);
  });
});
