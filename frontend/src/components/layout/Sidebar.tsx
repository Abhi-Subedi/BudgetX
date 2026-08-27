"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { Icon } from "../icons";
import type { IconName } from "../icons";
import { Avatar } from "../ui/Controls";
import { Wordmark, LogoMark } from "./Logo";
import { NotificationsBell } from "./NotificationsBell";

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Overview", icon: "home" },
  { to: "/transactions", label: "Transactions", icon: "activity" },
  { to: "/transfers", label: "Transfers", icon: "arrows-right-left" },
  { to: "/budgets", label: "Budgets", icon: "target" },
  { to: "/bills", label: "Bills", icon: "calendar" },
  { to: "/subscriptions", label: "Subscriptions", icon: "repeat" },
  { to: "/debts", label: "Debts", icon: "credit-card" },
  { to: "/investments", label: "Investments", icon: "trending-up" },
  { to: "/net-worth", label: "Net Worth", icon: "chart" },
  { to: "/tags", label: "Tags", icon: "tag" },
  { to: "/analytics", label: "Analytics", icon: "chart" },
  { to: "/goals", label: "Goals", icon: "flag" },
  { to: "/what-if", label: "What-If", icon: "spark" },
  { to: "/forecasts", label: "Forecasts", icon: "calendar" },
  { to: "/reports", label: "Reports", icon: "document-text" },
  { to: "/accounts", label: "Accounts", icon: "wallet" },
  { to: "/health", label: "Health", icon: "heart" },
  { to: "/groups", label: "Groups", icon: "users" }
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const pathname = usePathname() ?? "/";

  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-line bg-paper lg:flex">
      <div className="flex items-center gap-2.5 px-5 pb-7 pt-6">
        <LogoMark />
        <Wordmark />
      </div>

      <nav aria-label="Primary" className="flex-1 overflow-y-auto space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              href={item.to}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand ${
                active
                  ? "bg-brand text-[#06251C]"
                  : "text-ink2 hover:bg-sunken hover:text-paper"
              }`}
            >
              <Icon name={item.icon} className={`size-[18px] ${active ? "" : "text-ink3 group-hover:text-ink2"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 space-y-4 px-4 pb-5 pt-4">
        <button
          type="button"
          onClick={() => toast("Premium is coming soon.", "info")}
          className="group flex w-full items-center gap-3 rounded-xl border border-line bg-gradient-to-br from-brand/15 via-surface to-surface p-3.5 text-left transition-colors duration-200 hover:border-brand/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-warntint text-warn">
            <Icon name="crown" className="size-[18px]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-paper">Try Premium</span>
            <span className="block text-xs leading-snug text-ink3">Unlock advanced analytics and more</span>
          </span>
          <Icon name="chevron-right" className="size-4 shrink-0 text-ink3 transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>

        <nav aria-label="Secondary" className="space-y-0.5">
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink2 transition-colors duration-200 hover:bg-sunken hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
          >
            <Icon name="settings" className="size-[18px] text-ink3" />
            Settings
          </Link>
          <button
            type="button"
            onClick={() => toast("The help center is coming soon.", "info")}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink2 transition-colors duration-200 hover:bg-sunken hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
          >
            <Icon name="help" className="size-[18px] text-ink3" />
            Help &amp; Support
          </button>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink2 transition-colors duration-200 hover:bg-negtint hover:text-neg focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
          >
            <Icon name="logout" className="size-[18px] text-ink3" />
            Log out
          </button>
        </nav>

        <div className="flex items-center justify-between border-t border-line pt-4">
          <Link
            href="/settings"
            className="flex min-w-0 flex-1 items-center gap-3 rounded-lg py-1 pr-2 transition-colors duration-200 hover:bg-sunken/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
          >
            <Avatar name={user?.name ?? "?"} className="size-9" />
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold leading-tight text-ink">{user?.name}</span>
              <span className="block truncate text-[11px] text-ink3">{user?.email}</span>
              <span className="block truncate text-[11px] leading-tight text-ink3">Personal plan</span>
            </span>
          </Link>
          <div className="pr-1">
            <NotificationsBell />
          </div>
        </div>
      </div>
    </aside>
  );
}
