"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { LogoMark, Wordmark } from "../components/layout/Logo";

export default function AuthLayout({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-paper">
      <div className="mx-auto flex w-full max-w-md flex-col px-6 py-8 sm:justify-center">
        <Link href="/login" className="mb-12 flex items-center gap-2.5 self-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand">
          <LogoMark />
          <Wordmark />
        </Link>
        <main>{children}</main>
        {footer ? <div className="mt-10 text-center text-sm text-ink2">{footer}</div> : null}
      </div>
    </div>
  );
}

interface AuthHeadingProps {
  title: string;
  sub: string;
}

export function AuthHeading({ title, sub }: AuthHeadingProps) {
  return (
    <header className="mb-8 border-b border-line pb-7">
      <h1 className="font-display text-[28px] font-semibold leading-tight tracking-tight">{title}</h1>
      <p className="mt-1.5 text-[15px] text-ink2">{sub}</p>
    </header>
  );
}
