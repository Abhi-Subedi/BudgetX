"use client";

import { useState } from "react";

import { PageHeader } from "../components/layout/AppShell";
import { ProgressBar } from "../components/ui/Controls";
import { Icon } from "../components/icons";
import {
  EmptyState,
  ErrorState,
  Skeleton,
} from "../components/ui/States";
import { useAuth } from "../hooks/useAuth";
import { useResource } from "../hooks/useResource";
import {
  formatMoney,
  formatPercent,
  monthLabel,
} from "../lib/format";

/* =========================================================
   API RESPONSE TYPE
   ========================================================= */

interface MonthlyReport {
  year: number;
  month: number;

  total_income: number;
  total_expenses: number;
  savings: number;
  savings_rate: number;

  top_categories: Array<{
    category: string;
    amount: number;
  }>;

  budget_performance: Array<{
    category: string;
    budgeted: number;
    spent: number;
    remaining: number;
    pct_used: number;
  }>;

  goals_progress: Array<{
    goal: string;
    contributed: number;
    target: number;
    current: number;
    pct_complete: number;
  }>;

  month_over_month_comparison: {
    income_change_pct: number;
    expense_change_pct: number;
  };
}

/* =========================================================
   CATEGORY COLORS
   API DOES NOT CURRENTLY RETURN COLORS
   ========================================================= */

const CATEGORY_COLORS: Record<string, string> = {
  "Food & Drink": "#F59E0B",
  Groceries: "#22C55E",
  Housing: "#3B82F6",
  Entertainment: "#A855F7",
  Health: "#EF4444",
  Education: "#06B6D4",
  Uncategorized: "#8B5CF6",
};

const DEFAULT_CATEGORY_COLORS = [
  "#8B5CF6",
  "#3B82F6",
  "#22C55E",
  "#F59E0B",
  "#EF4444",
  "#06B6D4",
];

/* =========================================================
   HELPERS
   ========================================================= */

function getCategoryColor(
  category: string,
  index: number
): string {
  return (
    CATEGORY_COLORS[category] ??
    DEFAULT_CATEGORY_COLORS[
      index % DEFAULT_CATEGORY_COLORS.length
    ]
  );
}

function safeNumber(value: unknown): number {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/* =========================================================
   MONTH NAVIGATION
   ========================================================= */

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
    if (month === 1) {
      onChange(year - 1, 12);
    } else {
      onChange(year, month - 1);
    }
  };

  const fwd = () => {
    if (month === 12) {
      onChange(year + 1, 1);
    } else {
      onChange(year, month + 1);
    }
  };

  const now = new Date();

  const isFuture =
    year > now.getFullYear() ||
    (year === now.getFullYear() &&
      month > now.getMonth() + 1);

  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-line bg-sunken/70 p-0.5">
      <button
        type="button"
        onClick={back}
        className="grid size-8 place-items-center rounded-[5px] text-ink3 transition-colors hover:bg-line hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
        aria-label="Previous month"
      >
        <Icon
          name="chevron-left"
          className="size-4"
        />
      </button>

      <span className="min-w-[120px] text-center text-sm font-semibold text-white">
        {monthLabel(
          `${year}-${String(month).padStart(2, "0")}`,
          true
        )}
      </span>

      <button
        type="button"
        onClick={fwd}
        disabled={isFuture}
        className="grid size-8 place-items-center rounded-[5px] text-ink3 transition-colors hover:bg-line hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-40"
        aria-label="Next month"
      >
        <Icon
          name="chevron-right"
          className="size-4"
        />
      </button>
    </div>
  );
}

/* =========================================================
   CHANGE INDICATOR
   ========================================================= */

