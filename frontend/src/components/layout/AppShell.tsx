"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { MobileBottomNav, MobileTopBar } from "./MobileNav";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-brand-strong"
      >
        Skip to content
      </a>
      <Sidebar />
      <MobileTopBar />
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 outline-none sm:px-6 md:pt-10 lg:pl-72 lg:pr-10 lg:pb-16"
      >
        <div key={pathname} className="animate-rise-in">
          {children}
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
      <div>
        <h1 className="text-balance font-display text-[26px] font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle ? <p className="text-pretty mt-1 text-[15px] text-ink2">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2.5">{actions}</div> : null}
    </div>
  );
}
