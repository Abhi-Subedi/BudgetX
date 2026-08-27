"use client";

import { useState } from "react";

import { PageHeader } from "../components/layout/AppShell";
import { ProgressBar } from "../components/ui/Controls";
import { Icon } from "../components/icons";
import { EmptyState, ErrorState, Skeleton } from "../components/ui/States";
import { useAuth } from "../hooks/useAuth";
import { useResource } from "../hooks/useResource";
import { formatMoney, formatPercent, monthLabel } from "../lib/format";

interface MonthlyReport {
  year: number;
  month: number;
  income: number;
  expenses: number;
  savings: number;
  savings_rate: number;
  top_categories: Array<{ name: string; color: string; amount: number; pct: number }>;
  budget_performance: Array<{
    category_name: string;
    category_color: string;
    budgeted: number;
    spent: number;
    pct_used: number;
  }>;
  goals_progress: Array<{
    goal_name: string;
    target: number;
    current: number;
    pct: number;
  }>;
  prev_income: number;
  prev_expenses: number;
  prev_savings: number;
}

function MonthNav({
  year,
  month,
  onChange,
}: {
  year: number;
  month: number;
  onChange: (y: number, m: number) => void;
}) {
  const back = () => {
    if (month === 1) onChange(year - 1, 12);
    else onChange(year, month - 1);
  };
  const fwd = () => {
    if (month === 12) onChange(year + 1, 1);
    else onChange(year, month + 1);
  };
  const now = new Date();
  const isFuture = year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth() + 1);

  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-line bg-sunken/70 p-0.5">
      <button
        type="button"
        onClick={back}
        className="grid size-8 place-items-center rounded-[5px] text-ink3 transition-colors hover:bg-line hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
        aria-label="Previous month"
      >
        <Icon name="chevron-left" className="size-4" />
      </button>
      <span className="min-w-[120px] text-center text-sm font-semibold text-paper">
        {monthLabel(`${year}-${String(month).padStart(2, "0")}`, true)}
      </span>
      <button
        type="button"
        onClick={fwd}
        disabled={isFuture}
        className="grid size-8 place-items-center rounded-[5px] text-ink3 transition-colors hover:bg-line hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-40"
        aria-label="Next month"
      >
        <Icon name="chevron-right" className="size-4" />
      </button>
    </div>
  );
}