function Delta({
  value,
  inverse = false,
}: {
  value: number;
  inverse?: boolean;
}) {
  const pct = safeNumber(value);

  if (!Number.isFinite(pct) || Math.abs(pct) < 0.1) {
    return (
      <span className="text-xs font-medium text-ink3">
        No change
      </span>
    );
  }

  const up = pct > 0;

  /*
   * Income:
   *   increase = positive
   *   decrease = negative
   *
   * Expenses:
   *   increase = negative
   *   decrease = positive
   */

  const positive = inverse ? !up : up;

  return (
    <span
      className={`tnum inline-flex items-center gap-1 text-xs font-semibold ${
        positive ? "text-pos" : "text-neg"
      }`}
    >
      <span>{up ? "▲" : "▼"}</span>
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

/* =========================================================
   MAIN PAGE
   ========================================================= */

export default function ReportsPage() {
  const { user } = useAuth();

  const currency = user?.currency ?? "USD";
  const locale = user?.locale ?? "en-US";

  const now = new Date();

  const [year, setYear] = useState(
    now.getFullYear()
  );

  const [month, setMonth] = useState(
    now.getMonth() + 1
  );

  /*
   * If your useResource already adds "/api",
   * change this to:
   *
   * /report/monthly?year=...
   *
   * Otherwise keep:
   *
   * /api/report/monthly?year=...
   */

  const reportRes = useResource<MonthlyReport>(
    `/reports/monthly?year=${year}&month=${month}`
  );


  if (reportRes.error) {
    return (
      <ErrorState
        message={reportRes.error}
        onRetry={reportRes.reload}
      />
    );
  }

  return (
    <div>
      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <PageHeader
        title="Monthly Reports"
        subtitle="Track your monthly financial performance."
        actions={
          <MonthNav
            year={year}
            month={month}
            onChange={(y, m) => {
              setYear(y);
              setMonth(m);
            }}
          />
        }
      />

      {/* =====================================================
          LOADING
          ===================================================== */}

      {reportRes.loading || !reportRes.data ? (
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                className="h-28 rounded-2xl"
              />
            ))}
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Skeleton className="h-72 rounded-2xl" />
            <Skeleton className="h-72 rounded-2xl" />
          </div>

          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : (
        <ReportBody
          data={reportRes.data}
          currency={currency}
          locale={locale}
        />
      )}
    </div>
  );
}

/* =========================================================
   REPORT BODY
   ========================================================= */

