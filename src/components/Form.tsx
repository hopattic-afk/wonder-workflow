import { useEffect, useRef, type ReactNode } from "react";
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
  type FieldPath,
} from "react-hook-form";
import type { Session } from "../domain/types";
export type FieldSpec = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "email" | "url" | "date" | "select";
  options?: readonly string[];
  help?: string;
  max?: number;
  min?: number;
  wide?: boolean;
  placeholder?: string;
};
function getPath(object: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce((value, key) => (value as Record<string, unknown>)?.[key], object);
}
function setPath(object: unknown, path: string, value: unknown) {
  const keys = path.split(".");
  const last = keys.pop()!;
  const parent = keys.reduce(
    (o, k) => (o as Record<string, unknown>)[k],
    object,
  );
  (parent as Record<string, unknown>)[last] = value;
}
export function SessionForm({
  session,
  onChange,
  children,
}: {
  session: Session;
  onChange: (s: Session) => void;
  children: ReactNode;
}) {
  const methods = useForm<Session>({
    defaultValues: session,
    mode: "onChange",
  });
  const latest = useRef({ session, onChange });
  latest.current = { session, onChange };
  useEffect(() => {
    const sub = methods.watch((values, { name }) => {
      if (!name) return;
      const next = structuredClone(latest.current.session);
      setPath(next, name, getPath(values, name));
      latest.current.onChange(next);
    });
    return () => sub.unsubscribe();
  }, [methods]);
  return (
    <FormProvider {...methods}>
      <form onSubmit={(e) => e.preventDefault()} noValidate>
        {children}
      </form>
    </FormProvider>
  );
}
export function Field({
  name,
  label,
  type = "text",
  options,
  help,
  max,
  min = 0,
  wide,
  placeholder,
}: FieldSpec) {
  const { control } = useFormContext<Session>();
  const id = `field-${name}`;
  return (
    <Controller
      name={name as FieldPath<Session>}
      control={control}
      rules={{
        validate: (value) => {
          if (value === "" || value === null || value === undefined)
            return true;
          if (type === "number")
            return (
              (typeof value === "number" &&
                Number.isFinite(value) &&
                value >= min &&
                (max === undefined || value <= max)) ||
              `Enter a number from ${min}${max !== undefined ? ` to ${max}` : " or higher"}.`
            );
          if (type === "email")
            return (
              /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)) ||
              "Enter a valid email address."
            );
          if (type === "url")
            return (
              /^https?:\/\/\S+$/i.test(String(value)) ||
              "Use a complete http:// or https:// address."
            );
          return (
            String(value).length <= 12000 ||
            "Please keep this field under 12,000 characters."
          );
        },
      }}
      render={({ field, fieldState }) => (
        <div className={`field ${wide ? "wide" : ""}`}>
          <label htmlFor={id}>{label}</label>
          {type === "textarea" ? (
            <textarea
              {...field}
              value={String(field.value ?? "")}
              id={id}
              rows={3}
              maxLength={12000}
              placeholder={placeholder}
              aria-invalid={!!fieldState.error}
              aria-describedby={
                fieldState.error
                  ? `${id}-error`
                  : help
                    ? `${id}-help`
                    : undefined
              }
            />
          ) : type === "select" ? (
            <select {...field} value={String(field.value ?? "")} id={id}>
              <option value="">Not established</option>
              {options?.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          ) : (
            <input
              {...field}
              value={
                typeof field.value === "number"
                  ? field.value
                  : String(field.value ?? "")
              }
              type={type}
              id={id}
              min={type === "number" ? min : undefined}
              max={max}
              step={type === "number" ? "any" : undefined}
              maxLength={type === "text" ? 12000 : undefined}
              placeholder={
                placeholder ??
                (type === "number" ? "Not established" : undefined)
              }
              onChange={(e) =>
                field.onChange(
                  type === "number"
                    ? e.target.value === ""
                      ? null
                      : Number(e.target.value)
                    : e.target.value,
                )
              }
              aria-invalid={!!fieldState.error}
              aria-describedby={
                fieldState.error
                  ? `${id}-error`
                  : help
                    ? `${id}-help`
                    : undefined
              }
            />
          )}
          {help && <small id={`${id}-help`}>{help}</small>}
          {fieldState.error && (
            <small className="error-text" id={`${id}-error`} role="alert">
              {fieldState.error.message}
            </small>
          )}
        </div>
      )}
    />
  );
}
export function Fields({ items }: { items: FieldSpec[] }) {
  return (
    <div className="form-grid">
      {items.map((f) => (
        <Field key={f.name} {...f} />
      ))}
    </div>
  );
}
export function Checklist({
  name,
  options,
  labels,
}: {
  name: string;
  options: readonly string[];
  labels?: Readonly<Record<string, string>>;
}) {
  const { control } = useFormContext<Session>();
  return (
    <Controller
      control={control}
      name={name as FieldPath<Session>}
      render={({ field }) => {
        const selected = (field.value ?? []) as string[];
        return (
          <div className="check-grid">
            {options.map((option) => (
              <label className="check-label" key={option}>
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={(e) => {
                    let next = e.target.checked
                      ? [...selected, option]
                      : selected.filter((x) => x !== option);
                    if (name === "worksheet.riskAreas" && e.target.checked)
                      next =
                        option === "None of these"
                          ? ["None of these"]
                          : next.filter((x) => x !== "None of these");
                    field.onChange(next);
                  }}
                />
                <span>{labels?.[option] ?? option}</span>
              </label>
            ))}
          </div>
        );
      }}
    />
  );
}
