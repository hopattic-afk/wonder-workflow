export const ASSESSMENT_SCORE_MAX = 21;
export const DEFAULT_ACCENT = "#C29A60";
export const LEGACY_DEFAULT_ACCENT = "#D4AF37";
export const OPERATIONS_TITLE = "Operations Audit";
export const LEGACY_DEFAULT_COMPANY = "McCann Contracting LLC";

// Unsigned documents are unbranded; retain historical identity without migration.
export function displayCompany(
  company: string,
  preserveHistorical = false,
): string {
  if (preserveHistorical) return company;
  return "";
}
