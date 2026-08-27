"use client";

import React, { useCallback, useMemo, useState } from "react";
import Link from "next/link";

import { SpendingChart } from "../components/charts/SpendingChart";
import { CategoryDonut } from "../components/charts/CategoryDonut";
import { Sparkline } from "../components/charts/Sparkline";
import { TransactionLedger } from "../components/transactions/TransactionLedger";
import { TransactionFormModal } from "../components/transactions/TransactionFormModal";
import { ProgressBar } from "../components/ui/Controls";
import { EmptyState, ErrorState, Skeleton, SkeletonRows } from "../components/ui/States";
import { Button } from "../components/ui/Button";
import { Icon } from "../components/icons";
import type { IconName } from "../components/icons";
import { useResource } from "../hooks/useResource";
import { useAuth } from "../hooks/useAuth";
import { post } from "../lib/api";
import { deadlineLabel, firstName, formatMoney, formatPercent, greeting } from "../lib/format";
import type { Account, AnalyticsOverview, BudgetProgress, Category, DashboardData } from "../types";

function Card({
  title,
  action,
  children,
  className = "",
  bodyClassName = ""
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      aria-label={title}
      className={`group rounded-2xl border border-line bg-surface p-6 transition-all duration-300 ease-out hover:scale-[1.01] hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 hover:border-ink3/40 ${className}`}
    >
      {title ? (
        <header className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          {action}
        </header>
      ) : null}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

function ViewAllLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="text-xs font-semibold text-brand transition-colors hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
    >
      View all
    </Link>
  );
}

const TONE_BORDER: Record<string, string> = {
  brand: "border-l-brand",
  pos: "border-l-pos",
  neg: "border-l-neg",
  info: "border-l-info",
  warn: "border-l-warn"
};

const TONE_BG: Record<string, string> = {
  brand: "from-brand/8 to-transparent",
  pos: "from-pos/8 to-transparent",
  neg: "from-neg/8 to-transparent",
  info: "from-info/8 to-transparent",
  warn: "from-warn/8 to-transparent"
};

const TONE_TILE: Record<string, string> = {
  brand: "bg-brand/15 text-brand",
  pos: "bg-pos/15 text-pos",
  neg: "bg-neg/15 text-neg",
  info: "bg-info/15 text-info",
  warn: "bg-warn/15 text-warn"
};

