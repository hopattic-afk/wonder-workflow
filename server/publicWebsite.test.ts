// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchPublicWebsiteFacts,
  isPublicWebsiteIPv4,
  pinnedWebsiteRequestOptions,
  validatePublicWebsiteUrl,
  WEBSITE_MAX_BYTES,
  WEBSITE_TIMEOUT_MS,
  type WebsiteDependencies,
  type WebsiteResponse,
} from "./publicWebsite";

const publicAddress = "93.184.216.34";
async function* chunks(...values: string[]) {
  for (const value of values) yield Buffer.from(value);
}
function response(
  html = "<html><head><title>Example Workshop</title><meta name='description' content='Public business description'></head></html>",
  overrides: Partial<WebsiteResponse> = {},
): WebsiteResponse {
  return {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
    body: chunks(html),
    cancel: vi.fn(),
    ...overrides,
  };
}
function dependencies(overrides: WebsiteDependencies = {}) {
  return {
    resolve4: vi.fn().mockResolvedValue([publicAddress]),
    request: vi.fn().mockResolvedValue(response()),
    now: () => Date.parse("2026-09-05T12:00:00Z"),
    ...overrides,
  };
}
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("public website destination checks", () => {
  it.each([
    "https://127.0.0.1",
    "https://2130706433",
    "https://0x7f000001",
    "https://[::1]",
    "https://[::ffff:127.0.0.1]",
    "https://10.0.0.1",
    "https://1.1.1.1",
    "https://localhost",
    "https://localhost.",
    "https://service.local",
    "https://metadata.google.internal",
    "https://intranet",
    "https://host.home.arpa",
    "https://name.invalid",
    "http://example.com",
    "ftp://example.com",
    "file:///etc/passwd",
    "//example.com",
    "https://user:password@example.com",
    "https://example.com:8443",
    "https://example.com\\@localhost",
  ])("rejects unsafe or unsupported URL %s before DNS", async (url) => {
    const deps = dependencies();
    const result = await fetchPublicWebsiteFacts(url, deps);
    expect(result.facts).toEqual([]);
    expect(result.unavailable).toBeTruthy();
    expect(deps.resolve4).not.toHaveBeenCalled();
    expect(deps.request).not.toHaveBeenCalled();
  });

  it("normalizes a bare business hostname to HTTPS and drops fragments", () => {
    expect(validatePublicWebsiteUrl("example.com/about#team").href).toBe(
      "https://example.com/about",
    );
    expect(validatePublicWebsiteUrl("https://EXAMPLE.com.:443/").href).toBe(
      "https://example.com/",
    );
  });

  it.each([
    "0.0.0.0",
    "10.0.0.1",
    "100.64.0.1",
    "100.127.255.254",
    "127.1.2.3",
    "169.254.169.254",
    "172.16.0.1",
    "172.31.255.254",
    "192.0.0.9",
    "192.0.2.1",
    "192.31.196.1",
    "192.52.193.1",
    "192.88.99.1",
    "192.168.1.2",
    "192.175.48.1",
    "198.18.0.1",
    "198.19.0.1",
    "198.51.100.1",
    "203.0.113.1",
    "224.0.0.1",
    "239.255.255.255",
    "240.0.0.1",
    "255.255.255.255",
    "168.63.129.16",
    "::1",
  ])("denies special-purpose address %s", (address) =>
    expect(isPublicWebsiteIPv4(address)).toBe(false),
  );

  it("rejects an entire mixed DNS answer set if any record is private", async () => {
    for (const records of [
      [publicAddress, "127.0.0.1"],
      ["10.0.0.1", publicAddress],
      [],
      ["not-an-address"],
    ]) {
      const deps = dependencies({
        resolve4: vi.fn().mockResolvedValue(records),
      });
      const result = await fetchPublicWebsiteFacts("https://example.com", deps);
      expect(result.facts).toEqual([]);
      expect(deps.request).not.toHaveBeenCalled();
    }
  });

  it("pins the validated address and retains hostname certificate validation", async () => {
    const resolver = vi
      .fn()
      .mockResolvedValueOnce([publicAddress, "1.1.1.1"])
      .mockResolvedValue(["127.0.0.1"]);
    const requester = vi
      .fn()
      .mockImplementation(async ({ url, address, signal }) => {
        expect(address).toBe(publicAddress);
        const options = pinnedWebsiteRequestOptions(url, address, signal);
        expect(options.hostname).toBe("example.com");
        expect(options.servername).toBe("example.com");
        expect(options.rejectUnauthorized).toBe(true);
        expect(options.agent).toBe(false);
        expect(options.family).toBe(4);
        const callback = vi.fn();
        options.lookup!("example.com", {}, callback);
        expect(callback).toHaveBeenCalledWith(null, publicAddress, 4);
        return response();
      });
    const result = await fetchPublicWebsiteFacts(
      "https://example.com",
      dependencies({ resolve4: resolver, request: requester }),
    );
    expect(result.facts).toHaveLength(2);
    expect(resolver).toHaveBeenCalledTimes(1);
  });
});

