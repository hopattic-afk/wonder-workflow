const key = "ww-campaign-touch";
const allowed = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

function campaign(search: string) {
  const source = new URLSearchParams(search);
  const result = new URLSearchParams();
  for (const name of allowed) {
    const value = source.get(name)?.trim().slice(0, 200);
    if (value) result.set(name, value);
  }
  return result;
}

/** A new tagged visit replaces the entire touch; unrelated query data is never stored. */
export function captureCampaign(search: string) {
  const touch = campaign(search).toString();
  if (!touch) return;
  try {
    sessionStorage.setItem(key, touch);
  } catch {
    /* Storage may be unavailable. URL propagation still works. */
  }
}

/** Carry campaign context only between same-site paths, including the assessment. */
export function publicHref(path: string) {
  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    typeof window === "undefined"
  )
    return path;
  const current = campaign(window.location.search).toString();
  let touch = "";
  if (current) touch = current;
  else {
    try {
      touch = campaign(sessionStorage.getItem(key) || "").toString();
    } catch {
      /* Optional storage. */
    }
  }
  const target = new URL(path, window.location.origin);
  for (const [name, value] of new URLSearchParams(touch))
    if (!target.searchParams.has(name)) target.searchParams.set(name, value);
  return `${target.pathname}${target.search}${target.hash}`;
}
