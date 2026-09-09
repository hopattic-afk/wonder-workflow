import {
  fireEvent,
  render,
  screen,
  cleanup,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { Documents } from "./Documents";
import { defaultSettings, newSession } from "../domain/defaults";
import { generateRecommendation } from "../domain/documents";
import { OPERATIONS_TITLE, LEGACY_DEFAULT_COMPANY } from "../domain/constants";

beforeEach(() =>
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  ),
);
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("document editing", () => {
  it.each([
    {
      kind: "recommendation" as const,
      company: LEGACY_DEFAULT_COMPANY,
      expected: OPERATIONS_TITLE,
    },
    {
      kind: "proposal" as const,
      company: LEGACY_DEFAULT_COMPANY,
      expected: OPERATIONS_TITLE,
    },
    {
      kind: "recommendation" as const,
      company: "Custom Consulting Ltd.",
      expected: OPERATIONS_TITLE,
    },
    {
      kind: "proposal" as const,
      company: "Custom Consulting Ltd.",
      expected: OPERATIONS_TITLE,
    },
  ])(
    "keeps unsigned $kind preview and exports unbranded while preserving saved $company settings",
    async ({ kind, company, expected }) => {
      expect(defaultSettings().company).toBe("");
      const settings = {
        ...defaultSettings(),
        company,
        service: "Custom Provider Branded Service",
        logo: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6uWQAAAAASUVORK5CYII=",
      };
      const session = newSession(settings);
      session[kind].generatedAt = "2026-08-01T12:00:00Z";
      const original = JSON.stringify({ settings, session });
      const onChange = vi.fn();
      const writeText = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal(
        "navigator",
        Object.create(navigator, { clipboard: { value: { writeText } } }),
      );
      render(
        <MemoryRouter>
          <Documents
            kind={kind}
            session={session}
            settings={settings}
            onChange={onChange}
            onDuplicate={vi.fn()}
          />
        </MemoryRouter>,
      );
      const preview = screen.getByLabelText(`${kind} print preview`);
      expect(preview).toHaveTextContent(expected);
      expect(preview).not.toHaveTextContent(LEGACY_DEFAULT_COMPANY);
      expect(preview).not.toHaveTextContent(company);
      expect(preview).not.toHaveTextContent(settings.service);
      expect(preview.querySelector("img")).toBeNull();
      if (kind === "proposal")
        expect(preview).toHaveTextContent("Consultant representative");
      for (const format of ["plain text", "Markdown"]) {
        fireEvent.click(
          screen.getByRole("button", { name: `Copy as ${format}` }),
        );
        await waitFor(() =>
          expect(screen.getByText(`Copied as ${format}.`)).toBeInTheDocument(),
        );
        const copied = writeText.mock.calls.at(-1)![0];
        expect(copied).toContain(expected);
        expect(copied).not.toContain(LEGACY_DEFAULT_COMPANY);
        expect(copied).not.toContain(company);
        expect(copied).not.toContain(settings.service);
        expect(copied).not.toContain(settings.logo);
        if (kind === "proposal")
          expect(copied).toContain("Consultant representative:");
      }
      expect(JSON.stringify({ settings, session })).toBe(original);
      expect(onChange).not.toHaveBeenCalled();
    },
  );
  it.each([LEGACY_DEFAULT_COMPANY, "Historical Custom Consulting Ltd."])(
    "preserves historical proposal identity %s and authored terms without migration",
    async (company) => {
      const settings = {
        ...defaultSettings(),
        company,
        service: "Historical Provider Service",
        logo: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6uWQAAAAASUVORK5CYII=",
      };
      const session = newSession(settings);
      session.proposal.clientSignDate = "2026-08-01";
      session.proposal.generatedAt = "2026-08-01T12:00:00Z";
      session.proposal.objective =
        "Previously approved terms remain exactly as written.";
      const original = JSON.stringify({ session, settings });
      const onChange = vi.fn();
      const writeText = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal(
        "navigator",
        Object.create(navigator, { clipboard: { value: { writeText } } }),
      );
      render(
        <MemoryRouter>
          <Documents
            kind="proposal"
            session={session}
            settings={settings}
            onChange={onChange}
            onDuplicate={vi.fn()}
          />
        </MemoryRouter>,
      );
      const preview = screen.getByLabelText("proposal print preview");
      expect(preview).toHaveTextContent(company);
      expect(preview).toHaveTextContent(settings.service);
      expect(preview.querySelector("img")).toHaveAttribute(
        "src",
        settings.logo,
      );
      if (company === LEGACY_DEFAULT_COMPANY)
        expect(preview).toHaveTextContent(
          `${LEGACY_DEFAULT_COMPANY} representative:`,
        );
      expect(preview).toHaveTextContent(session.proposal.objective);
      fireEvent.click(screen.getByRole("button", { name: "Copy as Markdown" }));
      await waitFor(() => expect(writeText).toHaveBeenCalled());
      expect(writeText.mock.calls[0][0]).toContain(company);
      expect(writeText.mock.calls[0][0]).toContain(settings.service);
      expect(writeText.mock.calls[0][0]).toContain(session.proposal.objective);
      expect(JSON.stringify({ session, settings })).toBe(original);
      expect(onChange).not.toHaveBeenCalled();
    },
  );
  it.each(["signed", "Won"])(
    "keeps a blank-company %s proposal neutral without inventing historical identity",
    async (state) => {
      const settings = {
        ...defaultSettings(),
        company: "",
        service: "Saved Branded Service",
        logo: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6uWQAAAAASUVORK5CYII=",
      };
      const session = newSession(settings);
      session.proposal.generatedAt = "2026-08-01T12:00:00Z";
      if (state === "Won") session.status = "Won";
      else session.proposal.clientSignDate = "2026-08-01";
      const original = JSON.stringify({ settings, session });
      const writeText = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal(
        "navigator",
        Object.create(navigator, { clipboard: { value: { writeText } } }),
      );
      render(
        <MemoryRouter>
          <Documents
            kind="proposal"
            session={session}
            settings={settings}
            onChange={vi.fn()}
            onDuplicate={vi.fn()}
          />
        </MemoryRouter>,
      );
      const preview = screen.getByLabelText("proposal print preview");
      expect(preview).toHaveTextContent(OPERATIONS_TITLE);
      expect(preview).not.toHaveTextContent(/McCann/i);
      expect(preview).not.toHaveTextContent(settings.service);
      expect(preview.querySelector("img")).toBeNull();
      for (const format of ["plain text", "Markdown"]) {
        fireEvent.click(
          screen.getByRole("button", { name: `Copy as ${format}` }),
        );
        await waitFor(() =>
          expect(screen.getByText(`Copied as ${format}.`)).toBeInTheDocument(),
        );
        const copied = writeText.mock.calls.at(-1)![0];
        expect(copied).toContain(OPERATIONS_TITLE);
        expect(copied).not.toMatch(/McCann/i);
        expect(copied).not.toContain(settings.service);
      }
      expect(JSON.stringify({ settings, session })).toBe(original);
    },
  );
  it("does not rewrite a legal name inside user-authored draft text or notes", async () => {
    const settings = { ...defaultSettings(), company: LEGACY_DEFAULT_COMPANY };
    const session = newSession(settings);
    session.recommendation.objective = `Keep this approved reference to ${LEGACY_DEFAULT_COMPANY}.`;
    session.recommendation.generatedAt = "2026-08-01T12:00:00Z";
    session.callNotes = `Private note mentioning ${LEGACY_DEFAULT_COMPANY}.`;
    const original = JSON.stringify(session);
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal(
      "navigator",
      Object.create(navigator, { clipboard: { value: { writeText } } }),
    );
    render(
      <MemoryRouter>
        <Documents
          kind="recommendation"
          session={session}
          settings={settings}
          onChange={vi.fn()}
          onDuplicate={vi.fn()}
        />
      </MemoryRouter>,
    );
    expect(
      screen.getByLabelText("recommendation print preview"),
    ).toHaveTextContent(OPERATIONS_TITLE);
    fireEvent.click(screen.getByRole("button", { name: "Copy as plain text" }));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(writeText.mock.calls[0][0]).toContain(
      session.recommendation.objective,
    );
    expect(writeText.mock.calls[0][0]).not.toContain(session.callNotes);
    expect(JSON.stringify(session)).toBe(original);
  });
  it("keeps edits when regeneration is cancelled", () => {
    const settings = defaultSettings();
    const session = newSession(settings);
    session.recommendation = generateRecommendation(session, settings);
    session.recommendation.objective = "Client-approved custom wording";
    const onChange = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(
      <MemoryRouter>
        <Documents
          kind="recommendation"
          session={session}
          settings={settings}
          onChange={onChange}
          onDuplicate={vi.fn()}
        />
      </MemoryRouter>,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Regenerate recommendation" }),
    );
    expect(onChange).not.toHaveBeenCalled();
    expect(
      screen.getByRole("textbox", { name: /Business Objective/ }),
    ).toHaveValue("Client-approved custom wording");
  });

  it("excludes internal rationale from copied text unless explicitly enabled", async () => {
    const settings = defaultSettings();
    const session = newSession(settings);
    session.worksheet.rationale = "PRIVATE INTERNAL NOTE";
    session.recommendation = generateRecommendation(session, settings);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(
      <MemoryRouter>
        <Documents
          kind="recommendation"
          session={session}
          settings={settings}
          onChange={vi.fn()}
          onDuplicate={vi.fn()}
        />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Copy as plain text" }));
    expect(writeText).toHaveBeenCalled();
    expect(writeText.mock.calls[0][0]).not.toContain("PRIVATE INTERNAL NOTE");
    expect(writeText.mock.calls[0][0]).not.toContain("Estimated investment");
    await screen.findByText("Copied as plain text.");
  });

  it("writes proposal pricing into the shared calculator and leaves presets unselected", () => {
    const session = newSession();
    const onChange = vi.fn();
    render(
      <MemoryRouter>
        <Documents
          kind="proposal"
          session={session}
          settings={defaultSettings()}
          onChange={onChange}
          onDuplicate={vi.fn()}
        />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("combobox", { name: "Payment preset" }),
    ).toHaveValue("");
    expect(
      screen.getByRole("combobox", { name: "Case-study permission" }),
    ).toHaveValue("");
    fireEvent.change(
      screen.getByRole("spinbutton", { name: "Standard implementation price" }),
      { target: { value: "2400" } },
    );
    expect(onChange.mock.calls[0][0].calculator.price).toBe(2400);
    expect(
      screen
        .getByLabelText("proposal print preview")
        .querySelectorAll(".print-page"),
    ).toHaveLength(4);
  });

  it("shows hard-stop and financial warnings only in the editor", () => {
    const session = newSession();
    session.worksheet.riskAreas = ["Financial decisions"];
    session.worksheet.autonomous = "Yes";
    render(
      <MemoryRouter>
        <Documents
          kind="proposal"
          session={session}
          settings={defaultSettings()}
          onChange={vi.fn()}
          onDuplicate={vi.fn()}
        />
      </MemoryRouter>,
    );
    expect(
      screen.getByText(
        "Hard stop: high-risk decisions must not be fully autonomous.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("proposal print preview"),
    ).not.toHaveTextContent("Hard stop:");
    expect(
      screen.getByLabelText("Internal document guardrails"),
    ).toHaveTextContent("Estimated financial case: Not established");
  });

  it("applies deliberate payment presets using the entered final price", () => {
    const session = newSession();
    session.calculator.price = 3000;
    const onChange = vi.fn();
    render(
      <MemoryRouter>
        <Documents
          kind="proposal"
          session={session}
          settings={defaultSettings()}
          onChange={onChange}
          onDuplicate={vi.fn()}
        />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByRole("combobox", { name: "Payment preset" }), {
      target: { value: "50% deposit / 50% at completion" },
    });
    expect(onChange.mock.calls[0][0].proposal.deposit).toBe(1500);
    expect(onChange.mock.calls[0][0].proposal.paymentSchedule).toContain(
      "client acceptance",
    );
  });

  it("rejects negative amounts and fractional sample sizes inline without saving them", () => {
    const session = newSession();
    const onChange = vi.fn();
    render(
      <MemoryRouter>
        <Documents
          kind="proposal"
          session={session}
          settings={defaultSettings()}
          onChange={onChange}
          onDuplicate={vi.fn()}
        />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByRole("spinbutton", { name: "Deposit" }), {
      target: { value: "-10" },
    });
    fireEvent.change(
      screen.getByRole("spinbutton", { name: "Test sample size" }),
      { target: { value: "1.5" } },
    );
    expect(onChange).not.toHaveBeenCalled();
    expect(
      screen.getByText(/Enter zero or a positive amount/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Enter a whole number of zero or more/),
    ).toBeInTheDocument();
  });

  it("preserves a pre-generation privacy edit and cancelled row deletion", () => {
    const session = newSession();
    session.proposal.privacy = "Custom negotiated privacy terms";
    session.proposal.deliverables = [
      { id: "one", text: "Keep this", included: true },
    ];
    const onChange = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(
      <MemoryRouter>
        <Documents
          kind="proposal"
          session={session}
          settings={defaultSettings()}
          onChange={onChange}
          onDuplicate={vi.fn()}
        />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Generate proposal" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Remove deliverable 1" }),
    );
    expect(onChange).not.toHaveBeenCalled();
    expect(window.confirm).toHaveBeenCalledTimes(2);
  });
});