function ReportBody({
  data,
  currency,
  locale,
}: {
  data: MonthlyReport;
  currency: string;
  locale: string;
}) {
  const totalIncome = safeNumber(
    data.total_income
  );

  const totalExpenses = safeNumber(
    data.total_expenses
  );

  const savings = safeNumber(data.savings);

  const savingsRate = safeNumber(
    data.savings_rate
  );

  const incomeChange = safeNumber(
    data.month_over_month_comparison
      ?.income_change_pct
  );

  const expenseChange = safeNumber(
    data.month_over_month_comparison
      ?.expense_change_pct
  );

  return (
    <div className="space-y-6">
      {/* =====================================================
          SUMMARY CARDS
          ===================================================== */}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon="arrow-up"
          tone="pos"
          label="Income"
          value={formatMoney(
            totalIncome,
            currency,
            locale
          )}
        >
          <Delta value={incomeChange} />
        </StatCard>

        <StatCard
          icon="arrow-down"
          tone="neg"
          label="Expenses"
          value={formatMoney(
            totalExpenses,
            currency,
            locale
          )}
        >
          <Delta
            value={expenseChange}
            inverse
          />
        </StatCard>

        <StatCard
          icon="target"
          tone="info"
          label="Savings"
          value={formatMoney(
            savings,
            currency,
            locale
          )}
        >
          <span className="text-xs text-ink3">
            Income − Expenses
          </span>
        </StatCard>

        <StatCard
          icon="trending-up"
          tone="brand"
          label="Savings Rate"
          value={formatPercent(
            savingsRate
          )}
        >
          <span className="text-xs text-ink3">
            {formatMoney(
              savings,
              currency,
              locale
            )}{" "}
            saved
          </span>
        </StatCard>
      </div>

      {/* =====================================================
          TOP CATEGORIES
          ===================================================== */}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-[15px] font-bold tracking-tight text-white">
                Top Categories
              </h2>

              <p className="mt-1 text-xs text-ink3">
                Where your money was spent
              </p>
            </div>

            <span className="tnum text-xs font-medium text-ink3">
              {formatMoney(
                totalExpenses,
                currency,
                locale
              )}
            </span>
          </div>

          {!data.top_categories ||
          data.top_categories.length === 0 ? (
            <EmptyState
              title="No expenses"
              body="Record expenses to see category breakdown."
            />
          ) : (
            <ul className="space-y-4">
              {data.top_categories.map(
                (cat, index) => {
                  const category =
                    cat?.category ||
                    "Uncategorized";

                  const amount =
                    safeNumber(cat?.amount);

                  const pct =
                    totalExpenses > 0
                      ? (amount /
                          totalExpenses) *
                        100
                      : 0;

                  const color =
                    getCategoryColor(
                      category,
                      index
                    );

                  return (
                    <li
                      key={`${category}-${index}`}
                    >
                      <div className="flex items-center gap-3">
                        {/* ICON */}

                        <span
                          className="grid size-9 shrink-0 place-items-center rounded-lg text-[10px] font-bold uppercase"
                          style={{
                            backgroundColor:
                              `${color}22`,
                            color,
                          }}
                        >
                          {category
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>

                        {/* CONTENT */}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <span className="truncate text-[13px] font-medium text-white">
                              {category}
                            </span>

                            <span className="tnum shrink-0 text-[13px] font-medium text-ink2">
                              {formatMoney(
                                amount,
                                currency,
                                locale
                              )}
                            </span>
                          </div>

                          <div className="mt-1.5 flex items-center gap-2">
                            <ProgressBar
                              pct={clampPercent(
                                pct
                              )}
                              height="h-1"
                              delay={
                                80 +
                                index * 40
                              }
                              className="flex-1"
                            />

                            <span className="tnum w-12 shrink-0 text-right text-xs text-ink3">
                              {formatPercent(
                                pct
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                }
              )}
            </ul>
          )}
        </section>

        {/* ===================================================
            BUDGET PERFORMANCE
            =================================================== */}

        <section className="rounded-2xl border border-line bg-surface p-5">
          <div className="mb-4">
            <h2 className="font-display text-[15px] font-bold tracking-tight text-white">
              Budget Performance
            </h2>

            <p className="mt-1 text-xs text-ink3">
              Track spending against your budgets
            </p>
          </div>

          {!data.budget_performance ||
          data.budget_performance.length === 0 ? (
            <EmptyState
              title="No budgets"
              body="Set budgets to track performance."
            />
          ) : (
            <ul className="space-y-4">
              {data.budget_performance.map(
                (budget, index) => {
                  const category =
                    budget?.category ||
                    "Uncategorized";

                  const budgeted =
                    safeNumber(
                      budget?.budgeted
                    );

                  const spent =
                    safeNumber(
                      budget?.spent
                    );

                  const remaining =
                    safeNumber(
                      budget?.remaining
                    );

                  const pctUsed =
                    safeNumber(
                      budget?.pct_used
                    );

                  const color =
                    getCategoryColor(
                      category,
                      index
                    );

                  const isOverBudget =
                    pctUsed >= 100;

                  return (
                    <li
                      key={`${category}-${index}`}
                    >
                      <div className="flex items-center gap-3">
                        {/* ICON */}

                        <span
                          className="grid size-9 shrink-0 place-items-center rounded-lg text-[10px] font-bold uppercase"
                          style={{
                            backgroundColor:
                              `${color}22`,
                            color,
                          }}
                        >
                          {category
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>

                        <div className="min-w-0 flex-1">
                          {/* HEADER */}

                          <div className="flex items-center justify-between gap-3">
                            <span className="truncate text-[13px] font-medium text-white">
                              {category}
                            </span>

                            <span className="tnum shrink-0 text-xs text-ink3">
                              {formatMoney(
                                spent,
                                currency,
                                locale
                              )}{" "}
                              /{" "}
                              {formatMoney(
                                budgeted,
                                currency,
                                locale
                              )}
                            </span>
                          </div>

                          {/* PROGRESS */}

                          <div className="mt-1.5 flex items-center gap-2">
                            <ProgressBar
                              pct={clampPercent(
                                pctUsed
                              )}
                              height="h-1"
                              delay={
                                80 +
                                index * 40
                              }
                              className="flex-1"
                            />

                            <span
                              className={`tnum w-12 shrink-0 text-right text-xs font-semibold ${
                                isOverBudget
                                  ? "text-neg"
                                  : pctUsed >=
                                      75
                                    ? "text-warn"
                                    : "text-pos"
                              }`}
                            >
                              {formatPercent(
                                pctUsed
                              )}
                            </span>
                          </div>

                          {/* REMAINING */}

                          <div className="mt-1">
                            <span
                              className={`text-[11px] ${
                                remaining <
                                0
                                  ? "font-semibold text-neg"
                                  : "text-ink3"
                              }`}
                            >
                              {remaining <
                              0
                                ? `${formatMoney(
                                    Math.abs(
                                      remaining
                                    ),
                                    currency,
                                    locale
                                  )} over budget`
                                : `${formatMoney(
                                    remaining,
                                    currency,
                                    locale
                                  )} remaining`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                }
              )}
            </ul>
          )}
        </section>
      </div>

      {/* =====================================================
          GOALS
          ===================================================== */}

      {data.goals_progress &&
        data.goals_progress.length > 0 && (
          <section className="rounded-2xl border border-line bg-surface p-5">
            <div className="mb-4">
              <h2 className="font-display text-[15px] font-bold tracking-tight text-white">
                Goals Progress
              </h2>

              <p className="mt-1 text-xs text-ink3">
                Track your progress toward financial goals
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.goals_progress.map(
                (goal, index) => {
                  const goalName =
                    goal?.goal ||
                    "Unnamed Goal";

                  const target =
                    safeNumber(
                      goal?.target
                    );

                  const current =
                    safeNumber(
                      goal?.current
                    );

                  const contributed =
                    safeNumber(
                      goal?.contributed
                    );

                  const pct =
                    safeNumber(
                      goal?.pct_complete
                    );

                  const progress =
                    clampPercent(pct);

                  return (
                    <div
                      key={`${goalName}-${index}`}
                      className="rounded-xl border border-line bg-sunken/40 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-medium text-white">
                          {goalName}
                        </span>

                        <span className="tnum shrink-0 rounded-md bg-brand/10 px-2 py-1 text-xs font-semibold text-brand">
                          {formatPercent(
                            pct
                          )}
                        </span>
                      </div>

                      <ProgressBar
                        pct={progress}
                        height="h-1.5"
                        delay={
                          100 + index * 40
                        }
                      />

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="tnum text-sm font-semibold text-white">
                            {formatMoney(
                              current,
                              currency,
                              locale
                            )}
                          </p>

                          <p className="mt-0.5 text-[11px] text-ink3">
                            of{" "}
                            {formatMoney(
                              target,
                              currency,
                              locale
                            )}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="tnum text-xs text-ink2">
                            {formatMoney(
                              contributed,
                              currency,
                              locale
                            )}
                          </p>

                          <p className="mt-0.5 text-[11px] text-ink3">
                            contributed
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </section>
        )}

      {/* =====================================================
          MONTH OVER MONTH
          ===================================================== */}

      <section className="rounded-2xl border border-line bg-surface p-5">
        <div className="mb-4">
          <h2 className="font-display text-[15px] font-bold tracking-tight text-white">
            Month-over-Month
          </h2>

          <p className="mt-1 text-xs text-ink3">
            Compare this month with the previous month
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ComparisonRow
            label="Income"
            current={totalIncome}
            changePct={incomeChange}
            currency={currency}
            locale={locale}
          />

          <ComparisonRow
            label="Expenses"
            current={totalExpenses}
            changePct={expenseChange}
            currency={currency}
            locale={locale}
            inverse
          />
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   STAT CARD
   ========================================================= */

function StatCard({
  icon,
  tone,
  label,
  value,
  children,
}: {
  icon:
    | "arrow-up"
    | "arrow-down"
    | "target"
    | "trending-up";

  tone:
    | "pos"
    | "neg"
    | "info"
    | "brand";

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
        <span
          className={`grid size-8 shrink-0 place-items-center rounded-lg ${toneBg}`}
        >
          <Icon
            name={icon}
            className="size-4"
          />
        </span>

        <span className="truncate text-sm font-medium text-ink2">
          {label}
        </span>
      </div>

      <div className="mt-2">
        <p className="tnum font-display text-xl font-bold tracking-tight text-white">
          {value}
        </p>

        {children ? (
          <span className="mt-1 block">
            {children}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/* =========================================================
   COMPARISON ROW
   ========================================================= */

function ComparisonRow({
  label,
  current,
  changePct,
  currency,
  locale,
  inverse = false,
}: {
  label: string;
  current: number;
  changePct: number;
  currency: string;
  locale: string;
  inverse?: boolean;
}) {
  const pct = safeNumber(changePct);

  const isPositive = inverse
    ? pct <= 0
    : pct >= 0;

  const hasChange = Math.abs(pct) >= 0.1;

  return (
    <div className="rounded-xl border border-line bg-sunken/40 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-ink2">
            {label}
          </p>

          <p className="tnum mt-1 font-display text-lg font-bold text-white">
            {formatMoney(
              current,
              currency,
              locale
            )}
          </p>
        </div>

        {hasChange ? (
          <span
            className={`rounded-md px-2 py-1 text-xs font-semibold ${
              isPositive
                ? "bg-pos/10 text-pos"
                : "bg-neg/10 text-neg"
            }`}
          >
            {pct >= 0 ? "+" : ""}
            {pct.toFixed(1)}%
          </span>
        ) : (
          <span className="rounded-md bg-line/40 px-2 py-1 text-xs font-medium text-ink3">
            0.0%
          </span>
        )}
      </div>

      <div className="mt-3 border-t border-line pt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-ink3">
            Previous month
          </span>

          <span
            className={`font-semibold ${
              hasChange
                ? isPositive
                  ? "text-pos"
                  : "text-neg"
                : "text-ink3"
            }`}
          >
            {hasChange
              ? pct > 0
                ? "Higher"
                : "Lower"
              : "No change"}
          </span>
        </div>
      </div>
    </div>
  );
}