describe("website redirect and resource limits", () => {
  it("revalidates DNS on every redirect, including the same hostname", async () => {
    const resolver = vi
      .fn()
      .mockResolvedValueOnce([publicAddress])
      .mockResolvedValueOnce(["127.0.0.1"]);
    const redirect = response("", {
      status: 302,
      headers: { location: "/about" },
    });
    const requester = vi.fn().mockResolvedValue(redirect);
    const result = await fetchPublicWebsiteFacts(
      "https://example.com",
      dependencies({ resolve4: resolver, request: requester }),
    );
    expect(result.unavailable).toContain("public addresses");
    expect(resolver).toHaveBeenCalledTimes(2);
    expect(requester).toHaveBeenCalledTimes(1);
    expect(redirect.cancel).toHaveBeenCalled();
  });

  it.each([
    "http://example.org",
    "https://127.0.0.1",
    "https://private.local",
    "https://name:secret@example.org",
  ])("denies unsafe redirect %s", async (location) => {
    const deps = dependencies({
      request: vi
        .fn()
        .mockResolvedValue(
          response("", { status: 301, headers: { location } }),
        ),
    });
    const result = await fetchPublicWebsiteFacts("https://example.com", deps);
    expect(result.facts).toEqual([]);
    expect(deps.resolve4).toHaveBeenCalledTimes(1);
    expect(deps.request).toHaveBeenCalledTimes(1);
  });

  it("limits redirects to two hops and attributes successful facts to the final page", async () => {
    const requester = vi
      .fn()
      .mockResolvedValueOnce(
        response("", {
          status: 301,
          headers: { location: "https://example.org/" },
        }),
      )
      .mockResolvedValueOnce(
        response("", { status: 302, headers: { location: "/about" } }),
      )
      .mockResolvedValueOnce(response());
    const deps = dependencies({ request: requester });
    const result = await fetchPublicWebsiteFacts("https://example.com", deps);
    expect(result.facts[0].sourceUrl).toBe("https://example.org/about");
    expect(requester).toHaveBeenCalledTimes(3);
    const looping = dependencies({
      request: vi
        .fn()
        .mockResolvedValue(
          response("", { status: 302, headers: { location: "/loop" } }),
        ),
    });
    expect(
      (await fetchPublicWebsiteFacts("https://example.com", looping))
        .unavailable,
    ).toContain("redirect limit");
    expect(looping.request).toHaveBeenCalledTimes(3);
  });

  it("enforces declared and streamed byte limits and cancels the body", async () => {
    const declared = response("", {
      headers: {
        "content-type": "text/html",
        "content-length": String(WEBSITE_MAX_BYTES + 1),
      },
    });
    const streamed = response("", {
      body: chunks("x".repeat(WEBSITE_MAX_BYTES), "x"),
    });
    for (const candidate of [declared, streamed]) {
      const result = await fetchPublicWebsiteFacts(
        "https://example.com",
        dependencies({ request: vi.fn().mockResolvedValue(candidate) }),
      );
      expect(result.unavailable).toContain("128 KB");
      expect(candidate.cancel).toHaveBeenCalled();
    }
  });

  it("rejects non-HTML, compressed responses and unsuccessful status codes", async () => {
    for (const candidate of [
      response("{}", { headers: { "content-type": "application/json" } }),
      response("compressed", {
        headers: { "content-type": "text/html", "content-encoding": "gzip" },
      }),
      response("", { status: 403 }),
    ]) {
      const result = await fetchPublicWebsiteFacts(
        "https://example.com",
        dependencies({ request: vi.fn().mockResolvedValue(candidate) }),
      );
      expect(result.facts).toEqual([]);
      expect(result.unavailable).toBeTruthy();
      expect(candidate.cancel).toHaveBeenCalled();
    }
  });

  it("includes DNS resolution in the five-second deadline", async () => {
    vi.useFakeTimers();
    const resolver = vi
      .fn()
      .mockImplementation(() => new Promise(() => undefined));
    const deps = dependencies({ resolve4: resolver });
    const pending = fetchPublicWebsiteFacts("https://example.com", deps);
    await vi.advanceTimersByTimeAsync(WEBSITE_TIMEOUT_MS + 1);
    expect((await pending).unavailable).toContain("timed out");
    expect(deps.request).not.toHaveBeenCalled();
    expect(resolver.mock.calls[0][1].aborted).toBe(true);
  });

  it("aborts a stalled response stream at the overall deadline", async () => {
    vi.useFakeTimers();
    async function* stalled() {
      await new Promise(() => undefined);
      yield Buffer.from("unreachable");
    }
    const candidate = response("", { body: stalled() });
    const pending = fetchPublicWebsiteFacts(
      "https://example.com",
      dependencies({ request: vi.fn().mockResolvedValue(candidate) }),
    );
    await vi.advanceTimersByTimeAsync(WEBSITE_TIMEOUT_MS + 1);
    expect((await pending).unavailable).toContain("timed out");
    expect(candidate.cancel).toHaveBeenCalled();
  });

  it("uses one shared deadline across DNS, requests and redirects", async () => {
    vi.useFakeTimers();
    const delay = (milliseconds: number) =>
      new Promise((resolve) => setTimeout(resolve, milliseconds));
    const resolver = vi.fn().mockImplementation(async () => {
      await delay(1800);
      return [publicAddress];
    });
    const requester = vi.fn().mockImplementation(async () => {
      await delay(500);
      return response("", { status: 302, headers: { location: "/next" } });
    });
    const pending = fetchPublicWebsiteFacts(
      "https://example.com",
      dependencies({ resolve4: resolver, request: requester }),
    );
    await vi.advanceTimersByTimeAsync(WEBSITE_TIMEOUT_MS + 1);
    expect((await pending).unavailable).toContain("timed out");
    expect(requester).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(10000);
    expect(requester).toHaveBeenCalledTimes(2);
  });
});

