"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

interface SegmentedProps<T extends string> {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  ariaLabel?: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  ariaLabel,
}: SegmentedProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex items-center gap-0.5 rounded-md border border-line bg-sunken/70 p-0.5"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={`rounded-[5px] font-medium transition-[color,background-color,box-shadow] duration-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand ${
              size === "sm" ? "h-7 px-2.5 text-xs" : "h-8 px-3.5 text-[13px]"
            } ${active ? "bg-line text-white shadow-line" : "text-ink3 hover:text-ink2"}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function ProgressBar({
  pct,
  tone,
  height = "h-1.5",
  delay = 0,
  className = "",
}: {
  pct: number;
  tone?: "brand" | "warn" | "neg";
  height?: string;
  delay?: number;
  className?: string;
}) {
  const clamped = Math.min(100, Math.max(0, pct));
  const resolved =
    tone ?? (clamped >= 100 ? "neg" : clamped >= 75 ? "warn" : "brand");
  const color =
    resolved === "neg"
      ? "bg-neg"
      : resolved === "warn"
        ? "bg-warn"
        : "bg-brand";
  const [grown, setGrown] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) {
      setGrown(true);
      return;
    }
    const t = window.setTimeout(() => setGrown(true), delay + 30);
    return () => window.clearTimeout(t);
  }, [delay]);

  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-sunken ${height} ${className}`}
      role="presentation"
    >
      <div
        className={`h-full w-full origin-left rounded-full ${color} transition-transform duration-700 ease-out motion-reduce:transition-none`}
        style={{ transform: `scaleX(${grown ? clamped / 100 : 0})` }}
      />
    </div>
  );
}

export function Avatar({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  const palette = [
    "bg-brand-tint text-brand-strong",
    "bg-warntint text-warn",
    "bg-negtint text-neg",
    "bg-sunken text-ink2",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full text-[11px] font-semibold ${palette[hash % palette.length]} ${className}`}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "pos" | "neg" | "warn";
}) {
  const tones = {
    neutral: "bg-sunken text-ink2",
    pos: "bg-brand-tint text-brand-strong",
    neg: "bg-negtint text-neg",
    warn: "bg-warntint text-warn",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
