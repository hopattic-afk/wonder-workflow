import { Resolver } from "node:dns/promises";
import { request as httpsRequest, type RequestOptions } from "node:https";
import { isIP } from "node:net";

export const WEBSITE_TIMEOUT_MS = 5000;
export const WEBSITE_MAX_BYTES = 128 * 1024;
export const WEBSITE_MAX_REDIRECTS = 2;
export interface WebsiteFact {
  text: string;
  sourceUrl: string;
  sourceTitle: string;
  accessedAt: string;
}
export interface WebsiteResearch {
  facts: WebsiteFact[];
  unavailable?: string;
}
export interface WebsiteResponse {
  status: number;
  headers: Record<string, string | undefined>;
  body: AsyncIterable<Uint8Array>;
  cancel?: () => void;
}
export interface WebsiteDependencies {
  resolve4?: (hostname: string, signal: AbortSignal) => Promise<string[]>;
  request?: (options: {
    url: URL;
    address: string;
    signal: AbortSignal;
  }) => Promise<WebsiteResponse>;
  now?: () => number;
}

class WebsiteUnavailable extends Error {}

/** Deliberately excludes all special-purpose IPv4 blocks, even globally routed exceptions.
 * Registry: https://www.iana.org/assignments/iana-ipv4-special-registry/
 * Only A records are used; IPv6 destinations and literal-IP URLs are unsupported.
 */
export function isPublicWebsiteIPv4(address: string): boolean {
  if (isIP(address) !== 4) return false;
  const [a, b, c] = address.split(".").map(Number);
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (
    a === 192 &&
    ((b === 0 && (c === 0 || c === 2)) ||
      (b === 31 && c === 196) ||
      (b === 52 && c === 193) ||
      (b === 88 && c === 99) ||
      b === 168 ||
      (b === 175 && c === 48))
  )
    return false;
  if (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100)))
    return false;
  if (a === 203 && b === 0 && c === 113) return false;
  // Azure's platform virtual IP is infrastructure, not a business website.
  if (address === "168.63.129.16") return false;
  return true;
}

