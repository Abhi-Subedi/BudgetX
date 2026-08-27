"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "quiet";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand text-white hover:bg-brand-strong active:bg-brand-strong shadow-[inset_0_1px_0_rgba(255,255,255,.08)] disabled:bg-brand/50",
  secondary:
    "bg-surface text-ink shadow-line hover:bg-sunken/60 active:bg-sunken",
  ghost: "text-ink2 hover:text-ink hover:bg-sunken/70",
  danger: "bg-neg text-white hover:bg-neg/90 active:bg-neg",
  quiet: "text-brand hover:bg-brand-tint"
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] rounded-md gap-1.5",
  md: "h-10 px-4 text-sm rounded-md gap-2",
  lg: "h-11 px-5 text-[15px] rounded-md gap-2"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className = "", children, type = "button", ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`inline-flex select-none items-center justify-center font-medium transition-colors duration-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
});