describe("bounded website metadata", () => {
  it("extracts at most two attributed metadata observations without executing scripts", async () => {
    vi.stubGlobal("websiteScriptExecuted", false);
    const html = `<html><head><script>globalThis.websiteScriptExecuted=true; '<title>Fake script title</title>';</script><!-- <title>Fake comment</title> --><title> Pine &amp; Field &#x2014; Services </title><meta content="Repairs &amp; maintenance.&#10; Locally owned." NAME='DESCRIPTION'><meta name='description' content='Ignored second description'></head></html>`;
    const result = await fetchPublicWebsiteFacts(
      "https://example.com/about",
      dependencies({ request: vi.fn().mockResolvedValue(response(html)) }),
    );
    expect(result.facts).toEqual([
      {
        text: "Website title: Pine & Field — Services",
        sourceUrl: "https://example.com/about",
        sourceTitle: "Pine & Field — Services",
        accessedAt: "2026-09-05T12:00:00.000Z",
      },
      {
        text: "Website description: Repairs & maintenance. Locally owned.",
        sourceUrl: "https://example.com/about",
        sourceTitle: "Pine & Field — Services",
        accessedAt: "2026-09-05T12:00:00.000Z",
      },
    ]);
    expect(
      (globalThis as unknown as Record<string, unknown>).websiteScriptExecuted,
    ).toBe(false);
  });

  it("bounds metadata length, strips markup/control characters and handles absent metadata", async () => {
    const html = `<title>${"T".repeat(1000)}</title><meta name=description content="&lt;b&gt;${"D".repeat(2000)}&#0;&lt;/b&gt;">`;
    const result = await fetchPublicWebsiteFacts(
      "example.com",
      dependencies({ request: vi.fn().mockResolvedValue(response(html)) }),
    );
    expect(result.facts[0].sourceTitle).toHaveLength(240);
    expect(result.facts[1].text).toHaveLength(
      "Website description: ".length + 600,
    );
    expect(result.facts[1].text).not.toContain("<b>");
    const absent = await fetchPublicWebsiteFacts(
      "example.com",
      dependencies({
        request: vi
          .fn()
          .mockResolvedValue(
            response("<html><body>Public page without metadata</body></html>"),
          ),
      }),
    );
    expect(absent.facts).toEqual([]);
    expect(absent.unavailable).toContain(
      "No public website title or description",
    );
  });
});
