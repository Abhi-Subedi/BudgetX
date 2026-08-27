"use client";

import { useId } from "react";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

import { Icon } from "../icons";

const FIELD_BASE =
  "w-full rounded-md border border-line bg-surface px-3 text-[15px] text-ink placeholder:text-ink3 transition-shadow focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15 disabled:bg-sunken/50";

export function Label({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium text-ink2">
      {children}
    </label>
  );
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  suffix?: ReactNode;
}

export function Field({ label, error, className = "", id, ...rest }: FieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <div>
      {label ? <Label htmlFor={fieldId}>{label}</Label> : null}
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        className={`h-10 ${FIELD_BASE} ${error ? "border-neg focus:border-neg focus:ring-neg/15" : ""} ${className}`}
        {...rest}
      />
      {error ? (
        <p className="mt-1.5 text-[13px] text-neg" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export function Select({ label, error, className = "", children, id, ...rest }: SelectFieldProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <div>
      {label ? <Label htmlFor={selectId}>{label}</Label> : null}
      <div className="relative">
        <select
          id={selectId}
          className={`h-10 appearance-none pr-9 ${FIELD_BASE} ${error ? "border-neg" : ""} ${className}`}
          {...rest}
        >
          {children}
        </select>
        <Icon name="chevron-down" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink3" />
      </div>
      {error ? (
        <p className="mt-1.5 text-[13px] text-neg" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextArea({
  label,
  className = "",
  rows = 2,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  const autoId = useId();
  return (
    <div>
      {label ? <Label htmlFor={autoId}>{label}</Label> : null}
      <textarea id={autoId} rows={rows} className={`${FIELD_BASE} py-2 ${className}`} {...rest} />
    </div>
  );
}
