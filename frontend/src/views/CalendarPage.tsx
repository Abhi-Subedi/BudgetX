"use client";

import { useState, useMemo, useEffect } from "react";

import { PageHeader } from "../components/layout/AppShell";
import { Icon } from "../components/icons";
import { ErrorState, Skeleton } from "../components/ui/States";
import { useAuth } from "../hooks/useAuth";
import { useResource } from "../hooks/useResource";
import { formatMoney } from "../lib/format";
import type { Bill, Subscription, RecurringRule } from "../types";

interface CalendarEvent {
  day: number;
  label: string;
  amount?: number;
  type: "bill" | "subscription" | "recurring";
  color: string;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay();
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const { user } = useAuth();
  const currency = user?.currency ?? "USD";
  const locale = user?.locale ?? "en-US";
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setViewMode(e.matches ? "list" : "grid");
    handler(mq);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const billsRes = useResource<{ items: Bill[] }>("/bills/upcoming");
  const subsRes = useResource<{ items: Subscription[] }>("/subscriptions/upcoming");
  const recurRes = useResource<{ items: RecurringRule[] }>("/recurring-rules");

  const loading = billsRes.loading || subsRes.loading || recurRes.loading;
  const error = billsRes.error || subsRes.error || recurRes.error;

  const events = useMemo(() => {
    const map = new Map<number, CalendarEvent[]>();
    const add = (day: number, evt: CalendarEvent) => {
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(evt);
    };

    // Parse bills due in this month
    for (const bill of billsRes.data?.items ?? []) {
      const d = new Date(bill.due_date);
      if (d.getFullYear() === year && d.getMonth() + 1 === month) {
        add(d.getDate(), {
          day: d.getDate(),
          label: bill.name,
          amount: bill.amount,
          type: "bill",
          color: "bg-neg",
        });
      }
    }

    // Parse subscriptions
    for (const sub of subsRes.data?.items ?? []) {
      if (!sub.active || !sub.next_billing_date) continue;
      const d = new Date(sub.next_billing_date);
      if (d.getFullYear() === year && d.getMonth() + 1 === month) {
        add(d.getDate(), {
          day: d.getDate(),
          label: sub.name,
          amount: sub.amount,
          type: "subscription",
          color: "bg-info",
        });
      }
    }

    // Parse recurring rules
    for (const rule of recurRes.data?.items ?? []) {
      if (!rule.active || !rule.next_run_date) continue;
      const d = new Date(rule.next_run_date);
      if (d.getFullYear() === year && d.getMonth() + 1 === month) {
        add(d.getDate(), {
          day: d.getDate(),
          label: rule.payee ?? rule.note ?? rule.frequency,
          amount: rule.amount,
          type: "recurring",
          color: rule.type === "income" ? "bg-pos" : "bg-warn",
        });
      }
    }

    return map;
  }, [billsRes.data, subsRes.data, recurRes.data, year, month]);

