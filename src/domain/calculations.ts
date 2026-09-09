import type {
  Amount,
  Calculation,
  Currency,
  RiskWarning,
  Session,
} from "./types";

const valid = (v: Amount): v is number =>
  v !== null && Number.isFinite(v) && v >= 0;
const product = (...vs: Amount[]): Amount =>
  vs.every(valid) ? finite(vs.reduce<number>((a, v) => a * v!, 1)) : null;
const finite = (v: number): Amount => (Number.isFinite(v) ? v : null);
const sum = (vs: Amount[]): Amount =>
  vs.some((v) => v === null || !Number.isFinite(v))
    ? null
    : finite(vs.reduce<number>((a, v) => a + v!, 0));
const percent = (v: Amount): Amount => (valid(v) && v <= 100 ? v / 100 : null);
export function money(value: Amount, currency: Currency = "USD"): string {
  return value === null || !Number.isFinite(value)
    ? "Not established"
    : new Intl.NumberFormat(currency === "CAD" ? "en-CA" : "en-US", {
        style: "currency",
        currency,
        currencyDisplay: "code",
        maximumFractionDigits: 2,
      }).format(value);
}
export function calculate(s: Session): Calculation {
  const c = s.calculator;
  const weeks = c.weeks > 0 && c.weeks <= 52 ? c.weeks : null;
  const currentHours = sum(
    c.labor.map((r) => (valid(r.hours) ? r.hours : null)),
  );
  const weeklyHours = sum(
    c.labor.map((r) => product(r.hours, percent(r.reduction))),
  );
  const annualHours = product(weeklyHours, weeks);
  const currentLabor = sum(c.labor.map((r) => product(r.hours, r.rate, weeks)));
  const labor = sum(
    c.labor.map((r) => product(r.hours, r.rate, percent(r.reduction), weeks)),
  );
  const currentSoftware = sum(
    s.software.map((r) => product(r.currentMonthly, 12)),
  );
  const futureSoftware = sum(
    s.software.map((r) => product(r.futureMonthly, 12)),
  );
  const subscriptions = sum(
    s.software.map((r) =>
      valid(r.currentMonthly) && valid(r.futureMonthly)
        ? finite(Math.max(r.currentMonthly - r.futureMonthly, 0) * 12)
        : null,
    ),
  );
  const rework = sum(
    c.rework.map((r) => product(r.incidents, r.cost, 12, percent(r.reduction))),
  );
  const avoidedHire = c.avoidedHire.include
    ? product(c.avoidedHire.annualCost, percent(c.avoidedHire.percentage))
    : 0;
  const recurring = sum(
    c.recurring.map((r) =>
      sum([product(r.monthly, 12), valid(r.annual) ? r.annual : null]),
    ),
  );
  const configured =
    c.labor.length + s.software.length + c.rework.length + c.recurring.length >
      0 || c.avoidedHire.include;
  const gross = configured
    ? sum([labor, subscriptions, rework, avoidedHire])
    : null;
  const net =
    gross !== null && recurring !== null ? finite(gross - recurring) : null;
  const discount = c.discount === null ? 0 : c.discount;
  const finalPrice =
    valid(c.price) && valid(discount) && discount <= c.price
      ? c.price - discount
      : null;
  const firstYear =
    net !== null && finalPrice !== null ? finite(net - finalPrice) : null;
  const payback =
    net !== null && net > 0 && finalPrice !== null
      ? finite(finalPrice / (net / 12))
      : null;
  const roi =
    firstYear !== null && finalPrice !== null && finalPrice > 0
      ? finite((firstYear / finalPrice) * 100)
      : null;
  const multiple =
    net !== null && finalPrice !== null && finalPrice > 0
      ? finite(net / finalPrice)
      : null;
  const warnings: string[] = [];
  const incomplete = gross === null || recurring === null;
  if (incomplete)
    warnings.push(
      "Estimated financial case: Not established. Complete all numeric fields in configured rows; enter 0 explicitly where applicable.",
    );
  if (net !== null && net <= 0)
    warnings.push("Financial payback cannot currently be demonstrated.");
  if (multiple !== null && multiple < 3)
    warnings.push(
      "The current assumptions do not yet support a 3× first-year value case.",
    );
  if (valid(c.price) && valid(discount) && discount > c.price)
    warnings.push("Discount cannot exceed the proposed implementation price.");
  if (
    s.software.some(
      (r) =>
        valid(r.currentMonthly) &&
        valid(r.futureMonthly) &&
        r.futureMonthly > r.currentMonthly,
    )
  )
    warnings.push(
      "A future software cost exceeds its current cost. Include the increase in new recurring costs; subscription savings are floored at zero.",
    );
  if (c.avoidedHire.include)
    warnings.push(
      "Avoided-hire savings are included. Confirm they do not overlap with hours reclaimed or other savings.",
    );
  return {
    weeklyHours,
    annualHours,
    currentHours,
    currentLabor,
    labor,
    currentSoftware,
    futureSoftware,
    subscriptions,
    rework,
    avoidedHire,
    recurring,
    gross,
    net,
    finalPrice,
    firstYear,
    payback,
    roi,
    multiple,
    warnings,
    incomplete,
  };
}
export function pilotFit(s: Session): { score: Amount; label: string } {
  const values = s.worksheet.fit;
  if (
    values.length !== 10 ||
    values.some((v) => v === null || !Number.isInteger(v) || v < 1 || v > 5)
  )
    return { score: null, label: "Not established" };
  const score = Math.round(
    (values.reduce<number>(
      (total, v, i) => total + ((i === 9 ? 6 - v! : v!) - 1),
      0,
    ) /
      40) *
      100,
  );
  return {
    score,
    label:
      score >= 75
        ? "Strong Pilot Candidate"
        : score >= 50
          ? "Requires Additional Scoping"
          : "Weak Initial Pilot",
  };
}
export function riskWarnings(s: Session): RiskWarning[] {
  const w = s.worksheet;
  const warnings: RiskWarning[] = [];
  const add = (code: string, message: string, hardStop = false) =>
    warnings.push({ code, message, hardStop });
  const highRisk = w.riskAreas.some((r) =>
    [
      "Financial decisions",
      "Employment decisions",
      "Medical information",
      "Legal advice",
      "Safety-critical decisions",
    ].includes(r),
  );
  if (highRisk)
    add(
      "consequential",
      "Consequential outputs require a qualified human-review step and agreed controls.",
      true,
    );
  if (highRisk && w.autonomous === "Yes")
    add(
      "autonomous-high-risk",
      "Hard stop: high-risk decisions must not be fully autonomous.",
      true,
    );
  if (
    !w.reviewer.trim() ||
    /^(none|no|not available|unavailable)$/i.test(w.reviewer.trim())
  )
    add(
      "no-reviewer",
      "No human reviewer is established. Assign a reviewer before proceeding.",
      true,
    );
  if (!["Yes", "Confirmed", "Clear"].includes(w.dataRights))
    add(
      "data-rights",
      "Data usage rights are unclear. Confirm permission before using client information.",
      true,
    );
  if (
    w.classifications.some((v) => /Marketing|lead generation/i.test(v)) ||
    w.decision === "Refer marketing request to Justin"
  )
    add("marketing", "Out of scope for AI Operations — refer to Justin.", true);
  if (!w.baseline.trim())
    add(
      "baseline",
      "A measurable baseline is not established. Confirm the metric and tracking method.",
    );
  if ([w.fit[0], w.fit[2], w.fit[3]].some((v) => v !== null && v <= 2))
    add(
      "inconsistent",
      "The process or its inputs and outputs may be too inconsistent to automate reliably. Consider process cleanup first.",
    );
  if (
    s.software.some(
      (r) =>
        !r.integration.trim() ||
        /^(no|none|unknown|not established)$/i.test(r.integration.trim()),
    )
  )
    add(
      "integration",
      "A software integration or export method is not established. Confirm access before committing scope.",
    );
  if (w.escalation !== "Yes")
    add(
      "escalation",
      "An escalation path is not established. Agree how exceptions will be handled.",
    );
  return warnings;
}
