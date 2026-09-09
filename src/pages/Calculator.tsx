import { Link } from "react-router-dom";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import {
  Plus,
  Trash2,
  ArrowRight,
  Calculator as CalculatorIcon,
  AlertTriangle,
} from "lucide-react";
import type { Session } from "../domain/types";
import { calculate, money } from "../domain/calculations";
import { newLabor, newRework, newRecurring } from "../domain/defaults";
import { SessionForm, Field, Fields, type FieldSpec } from "../components/Form";
import { SoftwareRows } from "./Worksheet";
export function Calculator({
  session,
  onChange,
}: {
  session: Session;
  onChange: (s: Session) => void;
}) {
  const total = calculate(session);
  const cash = (n: number | null) => money(n, session.client.currency);
  return (
    <SessionForm session={session} onChange={onChange}>
      <header className="page-heading compact">
        <div>
          <div className="eyebrow">02 / QUANTIFY THE OPPORTUNITY</div>
          <h1>Savings calculator</h1>
          <p className="muted">
            A financial case built from the assumptions you can explain.
          </p>
        </div>
        <div className="currency-chip">
          {session.client.currency} <span>· no sales tax</span>
        </div>
      </header>
      <div className="estimate-banner">
        <CalculatorIcon size={17} />
        <p>
          All outputs are estimates. Hours reclaimed represent capacity; they
          are not automatically cash savings. Avoid counting the same benefit in
          labor, rework, and avoided hiring.
        </p>
      </div>
      <div className="calculator-layout">
        <div className="calculator-inputs">
          <section className="panel">
            <div className="panel-heading">
              <h2>Labor savings</h2>
              <span className="eyebrow">A / TIME RECLAIMED</span>
            </div>
            <div className="weeks-field">
              <Field
                name="calculator.weeks"
                label="Working weeks per year"
                type="number"
                min={1}
                max={52}
              />
            </div>
            <FinancialRows kind="labor" session={session} />
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h2>Subscription savings</h2>
              <span className="eyebrow">B / SOFTWARE</span>
            </div>
            <SoftwareRows />
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h2>Error & rework savings</h2>
              <span className="eyebrow">C / LESS REWORK</span>
            </div>
            <FinancialRows kind="rework" session={session} />
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h2>Avoided or delayed hire</h2>
              <span className="eyebrow">D / OPTIONAL</span>
            </div>
            <p className="muted">
              Excluded from the conservative case by default. Check for overlap
              with labor hours already counted.
            </p>
            <Fields
              items={[
                {
                  name: "calculator.avoidedHire.role",
                  label: "Potential hire role",
                },
                {
                  name: "calculator.avoidedHire.annualCost",
                  label: "Loaded annual employment cost",
                  type: "number",
                },
                {
                  name: "calculator.avoidedHire.percentage",
                  label: "Hire potentially avoided or delayed (%)",
                  type: "number",
                  max: 100,
                },
              ]}
            />
            <IncludeHire />
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h2>New recurring costs</h2>
              <span className="eyebrow">E / COST TO OPERATE</span>
            </div>
            <p className="muted">
              Monthly × 12 plus additional annual cost. Enter 0 in the unused
              field; do not enter the same cost twice.
            </p>
            <FinancialRows kind="recurring" session={session} />
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h2>Implementation investment</h2>
              <span className="eyebrow">F / MANUALLY PRICED</span>
            </div>
            <p className="muted">
              Price the agreed scope after the audit. Pricing stays synchronized
              with the proposal.
            </p>
            <Fields
              items={[
                {
                  name: "calculator.price",
                  label: "Proposed implementation price",
                  type: "number",
                },
                {
                  name: "calculator.discount",
                  label: "Founding-client discount (amount, optional)",
                  type: "number",
                },
                {
                  name: "calculator.pricingNotes",
                  label: "Internal pricing notes",
                  type: "textarea",
                  wide: true,
                },
              ]}
            />
            <div className="price-line">
              <span>Final project price</span>
              <strong>{cash(total.finalPrice)}</strong>
            </div>
          </section>
        </div>
        <aside className="financial-summary">
          <div className="panel summary-panel">
            <div className="eyebrow">THE ESTIMATED OPPORTUNITY</div>
            <h2>Annual recurring savings</h2>
            <div className="hero-amount" data-testid="net-savings">
              {cash(total.net)}
            </div>
            <p className="muted">
              Net estimate · {session.client.currency} / year
            </p>
            <div className="hours-reclaimed">
              <strong>
                {total.weeklyHours === null
                  ? "—"
                  : total.weeklyHours.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
              </strong>
              <span>
                estimated hours
                <br />
                reclaimed / week
              </span>
            </div>
            <dl className="financial-lines">
              <div>
                <dt>Est. annual hours reclaimed</dt>
                <dd>
                  {total.annualHours === null
                    ? "Not established"
                    : total.annualHours.toLocaleString()}
                </dd>
              </div>
              <div>
                <dt>Est. annual labor savings</dt>
                <dd>{cash(total.labor)}</dd>
              </div>
              <div>
                <dt>Est. current annual software</dt>
                <dd>{cash(total.currentSoftware)}</dd>
              </div>
              <div>
                <dt>Est. future annual software</dt>
                <dd>{cash(total.futureSoftware)}</dd>
              </div>
              <div>
                <dt>Est. subscription savings</dt>
                <dd>{cash(total.subscriptions)}</dd>
              </div>
              <div>
                <dt>Est. rework savings</dt>
                <dd>{cash(total.rework)}</dd>
              </div>
              {session.calculator.avoidedHire.include && (
                <div>
                  <dt>Est. avoided hire savings</dt>
                  <dd>{cash(total.avoidedHire)}</dd>
                </div>
              )}
              <div className="subtotal">
                <dt>Est. gross annual savings</dt>
                <dd>{cash(total.gross)}</dd>
              </div>
              <div>
                <dt>Est. new annual costs</dt>
                <dd>{cash(total.recurring)}</dd>
              </div>
              <div className="subtotal">
                <dt>Est. first-year net benefit</dt>
                <dd>{cash(total.firstYear)}</dd>
              </div>
            </dl>
            <div className="return-grid">
              <div>
                <span>EST. PAYBACK</span>
                <strong>
                  {total.payback === null
                    ? "Not established"
                    : `${total.payback.toFixed(2)} mo`}
                </strong>
              </div>
              <div>
                <span>EST. FIRST-YEAR ROI</span>
                <strong>
                  {total.roi === null
                    ? "Not established"
                    : `${total.roi.toFixed(0)}%`}
                </strong>
              </div>
              <div>
                <span>EST. ANNUAL VALUE</span>
                <strong>
                  {total.multiple === null
                    ? "Not established"
                    : `${total.multiple.toFixed(2)}×`}
                </strong>
              </div>
            </div>
            {total.warnings.map((warning, i) => (
              <div className="notice danger" key={i}>
                <AlertTriangle size={15} />
                <p>{warning}</p>
              </div>
            ))}
            {total.incomplete && (
              <p className="notice">
                Some assumptions are missing. Complete each included row to
                establish the full financial case.
              </p>
            )}
            <Link
              className="button primary full-width"
              to={`/audit/${session.id}/recommendation`}
            >
              Build recommendation
              <ArrowRight size={16} />
            </Link>
            <p className="summary-footnote">
              Estimates depend on the entered assumptions and must be validated
              during implementation.
            </p>
          </div>
        </aside>
      </div>
    </SessionForm>
  );
}
function IncludeHire() {
  const { control } = useFormContext<Session>();
  return (
    <Controller
      control={control}
      name="calculator.avoidedHire.include"
      render={({ field }) => (
        <label className="check-label include-hire">
          <input
            type="checkbox"
            checked={field.value}
            onChange={(e) => field.onChange(e.target.checked)}
          />
          Include avoided-hire savings in the financial case
        </label>
      )}
    />
  );
}
function FinancialRows({
  kind,
  session,
}: {
  kind: "labor" | "rework" | "recurring";
  session: Session;
}) {
  const { control, getValues } = useFormContext<Session>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `calculator.${kind}`,
    keyName: "fieldKey",
  });
  const label =
    kind === "labor"
      ? "labor role"
      : kind === "rework"
        ? "rework item"
        : "recurring cost";
  const definitions: Record<typeof kind, FieldSpec[]> = {
    labor: [
      { name: "role", label: "Role" },
      { name: "hours", label: "Current hours per week", type: "number" },
      { name: "rate", label: "Fully loaded hourly labor cost", type: "number" },
      {
        name: "reduction",
        label: "Estimated work reduced (%)",
        type: "number",
        max: 100,
      },
      {
        name: "notes",
        label: "Labor assumptions / notes",
        type: "textarea",
        wide: true,
      },
    ],
    rework: [
      { name: "name", label: "Error or rework type" },
      { name: "incidents", label: "Incidents per month", type: "number" },
      { name: "cost", label: "Average cost per incident", type: "number" },
      {
        name: "reduction",
        label: "Expected reduction (%)",
        type: "number",
        max: 100,
      },
    ],
    recurring: [
      { name: "name", label: "Cost name" },
      {
        name: "category",
        label: "Cost category",
        type: "select",
        options: [
          "AI software",
          "Automation software",
          "API usage",
          "Hosting",
          "Maintenance",
          "Support",
          "Other",
        ],
      },
      { name: "monthly", label: "Monthly cost", type: "number" },
      { name: "annual", label: "Additional annual cost", type: "number" },
      {
        name: "notes",
        label: "Recurring cost notes",
        type: "textarea",
        wide: true,
      },
    ],
  };
  return (
    <div className="repeat-rows">
      {fields.map((row, i) => (
        <section className="line-item" key={row.fieldKey}>
          <div className="line-heading">
            <h3>
              {label[0].toUpperCase() + label.slice(1)} {i + 1}
            </h3>
            <button
              type="button"
              className="icon-button danger-text"
              aria-label={`Remove ${label} ${i + 1}`}
              onClick={() => {
                if (confirm(`Remove ${label} ${i + 1} and its assumptions?`))
                  remove(i);
              }}
            >
              <Trash2 size={15} />
            </button>
          </div>
          <Fields
            items={definitions[kind].map((f) => ({
              ...f,
              name: `calculator.${kind}.${i}.${f.name}`,
            }))}
          />
          {kind === "labor" && (
            <p className="row-estimate">
              Estimated weekly hours reclaimed:{" "}
              {(() => {
                const r = session.calculator.labor[i];
                return r && r.hours !== null && r.reduction !== null
                  ? ((r.hours * r.reduction) / 100).toFixed(2)
                  : "Not established";
              })()}{" "}
              · Estimated annual labor savings:{" "}
              {(() => {
                const r = session.calculator.labor[i];
                return money(
                  r &&
                    r.hours !== null &&
                    r.reduction !== null &&
                    r.rate !== null
                    ? ((r.hours * r.reduction) / 100) *
                        session.calculator.weeks *
                        r.rate
                    : null,
                  session.client.currency,
                );
              })()}
            </p>
          )}
        </section>
      ))}
      <div className="inline-actions">
        <button
          type="button"
          className="button secondary"
          onClick={() =>
            append(
              kind === "labor"
                ? newLabor()
                : kind === "rework"
                  ? newRework()
                  : newRecurring(),
            )
          }
        >
          <Plus size={16} />
          Add {label}
        </button>
        {kind === "labor" && fields.length === 0 && (
          <button
            type="button"
            className="text-button"
            onClick={() =>
              append({
                ...newLabor(),
                role: getValues("worksheet.baselineRoles"),
                hours: getValues("worksheet.baselineHours"),
                rate: getValues("worksheet.baselineRate"),
              })
            }
          >
            Use worksheet baseline
          </button>
        )}
      </div>
    </div>
  );
}
