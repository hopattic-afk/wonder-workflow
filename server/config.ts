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
  const setting = (primary: string, legacy: string) =>
    env(primary) ?? env(legacy);
  if (setting("WW_BRIDGE_ENABLED", "MCCANN_BRIDGE_ENABLED") !== "true")
    return null;
  const aliasOrigin = setting("WW_APP_ALIAS_ORIGIN", "MCCANN_APP_ALIAS_ORIGIN");
  const brandOrigin = setting("WW_APP_BRAND_ORIGIN", "MCCANN_APP_BRAND_ORIGIN");
  const config = {
    origin: setting("WW_APP_ORIGIN", "MCCANN_APP_ORIGIN") ?? "",
    ...(aliasOrigin !== undefined ? { aliasOrigin } : {}),
    ...(brandOrigin !== undefined ? { brandOrigin } : {}),
    inboxKey: setting("WW_INBOX_ACCESS_KEY", "MCCANN_INBOX_ACCESS_KEY") ?? "",
    sessionSecret: setting("WW_SESSION_SECRET", "MCCANN_SESSION_SECRET") ?? "",
    webhookSecret: setting("WW_BOOKING_WEBHOOK_SECRET", "MCCANN_BOOKING_WEBHOOK_SECRET") ?? "",
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
      ...(setting("WW_PUBLIC_RESEARCH_ENABLED", "MCCANN_PUBLIC_RESEARCH_ENABLED") === "true"
        ? { publicResearch: true }
        : {}),
    };
  } catch {
    return null;
  }
}
