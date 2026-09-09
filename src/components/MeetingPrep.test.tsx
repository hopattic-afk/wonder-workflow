import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MeetingPrep } from "./MeetingPrep";
import { applyIntakePacket } from "../domain/intake";
import { defaultSettings, newSession } from "../domain/defaults";
import type { Store } from "../domain/types";
import fixture from "../../docs/examples/prepared-meeting.example.json";

describe("meeting preparation", () => {
  it("does not add preparation questions to an ordinary audit", () => {
    const { container } = render(<MeetingPrep session={newSession()} />);
    expect(container).toBeEmptyDOMElement();
  });
  it("shows live manual values and hides an incoming change when it is accepted in the worksheet", () => {
    const store: Store = {
      version: 1,
      settings: defaultSettings(),
      sessions: [],
      lastExport: null,
      lastSaved: null,
    };
    const first = applyIntakePacket(store, fixture).store;
    first.sessions[0].worksheet.reason = "My call notes";
    const newer = {
      ...fixture,
      updatedAt: "2026-09-06T17:00:00Z",
      mappedFields: { "worksheet.reason": "Updated source answer" },
    };
    const session = applyIntakePacket(first, newer).store.sessions[0];
    const { rerender } = render(<MeetingPrep session={session} />);
    expect(screen.getByText("Your value: My call notes")).toBeVisible();
    const edited = structuredClone(session);
    edited.worksheet.reason = "More current call notes";
    rerender(<MeetingPrep session={edited} />);
    expect(
      screen.getByText("Your value: More current call notes"),
    ).toBeVisible();
    edited.worksheet.reason = "Updated source answer";
    rerender(<MeetingPrep session={{ ...edited }} />);
    expect(
      screen.queryByText(/New information to review/),
    ).not.toBeInTheDocument();
  });
});