function Delta({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null;
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  if (!isFinite(pct) || Math.abs(pct) < 1) return null;
  const up = pct >= 0;
  return (
    <span
      className={`tnum inline-flex items-center gap-0.5 text-xs font-semibold ${
        up ? "text-pos" : "text-neg"
      }`}
    >
      {up ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

export default function ReportsPage() {
  const { user } = useAuth();
  const currency = user?.currency ?? "USD";
  const locale = user?.locale ?? "en-US";
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const reportRes = useResource<MonthlyReport>(
    `/reports/monthly?year=${year}&month=${month}`
  );

  if (reportRes.error) return <ErrorState message={reportRes.error} onRetry={reportRes.reload} />;

  return (
    <div>
      <PageHeader
        title="Monthly Reports"
        subtitle="Track your monthly financial performance."
        actions={<MonthNav year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />}
      />

      {reportRes.loading || !reportRes.data ? (
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : (
        <ReportBody data={reportRes.data} currency={currency} locale={locale} />
      )}
    </div>
  );
}

function ReportBody({
  data,
  currency,
  locale,
}: {
  data: MonthlyReport;
  currency: string;
  locale: string;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon="arrow-up"
          tone="pos"
          label="Income"
          value={formatMoney(data.income, currency, locale)}
        >
          <Delta current={data.income} previous={data.prev_income} />
        </StatCard>
        <StatCard
          icon="arrow-down"
          tone="neg"
          label="Expenses"
          value={formatMoney(data.expenses, currency, locale)}
        >
          <Delta current={data.expenses} previous={data.prev_expenses} />
        </StatCard>
        <StatCard
          icon="target"
          tone="info"
          label="Savings"
          value={formatMoney(data.savings, currency, locale)}
        >
          <Delta current={data.savings} previous={data.prev_savings} />
        </StatCard>
        <StatCard
          icon="trending-up"
          tone="brand"
          label="Savings Rate"
          value={formatPercent(data.savings_rate)}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="mb-4 font-display text-[15px] font-bold tracking-tight text-paper">Top Categories</h2>
          {data.top_categories.length === 0 ? (
            <EmptyState title="No expenses" body="Record expenses to see category breakdown." />
          ) : (
            <ul className="space-y-3">
              {data.top_categories.map((cat) => (
                <li key={cat.name} className="flex items-center gap-3">
                  <span
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-[10px] font-bold uppercase"
                    style={{ backgroundColor: `${cat.color}22`, color: cat.color }}
                  >
                    {cat.name.slice(0, 2)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2 text-[13px]">
                      <span className="truncate font-medium">{cat.name}</span>
                      <span className="tnum shrink-0 text-ink3">
                        {formatMoney(cat.amount, currency, locale)} · {formatPercent(cat.pct)}
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <ProgressBar pct={cat.pct} height="h-1" delay={80} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="mb-4 font-display text-[15px] font-bold tracking-tight text-paper">Budget Performance</h2>
          {data.budget_performance.length === 0 ? (
            <EmptyState title="No budgets" body="Set budgets to track performance." />
          ) : (
            <ul className="space-y-3">
              {data.budget_performance.map((b) => (
                <li key={b.category_name} className="flex items-center gap-3">
                  <span
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-[10px] font-bold uppercase"
                    style={{ backgroundColor: `${b.category_color}22`, color: b.category_color }}
                  >
                    {b.category_name.slice(0, 2)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2 text-[13px]">
                      <span className="truncate font-medium">{b.category_name}</span>
                      <span className="tnum shrink-0 text-ink3">
                        <span className="text-ink2">{formatMoney(b.spent, currency, locale)}</span>
                        {" / "}
                        {formatMoney(b.budgeted, currency, locale)}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <ProgressBar pct={b.pct_used} height="h-1" delay={80} className="flex-1" />
                      <span
                        className={`tnum w-10 shrink-0 text-right text-xs font-semibold ${
                          b.pct_used >= 100 ? "text-neg" : b.pct_used >= 75 ? "text-warn" : "text-pos"
                        }`}
                      >
                        {formatPercent(b.pct_used)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {data.goals_progress.length > 0 && (
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="mb-4 font-display text-[15px] font-bold tracking-tight text-paper">Goals Progress</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.goals_progress.map((g) => (
              <div key={g.goal_name} className="rounded-xl border border-line bg-sunken/40 p-4">
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium">{g.goal_name}</span>
                  <span className="tnum shrink-0 text-xs font-semibold text-brand">{formatPercent(g.pct)}</span>
                </div>
                <ProgressBar pct={g.pct} height="h-1.5" delay={100} />
                <p className="tnum mt-2 text-xs text-ink3">
                  {formatMoney(g.current, currency, locale)} / {formatMoney(g.target, currency, locale)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-4 font-display text-[15px] font-bold tracking-tight text-paper">Month-over-Month</h2>
        <div className="grid gap-5 sm:grid-cols-3">
          <ComparisonRow label="Income" current={data.income} previous={data.prev_income} currency={currency} locale={locale} />
          <ComparisonRow label="Expenses" current={data.expenses} previous={data.prev_expenses} currency={currency} locale={locale} />
          <ComparisonRow label="Savings" current={data.savings} previous={data.prev_savings} currency={currency} locale={locale} />
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  tone,
  label,
  value,
  children,
}: {
  icon: "arrow-up" | "arrow-down" | "target" | "trending-up";
  tone: "pos" | "neg" | "info" | "brand";
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  const toneBg = {
    pos: "bg-pos/15 text-pos",
    neg: "bg-neg/15 text-neg",
    info: "bg-info/15 text-info",
    brand: "bg-brand/15 text-brand",
  }[tone];

  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center gap-2.5">
        <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${toneBg}`}>
          <Icon name={icon} className="size-4" />
        </span>
        <span className="truncate text-sm font-medium text-ink2">{label}</span>
      </div>
      <div className="mt-2">
        <p className="tnum font-display text-xl font-bold tracking-tight">{value}</p>
        {children ? <span className="mt-1 block">{children}</span> : null}
      </div>
    </div>
  );
}

function ComparisonRow({
  label,
  current,
  previous,
  currency,
  locale,
}: {
  label: string;
  current: number;
  previous: number;
  currency: string;
  locale: string;
}) {
  const pct = previous !== 0 ? ((current - previous) / Math.abs(previous)) * 100 : null;

  return (
    <div className="rounded-xl border border-line bg-sunken/40 p-4">
      <p className="text-sm font-medium text-ink2">{label}</p>
      <p className="tnum mt-1 font-display text-lg font-bold">{formatMoney(current, currency, locale)}</p>
      <div className="mt-1 flex items-center gap-2 text-xs">
        <span className="text-ink3">vs last month: {formatMoney(previous, currency, locale)}</span>
        {pct !== null && isFinite(pct) && Math.abs(pct) >= 1 ? (
          <span className={`font-semibold ${pct >= 0 ? (label === "Expenses" ? "text-neg" : "text-pos") : (label === "Expenses" ? "text-pos" : "text-neg")}`}>
            {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
          </span>
        ) : null}
      </div>
    </div>
  );
}