  const back = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const fwd = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) => i - firstDay + 1);
  const monthName = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(year, month - 1));

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const todayDate = today.getDate();

  return (
    <div>
      <PageHeader
        title="Financial Calendar"
        subtitle="Upcoming bills, subscriptions, and recurring transactions."
        actions={
          <div className="flex items-center gap-2">
            <div className="hidden sm:inline-flex items-center gap-1 rounded-md border border-line bg-sunken/70 p-0.5">
              <button type="button" onClick={() => setViewMode("grid")} className={`rounded-[5px] px-2 py-1 text-xs font-medium transition-colors ${viewMode === "grid" ? "bg-surface text-paper" : "text-ink3 hover:text-paper"}`}>
                Grid
              </button>
              <button type="button" onClick={() => setViewMode("list")} className={`rounded-[5px] px-2 py-1 text-xs font-medium transition-colors ${viewMode === "list" ? "bg-surface text-paper" : "text-ink3 hover:text-paper"}`}>
                List
              </button>
            </div>
            <div className="inline-flex items-center gap-2 rounded-md border border-line bg-sunken/70 p-0.5">
              <button type="button" onClick={back} className="grid size-8 place-items-center rounded-[5px] text-ink3 transition-colors hover:bg-line hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand">
                <Icon name="chevron-left" className="size-4" />
              </button>
              <span className="min-w-[140px] text-center text-sm font-semibold text-paper">{monthName}</span>
              <button type="button" onClick={fwd} className="grid size-8 place-items-center rounded-[5px] text-ink3 transition-colors hover:bg-line hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand">
                <Icon name="chevron-right" className="size-4" />
              </button>
            </div>
          </div>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={() => { billsRes.reload(); subsRes.reload(); recurRes.reload(); }} />
      ) : loading ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : (
        <div className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
          {viewMode === "grid" ? (
            <>
              <div className="grid grid-cols-7 gap-px text-center text-xs font-medium text-ink3">
                {DAY_LABELS.map((d) => (
                  <div key={d} className="pb-2">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-px">
                {cells.map((day, i) => {
                  if (day < 1 || day > daysInMonth) {
                    return <div key={`empty-${i}`} className="min-h-[80px] sm:min-h-[100px]" />;
                  }
                  const dayEvents = events.get(day) ?? [];
                  const isToday = isCurrentMonth && day === todayDate;
                  return (
                    <div
                      key={day}
                      className={`min-h-[80px] sm:min-h-[100px] rounded-lg p-1.5 sm:p-2 transition-colors ${
                        isToday ? "bg-brand/10 ring-1 ring-brand/30" : "hover:bg-sunken/30"
                      }`}
                    >
                      <span
                        className={`inline-flex size-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                          isToday ? "bg-brand text-white" : "text-ink2"
                        }`}
                      >
                        {day}
                      </span>
                      <ul className="mt-1 space-y-0.5">
                        {dayEvents.slice(0, 3).map((evt, j) => (
                          <li key={j} className="group relative">
                            <span className={`block truncate rounded px-1 py-0.5 text-[10px] font-medium text-white ${evt.color}`}>
                              {evt.label}
                            </span>
                            {evt.amount !== undefined && (
                              <span className="hidden group-hover:block absolute z-10 left-0 mt-0.5 rounded bg-surface border border-line px-2 py-1 text-[11px] font-medium text-ink2 shadow-lg whitespace-nowrap">
                                {formatMoney(evt.amount, currency, locale)}
                              </span>
                            )}
                          </li>
                        ))}
                        {dayEvents.length > 3 && (
                          <li className="px-1 text-[10px] text-ink3">+{dayEvents.length - 3} more</li>
                        )}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="space-y-2">
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const dayEvents = events.get(day) ?? [];
                const isToday = isCurrentMonth && day === todayDate;
                if (dayEvents.length === 0) return null;
                const date = new Date(year, month - 1, day);
                const dayLabel = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(date);
                return (
                  <div
                    key={day}
                    className={`rounded-lg border border-line p-3 ${isToday ? "bg-brand/10 ring-1 ring-brand/30" : "bg-surface"}`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className={`inline-flex size-6 items-center justify-center rounded-full text-[11px] font-semibold ${isToday ? "bg-brand text-white" : "text-ink2"}`}>
                        {day}
                      </span>
                      <span className="text-sm font-medium text-ink2">{dayLabel}</span>
                    </div>
                    <ul className="space-y-1">
                      {dayEvents.map((evt, j) => (
                        <li key={j} className="flex items-center justify-between gap-2 rounded px-2 py-1">
                          <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium text-white ${evt.color}`}>
                            {evt.label}
                          </span>
                          {evt.amount !== undefined && (
                            <span className="text-xs font-medium text-ink3 sm:hidden">{formatMoney(evt.amount, currency, locale)}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).every((d) => !events.has(d)) && (
                <p className="py-8 text-center text-sm text-ink3">No events this month.</p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-ink3">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-neg" /> Bill</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-info" /> Subscription</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-warn" /> Recurring Expense</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-pos" /> Recurring Income</span>
      </div>
    </div>
  );
}
