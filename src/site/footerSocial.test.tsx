import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { organizationNode } from "./jsonld";
import Website from "./Website";

const INSTAGRAM_URL = "https://www.instagram.com/wonderandworkflow/";

describe("footer social links", () => {
  it("includes the Instagram profile URL in the footer", () => {
    render(
      <MemoryRouter>
        <Website />
      </MemoryRouter>,
    );

    const footer = document.querySelector(".ww-footer");
    expect(footer).toBeTruthy();

    const link = screen.getByRole("link", { name: "Instagram" });
    expect(footer).toContainElement(link);
    expect(link).toHaveAttribute("href", INSTAGRAM_URL);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link.closest("header")).toBeNull();
  });

  it("lists Instagram on Organization sameAs", () => {
    expect(organizationNode().sameAs).toEqual([INSTAGRAM_URL]);
  });
});
