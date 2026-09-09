import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { Meetings } from "./Meetings";
import { defaultSettings } from "../domain/defaults";
import type { useMeetingInbox } from "../useMeetingInbox";

describe("meeting connection duration", () => {
  it.each([false, true])(
    "starts unchecked and submits the selected remember-device choice %j",
    (remember) => {
      const connect = vi.fn().mockResolvedValue(undefined);
      const inbox: ReturnType<typeof useMeetingInbox> = {
        state: "locked",
        busy: false,
        notice: "",
        crmNotice: "",
        connect,
        refresh: vi.fn(),
        disconnect: vi.fn(),
      };
      render(
        <MemoryRouter>
          <Meetings
            store={{
              version: 1,
              settings: defaultSettings(),
              sessions: [],
              lastSaved: null,
              lastExport: null,
            }}
            inbox={inbox}
          />
        </MemoryRouter>,
      );
      const checkbox = screen.getByRole("checkbox", {
        name: "Remember this device for 30 days",
      });
      expect(checkbox).not.toBeChecked();
      expect(checkbox).toHaveAccessibleDescription(
        /only on your own computer.*8-hour/i,
      );
      fireEvent.change(screen.getByLabelText("Meeting inbox access key"), {
        target: { value: "fictional-test-key" },
      });
      if (remember) fireEvent.click(checkbox);
      fireEvent.click(
        screen.getByRole("button", { name: "Connect meetings" }),
      );
      expect(connect).toHaveBeenCalledWith("fictional-test-key", remember);
      expect(screen.getByLabelText("Meeting inbox access key")).toHaveValue("");
      expect(checkbox).not.toBeChecked();
    },
  );
});
