// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { captureCampaign, publicHref } from "./campaign";

describe("public campaign navigation", () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, "", "/");
  });
  it("keeps only bounded campaign fields through an untagged navigation", () => {
    captureCampaign(
      `?utm_source=partner&utm_campaign=${"x".repeat(220)}&email=private@example.com`,
    );
    const destination = new URL(
      publicHref("/assessment"),
      window.location.origin,
    );
    expect(destination.searchParams.get("utm_source")).toBe("partner");
    expect(destination.searchParams.get("utm_campaign")).toHaveLength(200);
    expect(destination.searchParams.has("email")).toBe(false);
    expect(sessionStorage.getItem("ww-campaign-touch")).not.toContain(
      "private",
    );
  });
  it("replaces a previous campaign touch rather than mixing fields", () => {
    captureCampaign("?utm_source=old&utm_medium=email&utm_campaign=old-launch");
    captureCampaign("?utm_source=new");
    expect(publicHref("/book#calendar")).toBe("/book?utm_source=new#calendar");
  });
  it("does not erase a valid campaign with empty incoming tags", () => {
    captureCampaign("?utm_source=partner&utm_medium=referral");
    captureCampaign("?utm_source=   ");
    window.history.replaceState({}, "", "/?utm_source=");
    expect(publicHref("/assessment")).toBe(
      "/assessment?utm_source=partner&utm_medium=referral",
    );
  });
  it("uses current URL tags before effects run and preserves explicit destination tags", () => {
    captureCampaign("?utm_source=old");
    window.history.replaceState({}, "", "/?utm_source=new&utm_medium=referral");
    expect(publicHref("/assessment?utm_source=explicit")).toBe(
      "/assessment?utm_source=explicit&utm_medium=referral",
    );
    expect(publicHref("https://example.com/book")).toBe(
      "https://example.com/book",
    );
    expect(publicHref("//example.com/book")).toBe("//example.com/book");
  });
});