export function validatePublicWebsiteUrl(input: string): URL {
  if (
    typeof input !== "string" ||
    !input.trim() ||
    input.length > 2048 ||
    /[\u0000-\u0020\u007f\\]/.test(input.trim())
  )
    throw new WebsiteUnavailable(
      "A valid public HTTPS business website was not provided.",
    );
  const value = input.trim();
  if (
    value.startsWith("/") ||
    (/^[a-z][a-z0-9+.-]*:/i.test(value) && !/^https:\/\//i.test(value))
  )
    throw new WebsiteUnavailable(
      "Only public HTTPS business websites are supported.",
    );
  let url: URL;
  try {
    url = new URL(/^https:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    throw new WebsiteUnavailable("The business website URL is invalid.");
  }
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  const suffixes = [
    "localhost",
    "local",
    "internal",
    "invalid",
    "test",
    "example",
    "onion",
    "home.arpa",
  ];
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (url.port && url.port !== "443") ||
    isIP(hostname) !== 0 ||
    hostname.includes(":") ||
    suffixes.some(
      (suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`),
    ) ||
    !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(
      hostname,
    )
  )
    throw new WebsiteUnavailable(
      "The website must use a public hostname and HTTPS port 443 without credentials.",
    );
  url.hostname = hostname;
  url.hash = "";
  return url;
}

function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) {
    void promise.catch(() => undefined);
    return Promise.reject(
      new WebsiteUnavailable("Website research timed out."),
    );
  }
  return new Promise<T>((resolve, reject) => {
    const stop = () =>
      reject(new WebsiteUnavailable("Website research timed out."));
    signal.addEventListener("abort", stop, { once: true });
    promise
      .then(resolve, reject)
      .finally(() => signal.removeEventListener("abort", stop));
  });
}

async function publicRecords(
  hostname: string,
  signal: AbortSignal,
): Promise<string[]> {
  const resolver = new Resolver({ timeout: WEBSITE_TIMEOUT_MS, tries: 1 });
  const cancel = () => resolver.cancel();
  signal.throwIfAborted();
  signal.addEventListener("abort", cancel, { once: true });
  try {
    return await resolver.resolve4(hostname);
  } finally {
    signal.removeEventListener("abort", cancel);
  }
}

/** The connection uses this exact validated address; a second DNS lookup is impossible.
 * Keep the hostname for TLS certificate/SNI verification and the HTTP Host header.
 * Do not substitute a generic fetch implementation that resolves DNS again.
 */
export function pinnedWebsiteRequestOptions(
  url: URL,
  address: string,
  signal: AbortSignal,
): RequestOptions {
  return {
    protocol: "https:",
    hostname: url.hostname,
    port: 443,
    path: `${url.pathname}${url.search}`,
    method: "GET",
    servername: url.hostname,
    rejectUnauthorized: true,
    agent: false,
    family: 4,
    signal,
    maxHeaderSize: 16 * 1024,
    lookup: (_hostname, _options, callback) => callback(null, address, 4),
    headers: {
      Accept: "text/html",
      "Accept-Encoding": "identity",
      "User-Agent": "McCann-Operations-Website-Preview/1.0",
    },
  };
}

function pinnedRequest({
  url,
  address,
  signal,
}: {
  url: URL;
  address: string;
  signal: AbortSignal;
}): Promise<WebsiteResponse> {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const request = httpsRequest(
      pinnedWebsiteRequestOptions(url, address, signal),
      (response) => {
        const headers: Record<string, string | undefined> = {};
        for (const [key, value] of Object.entries(response.headers))
          headers[key.toLowerCase()] = Array.isArray(value)
            ? value.join(", ")
            : value;
        resolve({
          status: response.statusCode ?? 0,
          headers,
          body: response,
          cancel: () => response.destroy(),
        });
      },
    );
    request.once("error", reject);
    request.end();
  });
}

function decodeEntities(value: string): string {
  const named: Record<string, string> = {
    amp: "&",
    quot: '"',
    apos: "'",
    lt: "<",
    gt: ">",
    nbsp: " ",
    ndash: "–",
    mdash: "—",
    copy: "©",
    reg: "®",
  };
  return value.replace(
    /&(#x[0-9a-f]+|#\d+|[a-z]+);/gi,
    (original, entity: string) => {
      if (!entity.startsWith("#"))
        return named[entity.toLowerCase()] ?? original;
      const number =
        entity[1].toLowerCase() === "x"
          ? parseInt(entity.slice(2), 16)
          : parseInt(entity.slice(1), 10);
      return Number.isInteger(number) &&
        number > 0 &&
        number <= 0x10ffff &&
        !(number >= 0xd800 && number <= 0xdfff)
        ? String.fromCodePoint(number)
        : " ";
    },
  );
}

function cleanMetadata(value: string, max: number): string {
  return decodeEntities(value.replace(/<[^>]*>/g, " "))
    .replace(/<[^>]*>/g, " ")
    .replace(
      /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u206f]/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function metadataFacts(
  html: string,
  sourceUrl: string,
  accessedAt: string,
): WebsiteFact[] {
  const source = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(
      /<(script|style|template|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,
      "",
    );
  const title = cleanMetadata(
    source.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i)?.[1] ?? "",
    240,
  );
  let description = "";
  for (const match of source.matchAll(
    /<meta\b(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi,
  )) {
    const attributes: Record<string, string> = {};
    for (const attribute of match[0].matchAll(
      /([^\s"'<>/=]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g,
    ))
      attributes[attribute[1].toLowerCase()] =
        attribute[2] ?? attribute[3] ?? attribute[4] ?? "";
    if (
      decodeEntities(attributes.name ?? "")
        .trim()
        .toLowerCase() === "description"
    ) {
      description = cleanMetadata(attributes.content ?? "", 600);
      break;
    }
  }
  const sourceTitle = title || new URL(sourceUrl).hostname;
  return [
    title ? `Website title: ${title}` : "",
    description ? `Website description: ${description}` : "",
  ]
    .filter(Boolean)
    .map((text) => ({ text, sourceUrl, sourceTitle, accessedAt }));
}

async function htmlBody(
  response: WebsiteResponse,
  signal: AbortSignal,
): Promise<string> {
  if (!/^text\/html(?:\s*;|\s*$)/i.test(response.headers["content-type"] ?? ""))
    throw new WebsiteUnavailable("The website did not return HTML.");
  const encoding = response.headers["content-encoding"]?.trim().toLowerCase();
  if (encoding && encoding !== "identity")
    throw new WebsiteUnavailable(
      "Compressed website responses are not supported for this bounded preview.",
    );
  const length = response.headers["content-length"];
  if (length && /^\d+$/.test(length) && Number(length) > WEBSITE_MAX_BYTES)
    throw new WebsiteUnavailable(
      "The website response exceeds the 128 KB limit.",
    );
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  const iterator = response.body[Symbol.asyncIterator]();
  try {
    while (true) {
      signal.throwIfAborted();
      const next = await abortable(Promise.resolve(iterator.next()), signal);
      if (next.done) break;
      if (!(next.value instanceof Uint8Array))
        throw new WebsiteUnavailable(
          "The website response format is unsupported.",
        );
      bytes += next.value.byteLength;
      if (bytes > WEBSITE_MAX_BYTES)
        throw new WebsiteUnavailable(
          "The website response exceeds the 128 KB limit.",
        );
      chunks.push(next.value);
    }
  } finally {
    if (iterator.return)
      void Promise.resolve(iterator.return()).catch(() => undefined);
  }
  return Buffer.concat(chunks).toString("utf8");
}

/** Optional public context only. Returns at most two attributed metadata observations;
 * it does not execute scripts, crawl links, infer business facts, or use an AI service.
 */
export async function fetchPublicWebsiteFacts(
  website: string,
  dependencies: WebsiteDependencies = {},
): Promise<WebsiteResearch> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WEBSITE_TIMEOUT_MS);
  const resolve4 = dependencies.resolve4 ?? publicRecords;
  const request = dependencies.request ?? pinnedRequest;
  let response: WebsiteResponse | undefined;
  try {
    let url = validatePublicWebsiteUrl(website);
    for (let redirects = 0; redirects <= WEBSITE_MAX_REDIRECTS; redirects++) {
      controller.signal.throwIfAborted();
      const addresses = await abortable(
        resolve4(url.hostname, controller.signal),
        controller.signal,
      );
      if (
        !Array.isArray(addresses) ||
        !addresses.length ||
        addresses.length > 64 ||
        addresses.some((address) => !isPublicWebsiteIPv4(address))
      )
        throw new WebsiteUnavailable(
          "The website does not resolve exclusively to supported public addresses.",
        );
      controller.signal.throwIfAborted();
      response = await abortable(
        request({ url, address: addresses[0], signal: controller.signal }),
        controller.signal,
      );
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.location;
        response.cancel?.();
        response = undefined;
        if (!location || redirects === WEBSITE_MAX_REDIRECTS)
          throw new WebsiteUnavailable(
            "The website redirect limit was reached or a redirect was invalid.",
          );
        let destination: string;
        try {
          destination = new URL(location, url).href;
        } catch {
          throw new WebsiteUnavailable("The website redirect was invalid.");
        }
        url = validatePublicWebsiteUrl(destination);
        continue;
      }
      if (response.status < 200 || response.status >= 300)
        throw new WebsiteUnavailable(
          "The website did not return a successful public page.",
        );
      const html = await htmlBody(response, controller.signal);
      const facts = metadataFacts(
        html,
        url.href,
        new Date((dependencies.now ?? Date.now)()).toISOString(),
      );
      return facts.length
        ? { facts }
        : {
            facts: [],
            unavailable: "No public website title or description was found.",
          };
    }
    throw new WebsiteUnavailable("The website redirect limit was reached.");
  } catch (error) {
    return {
      facts: [],
      unavailable: controller.signal.aborted
        ? "Website research timed out."
        : error instanceof WebsiteUnavailable
          ? error.message
          : "Public website research is temporarily unavailable.",
    };
  } finally {
    clearTimeout(timeout);
    controller.abort();
    response?.cancel?.();
  }
}
