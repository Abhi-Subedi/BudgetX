"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "../icons";
import type { IconName } from "../icons";
import { LogoMark, Wordmark } from "./Logo";
import { NotificationsBell } from "./NotificationsBell";

const MOBILE_NAV: Array<{ to: string; label: string; icon: IconName; matchExact?: boolean }> = [
  { to: "/", label: "Home", icon: "home", matchExact: true },
  { to: "/transactions", label: "Activity", icon: "activity" },
  { to: "/transfers", label: "Transfers", icon: "arrows-right-left" },
  { to: "/budgets", label: "Budgets", icon: "target" },
];

const MORE_ITEMS: Array<{ to: string; label: string; icon: IconName }> = [
  { to: "/analytics", label: "Analytics", icon: "chart" },
  { to: "/accounts", label: "Accounts", icon: "wallet" },
  { to: "/debts", label: "Debts", icon: "credit-card" },
  { to: "/net-worth", label: "Net Worth", icon: "trending-up" },
  { to: "/bills", label: "Bills", icon: "calendar" },
  { to: "/subscriptions", label: "Subscriptions", icon: "repeat" },
  { to: "/investments", label: "Investments", icon: "trending-up" },
  { to: "/reports", label: "Reports", icon: "document-text" },
  { to: "/health", label: "Health", icon: "heart" },
  { to: "/calendar", label: "Calendar", icon: "calendar" },
  { to: "/groups", label: "Groups", icon: "users" },
  { to: "/forecasts", label: "Forecasts", icon: "spark" },
  { to: "/goals", label: "Goals", icon: "flag" },
  { to: "/settings", label: "Settings", icon: "settings" },
];

export function MobileTopBar() {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-paper/95 px-4 py-3 backdrop-blur lg:hidden">
      <Link
        href="/"
        aria-label="BudgetX home"
        className="flex items-center gap-2 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
      >
        <LogoMark className="size-6" />
        <Wordmark className="text-lg" />
      </Link>
      <div className="flex items-center gap-1">
        <NotificationsBell />
        <Link
          href="/settings"
          aria-label="Settings"
          className="grid size-9 place-items-center rounded-md text-ink2 transition-colors hover:bg-sunken hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
        >
          <Icon name="settings" className="size-[18px]" />
        </Link>
      </div>
    </header>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname() ?? "/";
  const [moreOpen, setMoreOpen] = useState(false);
  const active = (to: string, matchExact?: boolean) =>
    matchExact ? pathname === "/" : pathname.startsWith(to);

  const moreActive = MORE_ITEMS.some((item) => pathname.startsWith(item.to));

  return (
    <>
      <nav
        aria-label="Primary mobile"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-5">
          {MOBILE_NAV.map((item) => {
            const isActive = active(item.to, item.matchExact);
            return (
              <Link
                key={item.to}
                href={item.to}
                className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                  isActive ? "text-brand" : "text-ink3 hover:text-ink2"
                }`}
              >
                <Icon name={item.icon} className="size-[21px]" strokeWidth={1.9} />
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
              moreActive ? "text-brand" : "text-ink3 hover:text-ink2"
            }`}
          >
            <Icon name="dots" className="size-[21px]" strokeWidth={1.9} />
            More
          </button>
        </div>
      </nav>

      {moreOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setMoreOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-paper shadow-xl lg:hidden animate-rise-in">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="text-sm font-semibold text-ink">More</h2>
              <button
                onClick={() => setMoreOpen(false)}
                className="grid size-8 place-items-center rounded-md text-ink2 transition-colors hover:bg-sunken hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
              >
                <Icon name="close" className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4 p-4">
              {MORE_ITEMS.map((item) => {
                const isActive = active(item.to);
                return (
                  <Link
                    key={item.to}
                    href={item.to}
                    onClick={() => setMoreOpen(false)}
                    className={`flex flex-col items-center gap-1.5 rounded-lg p-3 text-[11px] font-medium transition-colors ${
                      isActive
                        ? "bg-brand-fade text-brand"
                        : "text-ink2 hover:bg-sunken hover:text-ink"
                    }`}
                  >
                    <Icon name={item.icon} className="size-5" strokeWidth={1.8} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <div className="pb-[env(safe-area-inset-bottom)]" />
          </div>
        </>
      )}
    </>
  );
}
