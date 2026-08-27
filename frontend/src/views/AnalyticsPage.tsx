"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { PageHeader } from "../components/layout/AppShell";
import { CategoryDonut } from "../components/charts/CategoryDonut";
import { TrendBars } from "../components/charts/TrendBars";
import { ErrorState, Skeleton, SkeletonRows } from "../components/ui/States";
import { useResource } from "../hooks/useResource";
import { useAuth } from "../hooks/useAuth";
import { formatMoney, monthKeyOf, monthLabel } from "../lib/format";
import type { AnalyticsOverview, TrendPoint } from "../types";

function buildMonthOptions(count = 14): Array<{ value: string; label: string }> {
  const now = new Date();
  const options = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    options.push({ value: key, label: monthLabel(key, true) });
  }
  return options;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const currency = user?.currency ?? "USD";
  const locale = user?.locale ?? "en-US";
  const searchParams = useSearchParams() ?? new URLSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const monthParam = searchParams.get("month");
  const monthKey = monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : monthKeyOf();

  const setMonth = (value: string) => {
    const qs = value === monthKeyOf() ? "" : `?month=${value}`;
    router.replace(`${pathname}${qs}`, { scroll: false });
  };

  const months = buildMonthOptions();
  const overviewRes = useResource<AnalyticsOverview>(`/analytics/overview?month=${monthKey}`);
  const trendsRes = useResource<{ items: TrendPoint[] }>("/analytics/trends?months=6");

  if (overviewRes.error) return <ErrorState message={overviewRes.error} onRetry={overviewRes.reload} />;

  const overview = overviewRes.data;
  const t = overview?.totals;
  const p = overview?.previous_totals;

  if (overviewRes.loading || !overview || !t) {
    return (
      <div>
        <PageHeader
          title="Analytics"
          subtitle="The story behind the numbers."
          actions={
            <select
              aria-label="Month"
              value={monthKey}
              onChange={(e) => setMonth(e.target.value)}
              className="h-10 rounded-md border border-line bg-surface px-3 text-sm focus:border-brand focus:outline-none"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          }
        />
        <div className="space-y-10">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
          <Skeleton className="h-56 w-full" />
          <SkeletonRows rows={5} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="The story behind the numbers."
        actions={
          <select
            aria-label="Month"
            value={monthKey}
            onChange={(e) => setMonth(e.target.value)}
            className="h-10 rounded-md border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        }
      />

      <div className="space-y-12">
          <section aria-label="Monthly summary">
            <dl className="grid grid-cols-2 gap-y-8 border-y border-line py-7 sm:grid-cols-4 sm:divide-x sm:divide-line">
              <div className="pr-6">
                <dt className="eyebrow">Income</dt>
                <dd className="tnum mt-1.5 text-xl font-semibold text-pos">{formatMoney(t.income, currency, locale)}</dd>
                {p ? <dd className="mt-0.5 text-xs text-ink3">{monthLabel(prevOf(monthKey), true)}: {formatMoney(p.income, currency, locale)}</dd> : null}
              </div>
              <div className="px-0 sm:px-6">
                <dt className="eyebrow">Expenses</dt>
                <dd className="tnum mt-1.5 text-xl font-semibold">{formatMoney(t.expense, currency, locale)}</dd>
                {p ? <dd className="mt-0.5 text-xs text-ink3">{monthLabel(prevOf(monthKey), true)}: {formatMoney(p.expense, currency, locale)}</dd> : null}
              </div>
              <div className="pr-6 sm:px-6">
                <dt className="eyebrow">Saved</dt>
                <dd className={`tnum mt-1.5 text-xl font-semibold ${t.saved >= 0 ? "" : "text-neg"}`}>{formatMoney(t.saved, currency, locale)}</dd>
                {p ? <dd className="mt-0.5 text-xs text-ink3">{monthLabel(prevOf(monthKey), true)}: {formatMoney(p.saved, currency, locale)}</dd> : null}
              </div>
              <div className="sm:pl-6">
                <dt className="eyebrow">Savings rate</dt>
                <dd className="tnum mt-1.5 text-xl font-semibold">{t.savings_rate}%</dd>
                <dd className="mt-0.5 text-xs text-ink3">of income kept</dd>
              </div>
            </dl>
          </section>

          <section aria-label="Six month trend">
            <h2 className="mb-6 font-display text-xl font-semibold tracking-tight">Last six months</h2>
            {trendsRes.error ? (
              <p className="py-8 text-center text-sm text-ink3">{trendsRes.error}</p>
            ) : trendsRes.data && trendsRes.data.items.length > 0 ? (
              <TrendBars points={trendsRes.data.items} currency={currency} locale={locale} />
            ) : (
              <Skeleton className="h-48 w-full" />
            )}
          </section>

          <section aria-label="Category breakdown">
            <h2 className="mb-6 font-display text-xl font-semibold tracking-tight">Where it went in {monthLabel(monthKey, true)}</h2>
            {overview.by_category.length === 0 ? (
              <p className="py-8 text-center text-[15px] text-ink2">No expenses recorded this month yet.</p>
            ) : (
              <CategoryDonut slices={overview.by_category} currency={currency} locale={locale} />
            )}
          </section>

          {overview.largest_expenses.length > 0 ? (
            <section aria-label="Largest expenses">
              <h2 className="mb-4 border-b border-line pb-3 font-display text-xl font-semibold tracking-tight">
                Largest expenses
              </h2>
              <ol className="divide-y divide-line">
                {overview.largest_expenses.map((e, i) => (
                  <li key={e.id} className="flex items-center gap-4 py-3.5">
                    <span className="tnum w-5 text-sm font-semibold text-ink3">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium">{e.payee}</p>
                      <p className="text-xs text-ink3">{e.category_name ?? "Uncategorized"}</p>
                    </div>
                    <span className="tnum text-[15px] font-semibold">{formatMoney(e.amount, currency, locale)}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
      </div>
    </div>
  );
}

function prevOf(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