function StatTile({
  icon,
  tone,
  label,
  value,
  sub,
  barPct
}: {
  icon: IconName;
  tone: "brand" | "pos" | "neg" | "info";
  label: string;
  value: string;
  sub: string;
  barPct: number;
}) {
  const barColor = tone === "pos" ? "bg-pos" : tone === "neg" ? "bg-neg" : tone === "brand" ? "bg-brand" : "bg-info";
  return (
    <div
      className={`group flex min-w-0 flex-col gap-3 rounded-2xl border border-line border-l-[3px] ${TONE_BORDER[tone]} bg-gradient-to-br ${TONE_BG[tone]} to-surface p-5 transition-all duration-300 ease-out hover:scale-[1.01] hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 hover:border-ink3/40`}
    >
      <div className="flex items-center gap-2.5">
        <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${TONE_TILE[tone]}`}>
          <Icon name={icon} className="size-4" />
        </span>
        <span className="truncate text-sm font-medium text-ink2">{label}</span>
      </div>
      <div>
        <p className="tnum truncate font-display text-2xl font-bold tracking-tight">{value}</p>
        {sub ? <p className="mt-0.5 truncate text-xs text-ink3">{sub}</p> : null}
      </div>
      <div className="mt-auto h-1 w-full overflow-hidden rounded-full bg-sunken">
        <div
          className={`h-full rounded-full ${barColor} motion-reduce:transition-none transition-transform duration-700 ease-out origin-left`}
          style={{ transform: `scaleX(${Math.min(100, Math.max(0, barPct)) / 100})` }}
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const currency = user?.currency ?? "USD";
  const locale = user?.locale ?? "en-US";
  const dashRes = useResource<DashboardData>("/dashboard");
  const budgetsRes = useResource<{ items: BudgetProgress[] }>("/budgets");
  const overviewRes = useResource<AnalyticsOverview>(
    `/analytics/overview?month=${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`
  );
  const accountsRes = useResource<{ items: Account[] }>("/accounts");
  const categoriesRes = useResource<{ items: Category[] }>("/categories");
  const healthRes = useResource<{ overall_score: number; dimensions: Record<string, number> }>("/health/score");
  const recommendationsRes = useResource<{ items: Array<{ id: number; title: string; description: string; impact: "high" | "medium" | "low" }> }>("/recommendations");
  const netWorthRes = useResource<{ net_worth: number }>("/net-worth/current");

  const [balanceHidden, setBalanceHidden] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddText, setQuickAddText] = useState("");
  const [quickAddBusy, setQuickAddBusy] = useState(false);
  const [quickAddError, setQuickAddError] = useState<string | null>(null);

  const handleQuickAdd = useCallback(async () => {
    const trimmed = quickAddText.trim();
    if (!trimmed) return;
    setQuickAddBusy(true);
    setQuickAddError(null);
    try {
      const match = trimmed.match(/^(\d+(?:\.\d+)?)\s+(\S+)(?:\s+(\S+))?/);
      if (!match) {
        setQuickAddError("Try: 450 lunch cash");
        setQuickAddBusy(false);
        return;
      }
      const amount = parseFloat(match[1]);
      const categoryGuess = match[2].toLowerCase();
      const accountGuess = match[3]?.toLowerCase();
      const categories = categoriesRes.data?.items ?? [];
      const accounts = accountsRes.data?.items.filter((a) => !a.archived) ?? [];
      const matchedCategory = categories.find((c) => c.name.toLowerCase().includes(categoryGuess));
      const matchedAccount = accountGuess
        ? accounts.find((a) => a.name.toLowerCase().includes(accountGuess))
        : accounts[0];
      await post("/transactions", {
        amount,
        type: "expense",
        account_id: matchedAccount?.id ?? accounts[0]?.id,
        category_id: matchedCategory?.id ?? null,
        payee: matchedCategory?.name ?? categoryGuess,
        occurred_at: new Date().toISOString().slice(0, 10)
      });
      setQuickAddText("");
      dashRes.reload();
      budgetsRes.reload();
      overviewRes.reload();
    } catch {
      setQuickAddError("Could not add transaction.");
    } finally {
      setQuickAddBusy(false);
    }
  }, [quickAddText, categoriesRes, accountsRes, dashRes, budgetsRes, overviewRes]);

  if (dashRes.error) return <ErrorState message={dashRes.error} onRetry={dashRes.reload} />;

  const memoAccounts = useMemo(() => accountsRes.data?.items.filter((a) => !a.archived) ?? [], [accountsRes.data]);
  const categories = categoriesRes.data?.items ?? [];
  const onToggleBalance = useCallback(() => setBalanceHidden((h) => !h), []);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-balance font-display text-2xl font-extrabold tracking-tight sm:text-[28px]">
            {greeting()}, {firstName(user?.name ?? "")} <span aria-hidden="true">👋</span>
          </h1>
          <p className="text-pretty mt-1 text-[15px] text-ink2">Here's what's happening with your money today.</p>
        </div>
        <Button onClick={() => setQuickAddOpen(true)}>
          <Icon name="plus" className="size-4" /> Add Transaction
        </Button>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Icon name="spark" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink3" />
          <input
            value={quickAddText}
            onChange={(e) => setQuickAddText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleQuickAdd();
            }}
            placeholder="Quick add: 450 lunch cash"
            aria-label="Quick add transaction"
            autoComplete="off"
            className="h-10 w-full rounded-lg border border-line bg-surface pl-9 pr-3 text-sm placeholder:text-ink3 transition-all duration-300 ease-out focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.08)]"
          />
        </div>
        <Button onClick={handleQuickAdd} disabled={quickAddBusy || !quickAddText.trim()}>
          {quickAddBusy ? "Adding…" : "Add"}
        </Button>
      </div>
      {quickAddError ? (
        <p role="alert" className="-mt-4 text-xs text-neg">{quickAddError}</p>
      ) : null}

      {dashRes.loading || !dashRes.data ? (
        <LoadingGrid />
      ) : (
        <DashboardBody
          data={dashRes.data}
          currency={currency}
          locale={locale}
          balanceHidden={balanceHidden}
          onToggleBalance={onToggleBalance}
          budgets={budgetsRes.data?.items ?? []}
          loadingBudgets={budgetsRes.loading}
          categories={overviewRes.data?.by_category ?? []}
          healthScore={healthRes.data}
          recommendations={recommendationsRes.data?.items ?? []}
          netWorth={netWorthRes.data?.net_worth ?? null}
        />
      )}

      <TransactionFormModal
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSaved={() => {
          dashRes.reload();
          budgetsRes.reload();
          overviewRes.reload();
        }}
        accounts={memoAccounts}
        categories={categories}
        currency={currency}
        locale={locale}
      />
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 rounded-2xl" />
      <Skeleton className="h-36 rounded-2xl" />
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
      <Skeleton className="h-72 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  );
}

interface Insight {
  icon: IconName;
  tone: keyof typeof TONE_TILE;
  title: string;
  sub: string;
}

const DashboardBody = React.memo(function DashboardBody({
  data,
  currency,
  locale,
  balanceHidden,
  onToggleBalance,
  budgets,
  loadingBudgets,
  categories,
  healthScore,
  recommendations,
  netWorth
}: {
  data: DashboardData;
  currency: string;
  locale: string;
  balanceHidden: boolean;
  onToggleBalance: () => void;
  budgets: BudgetProgress[];
  loadingBudgets: boolean;
  categories: AnalyticsOverview["by_category"];
  healthScore: { overall_score: number; dimensions: Record<string, number> } | null;
  recommendations: Array<{ id: number; title: string; description: string; impact: "high" | "medium" | "low" }>;
  netWorth: number | null;
}) {
  const t = data.month_totals;
  const p = data.previous_month_totals;

  let savedDeltaPct: number | null = null;
  if (p.saved !== 0) {
    const delta = ((t.saved - p.saved) / Math.abs(p.saved)) * 100;
    if (isFinite(delta) && Math.abs(delta) >= 1) savedDeltaPct = delta;
  }
  const expenseVsPrevPct =
    p.expense > 0 ? Math.max(0, Math.min(150, (t.expense / p.expense) * 100)) : t.expense > 0 ? 110 : 0;
  const daysElapsed = new Date().getDate();
  const dailyAvg = daysElapsed > 0 ? t.expense / daysElapsed : t.expense;
  const sparkValues = data.spending_series.map((s) => s.current);
  const currentBudget = budgets[0];

  const topGoal = useMemo(
    () =>
      [...data.goals]
        .filter((g) => g.target_amount > 0)
        .sort((a, b) => b.current_amount / b.target_amount - a.current_amount / a.target_amount)[0],
    [data.goals]
  );

  const insights: Insight[] = useMemo(() => {
    const result: Insight[] = [];
    if (p.expense > 0 && Math.abs(((t.expense - p.expense) / p.expense) * 100) >= 3) {
      const pct = Math.abs(Math.round(((t.expense - p.expense) / p.expense) * 100));
      result.push(
        t.expense <= p.expense
          ? { icon: "chart", tone: "pos", title: `You're spending ${formatPercent(pct)} less than last month`, sub: "Great job keeping costs down." }
          : { icon: "chart", tone: "warn", title: `You're spending ${formatPercent(pct)} more than last month`, sub: "Worth a quick look at your budgets." }
      );
    }
    if (data.upcoming_recurring.length > 0) {
      const total = data.upcoming_recurring.reduce((s, r) => s + r.amount, 0);
      result.push({
        icon: "repeat",
        tone: "info",
        title: `${data.upcoming_recurring.length} recurring bill${data.upcoming_recurring.length === 1 ? " is" : "s are"} due this week`,
        sub: `${formatMoney(total, currency, locale)} total`
      });
    }
    if (data.budget_attention.length > 0) {
      const b = data.budget_attention[0];
      result.push({
        icon: "alert",
        tone: "warn",
        title: `${b.category_name} budget at ${formatPercent(b.pct_used)}`,
        sub: b.pct_used >= 100 ? "You've gone over this month." : "Getting close to the limit."
      });
    } else if (topGoal) {
      const pct = Math.round((topGoal.current_amount / topGoal.target_amount) * 100);
      if (pct > 0) {
        result.push({
          icon: "flag",
          tone: "brand",
          title: `You're ${formatPercent(pct)} of the way to ${topGoal.name}`,
          sub: "Keep it up."
        });
      }
    }
    while (result.length < 2) {
      result.push(
        result.length === 0
          ? { icon: "spark", tone: "brand", title: "Start tracking to unlock insights", sub: "Add a transaction and patterns will appear here." }
          : { icon: "wallet", tone: "info", title: "Set a monthly budget", sub: "Budgets keep spending intentional." }
      );
    }
    return result;
  }, [data, currency, locale, topGoal]);

  return (
    <>
      {/* ── Quick Add (already rendered above) ── */}

      {/* ── Total Balance (full width) ── */}
      <div className="group relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-brand/12 via-surface to-surface p-6 transition-all duration-300 ease-out hover:scale-[1.01] hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 hover:border-brand/30">
        <div className="absolute -right-10 -top-10 size-40 rounded-full bg-brand/5 blur-3xl transition-all duration-500 ease-out group-hover:scale-125 group-hover:bg-brand/8" />
        <div className="relative">
          <div className="mb-4 flex items-center justify-between gap-2">
            <span className="text-lg font-semibold text-ink">Total Balance</span>
            <button
              type="button"
              onClick={onToggleBalance}
              aria-label={balanceHidden ? "Show balance" : "Hide balance"}
              aria-pressed={balanceHidden}
              className="grid size-8 place-items-center rounded-lg text-ink3 transition-all duration-200 hover:bg-sunken hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
            >
              <Icon name={balanceHidden ? "close" : "wallet"} className="size-4" />
            </button>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="tnum font-display text-4xl font-bold leading-none tracking-tight">
                {balanceHidden ? "••••••" : formatMoney(data.balance_total, currency, locale)}
              </p>
              {savedDeltaPct !== null ? (
                <span
                  className={`tnum mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    savedDeltaPct >= 0 ? "bg-pos/15 text-pos" : "bg-neg/15 text-neg"
                  }`}
                >
                  {savedDeltaPct >= 0 ? "▲" : "▼"} {Math.abs(savedDeltaPct).toFixed(1)}%
                  <span className="font-normal text-ink3">vs last month</span>
                </span>
              ) : (
                <span className="mt-3 block text-xs text-ink3">Across all active accounts</span>
              )}
            </div>
            <Sparkline values={sparkValues} className="h-16 w-44 shrink-0 sm:w-56" />
          </div>
        </div>
        {/* Income / Expenses / Saved sub-tiles */}
        <div className="relative mt-6 grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl border border-line bg-surface/60 px-4 py-3 transition-all duration-200 hover:bg-surface">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-pos/15 text-pos">
              <Icon name="arrow-up" className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-ink3">Income</p>
              <p className="tnum text-sm font-bold">{formatMoney(t.income, currency, locale)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-line bg-surface/60 px-4 py-3 transition-all duration-200 hover:bg-surface">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-neg/15 text-neg">
              <Icon name="arrow-down" className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-ink3">Expenses</p>
              <p className="tnum text-sm font-bold">{formatMoney(t.expense, currency, locale)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-line bg-surface/60 px-4 py-3 transition-all duration-200 hover:bg-surface">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-info/15 text-info">
              <Icon name="target" className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-ink3">Saved</p>
              <p className="tnum text-sm font-bold">
                {formatMoney(t.saved, currency, locale)}
                {t.income > 0 && <span className="ml-1 text-xs font-normal text-ink3">({t.savings_rate}%)</span>}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Income + Expenses (2-col) ── */}
      <div className="grid gap-6 md:grid-cols-2">
        <StatTile
          icon="arrow-up"
          tone="pos"
          label="Income"
          value={formatMoney(t.income, currency, locale)}
          sub="This month"
          barPct={t.income > 0 ? Math.min(100, t.savings_rate * 2 || 60) : 0}
        />
        <StatTile
          icon="arrow-down"
          tone="neg"
          label="Expenses"
          value={formatMoney(t.expense, currency, locale)}
          sub={p.expense > 0 ? "This month · vs last" : "This month"}
          barPct={expenseVsPrevPct}
        />
      </div>

      {/* ── Health Score + Net Worth (2-col) ── */}
      <div className="grid gap-6 md:grid-cols-2">
        {healthScore ? (
          <Card title="Financial Health Score">
            <div className="flex items-center gap-6">
              <div className="relative size-24 shrink-0">
                <svg viewBox="0 0 36 36" className="size-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-sunken" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeDasharray={`${healthScore.overall_score} ${100 - healthScore.overall_score}`}
                    strokeLinecap="round"
                    className="text-brand"
                  />
                </svg>
                <span className="absolute inset-0 grid place-items-center font-display text-2xl font-bold">{healthScore.overall_score}</span>
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                {Object.entries(healthScore.dimensions).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    <span className="truncate text-ink2 capitalize">{key.replace(/_/g, " ")}</span>
                    <span className="ml-auto font-semibold">{val}/100</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ) : (
          <Card title="Financial Health Score">
            <EmptyState
              icon={<Icon name="heart" className="size-7" />}
              title="Score unavailable"
              body="Connect accounts to see your financial health."
            />
          </Card>
        )}

        {netWorth !== null ? (
          <Card title="Net Worth">
            <div className="flex flex-col gap-3">
              <p className="tnum font-display text-3xl font-extrabold tracking-tight">
                {formatMoney(netWorth, currency, locale)}
              </p>
              <p className="text-sm text-ink3">Across all active accounts</p>
              <div className="mt-2 flex items-center gap-2">
                <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${netWorth >= 0 ? "bg-pos/15 text-pos" : "bg-neg/15 text-neg"}`}>
                  <Icon name="chart" className="size-4" />
                </span>
                <span className="text-sm font-medium text-ink2">
                  {netWorth >= 0 ? "Positive net worth" : "Working toward positive net worth"}
                </span>
              </div>
            </div>
          </Card>
        ) : (
          <Card title="Net Worth">
            <EmptyState
              icon={<Icon name="chart" className="size-7" />}
              title="No accounts yet"
              body="Add accounts to see your net worth."
            />
          </Card>
        )}
      </div>

      {/* ── Spending Overview (full width) ── */}
      <Card
        title="Spending Overview"
        action={
          <span className="inline-flex items-center gap-3 text-xs text-ink3">
            <span className="hidden items-center gap-1.5 sm:inline-flex">
              <span className="h-[3px] w-4 rounded bg-brand" /> This month
            </span>
            <span className="hidden items-center gap-1.5 sm:inline-flex">
              <span className="inline-block h-[3px] w-4 border-t-2 border-dashed border-ink3 align-middle" /> Last month
            </span>
            <span className="rounded-md border border-line px-2 py-1 font-medium text-ink2">This Month</span>
          </span>
        }
      >
        <SpendingChart series={data.spending_series} currency={currency} locale={locale} />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-sm">
          <span className="tnum text-ink2">
            <strong className="font-semibold text-paper">{formatMoney(t.expense, currency, locale)}</strong> spent so far
          </span>
          <span className="tnum text-ink3">Daily avg: {formatMoney(dailyAvg, currency, locale)}</span>
        </div>
      </Card>

      {/* ── Top Categories (full width) ── */}
      <Card title="Top Categories" action={<ViewAllLink href="/analytics" />} bodyClassName="min-h-[240px]">
        {categories.length === 0 ? (
          <EmptyState
            title="No spending yet"
            body="Your category breakdown appears once you record expenses."
          />
        ) : (
          <CategoryDonut slices={categories} currency={currency} locale={locale} />
        )}
      </Card>

      {/* ── Budgets (full width) ── */}
      <Card title="Budgets" action={<ViewAllLink href="/budgets" />} bodyClassName="min-h-[240px]">
        {loadingBudgets ? (
          <SkeletonRows rows={4} />
        ) : !currentBudget || currentBudget.items.length === 0 ? (
          <EmptyState
            icon={<Icon name="target" className="size-7" />}
            title="No budget yet"
            body="Plan the month before it spends itself."
            action={
              <Link
                href="/budgets"
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-surface px-3.5 text-[13px] font-medium shadow-line transition-colors hover:bg-sunken/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
              >
                <Icon name="plus" className="size-4" /> Create Budget
              </Link>
            }
          />
        ) : (
          <ul className="space-y-4">
            {currentBudget.items.slice(0, 5).map((item) => (
              <li key={item.item_id} className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="grid size-9 shrink-0 place-items-center rounded-lg text-[10px] font-bold uppercase"
                  style={{ backgroundColor: `${item.category_color}22`, color: item.category_color }}
                >
                  {item.category_name.slice(0, 2)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2 text-[13px]">
                    <span className="truncate font-medium">{item.category_name}</span>
                    <span className="tnum shrink-0 text-ink3">
                      <span className="text-ink2">{formatMoney(item.spent, currency, locale)}</span>
                      {" / "}
                      {formatMoney(item.budgeted, currency, locale)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <ProgressBar pct={item.pct_used} height="h-1" delay={80} className="flex-1" />
                    <span
                      className={`tnum w-10 shrink-0 text-right text-xs font-semibold ${
                        item.pct_used >= 100 ? "text-neg" : item.pct_used >= 75 ? "text-warn" : "text-pos"
                      }`}
                    >
                      {formatPercent(item.pct_used)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* ── Goals (full width) ── */}
      <Card title="Goals" action={<ViewAllLink href="/goals" />} bodyClassName="min-h-[240px]">
        {data.goals.length === 0 ? (
          <EmptyState
            icon={<Icon name="flag" className="size-7" />}
            title="No goals yet"
            body="Saving feels different when you can see the finish line."
            action={
              <Link
                href="/goals"
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-surface px-3.5 text-[13px] font-medium shadow-line transition-colors hover:bg-sunken/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
              >
                <Icon name="plus" className="size-4" /> Add Goal
              </Link>
            }
          />
        ) : (
          <>
            <ul className="space-y-4">
              {data.goals.slice(0, 4).map((g) => {
                const pct = g.target_amount > 0 ? Math.min(100, (g.current_amount / g.target_amount) * 100) : 0;
                return (
                  <li key={g.id} className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="grid size-9 shrink-0 place-items-center rounded-lg"
                      style={{ backgroundColor: `${g.color}22`, color: g.color }}
                    >
                      <Icon name="flag" className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2 text-[13px]">
                        <span className="truncate font-medium">{g.name}</span>
                        <span className="tnum shrink-0 text-xs font-semibold text-ink2">{Math.round(pct)}%</span>
                      </div>
                      <p className="tnum mt-0.5 text-xs text-ink3">
                        {formatMoney(g.current_amount, currency, locale)} / {formatMoney(g.target_amount, currency, locale)}
                        {g.deadline ? ` · ${deadlineLabel(g.deadline)}` : ""}
                      </p>
                      <div className="mt-1.5">
                        <ProgressBar pct={pct} height="h-1" delay={120} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <Link
              href="/goals"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition-colors hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
            >
              <Icon name="plus" className="size-4" /> Add New Goal
            </Link>
          </>
        )}
      </Card>

      {/* ── Recent Activity (full width) ── */}
      <Card title="Recent Activity" action={<ViewAllLink href="/transactions" />}>
        {data.recent_transactions.length === 0 ? (
          <EmptyState
            icon={<Icon name="activity" className="size-7" />}
            title="Nothing here yet"
            body="Record your first transaction and the ledger starts filling in."
          />
        ) : (
          <TransactionLedger transactions={data.recent_transactions.slice(0, 6)} currency={currency} locale={locale} />
        )}
      </Card>

      {/* ── Recommendations (full width) ── */}
      {recommendations.length > 0 ? (
        <Card title="Recommendations">
          <ul className="grid gap-4 sm:grid-cols-2">
            {recommendations.map((rec) => (
              <li
                key={rec.id}
                className="flex items-start gap-3 rounded-lg border border-line p-4 transition-all duration-200 hover:bg-sunken/30"
              >
                <span className={`mt-0.5 inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  rec.impact === "high" ? "bg-pos/15 text-pos" : rec.impact === "medium" ? "bg-warn/15 text-warn" : "bg-info/15 text-info"
                }`}>
                  {rec.impact}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{rec.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink3">{rec.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {/* ── Insights (full width) ── */}
      <Card title="Insights" action={<ViewAllLink href="/analytics" />}>
        <ul className="space-y-5">
          {insights.slice(0, 3).map((insight, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${TONE_TILE[insight.tone]}`}>
                <Icon name={insight.icon} className="size-[18px]" />
              </span>
              <div className="min-w-0">
                <p className="text-pretty text-sm font-medium leading-snug text-paper">{insight.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink3">{insight.sub}</p>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
});
