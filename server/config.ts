import {
  INTAKE_LOCATION_ID,
  INTAKE_CALENDAR_ID,
} from "../src/domain/intakeSchema";
export interface BridgeConfig {
  origin: string;
  aliasOrigin?: string;
  brandOrigin?: string;
  inboxKey: string;
  sessionSecret: string;
  webhookSecret: string;
  ghlToken: string;
  locationId: string;
  calendarId: string;
  timezone: string;
  publicResearch?: boolean;
}
export type Environment = (key: string) => string | undefined;
export function readConfig(env: Environment): BridgeConfig | null {
  if (env("MCCANN_BRIDGE_ENABLED") !== "true") return null;
  const aliasOrigin = env("MCCANN_APP_ALIAS_ORIGIN");
  const brandOrigin = env("MCCANN_APP_BRAND_ORIGIN");
  const config = {
    origin: env("MCCANN_APP_ORIGIN") ?? "",
    ...(aliasOrigin !== undefined ? { aliasOrigin } : {}),
    ...(brandOrigin !== undefined ? { brandOrigin } : {}),
    inboxKey: env("MCCANN_INBOX_ACCESS_KEY") ?? "",
    sessionSecret: env("MCCANN_SESSION_SECRET") ?? "",
    webhookSecret: env("MCCANN_BOOKING_WEBHOOK_SECRET") ?? "",
    ghlToken: env("GHL_PRIVATE_INTEGRATION_TOKEN") ?? "",
    locationId: env("GHL_LOCATION_ID") ?? "",
    calendarId: env("GHL_CALENDAR_ID") ?? "",
    timezone: env("GHL_CALENDAR_TIMEZONE") ?? "",
  };
  try {
    for (const origin of [
      config.origin,
      ...(aliasOrigin !== undefined ? [aliasOrigin] : []),
      ...(brandOrigin !== undefined ? [brandOrigin] : []),
    ]) {
      const url = new URL(origin);
      if (
        url.protocol !== "https:" ||
        url.origin !== origin ||
        url.username ||
        url.password ||
        url.hostname.includes("*")
      )
        return null;
    }
    if (
      [config.inboxKey, config.sessionSecret, config.webhookSecret].some(
        (v) => v.length < 32 || v.length > 512 || new Set(v).size < 12,
      )
    )
      return null;
    if (
      new Set([config.inboxKey, config.sessionSecret, config.webhookSecret])
        .size !== 3
    )
      return null;
    if (
      config.ghlToken.length < 20 ||
      config.locationId !== INTAKE_LOCATION_ID ||
      config.calendarId !== INTAKE_CALENDAR_ID ||
      !config.timezone ||
      /^[+-]/.test(config.timezone)
    )
      return null;
    new Intl.DateTimeFormat("en", { timeZone: config.timezone });
    return {
      ...config,
      ...(env("MCCANN_PUBLIC_RESEARCH_ENABLED") === "true"
        ? { publicResearch: true }
        : {}),
    };
  } catch {
    return null;
  }
}
