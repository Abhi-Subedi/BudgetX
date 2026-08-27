"use client";

import { PageHeader } from "../components/layout/AppShell";
import { ProgressBar } from "../components/ui/Controls";
import { EmptyState, ErrorState, Skeleton, SkeletonRows } from "../components/ui/States";
import { Icon } from "../components/icons";
import { useResource } from "../hooks/useResource";
import { useAuth } from "../hooks/useAuth";
import { formatMoney } from "../lib/format";
import type { BalanceProjection, SpendingProjection, CashWarning, GoalFeasibility } from "../types";

const SEVERITY_COLORS: Record<string, string> = {
  low: "bg-info/15 text-info",
  medium: "bg-warn/15 text-warn",
  high: "bg-neg/15 text-neg"
};

export default function ForecastsPage() {
  const { user } = useAuth();
  const currency = user?.currency ?? "USD";
  const locale = user?.locale ?? "en-US";

  const balance30 = useResource<BalanceProjection>("/forecasts/balance?days=30");
  const balance60 = useResource<BalanceProjection>("/forecasts/balance?days=60");
  const balance90 = useResource<BalanceProjection>("/forecasts/balance?days=90");
  const spendingRes = useResource<{ items: SpendingProjection[] }>("/forecasts/spending?months=3");
  const warningsRes = useResource<{ items: CashWarning[] }>("/forecasts/warnings");
  const goalsRes = useResource<{ items: GoalFeasibility[] }>("/forecasts/goals");

  if (balance30.error) return <ErrorState message={balance30.error} onRetry={balance30.reload} />;

  const projections = [
    { label: "30 Days", data: balance30.data },
    { label: "60 Days", data: balance60.data },
    { label: "90 Days", data: balance90.data }
  ];
  const spending = spendingRes.data?.items ?? [];
  const warnings = warningsRes.data?.items ?? [];
  const goals = goalsRes.data?.items ?? [];
  const loading = balance30.loading || !balance30.data;

  return (
    <div>
      <PageHeader
        title="Financial Forecasts"
        subtitle="See where your money is headed."
      />

      <div className="space-y-8">
        <section aria-label="Balance projection">
          <h2 className="mb-4 font-display text-lg font-semibold tracking-tight">Projected Balance</h2>
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-3">
              {projections.map((p) => (
                <div
                  key={p.label}
                  className="rounded-2xl border border-line bg-surface p-5"
                >
                  <p className="text-sm font-medium text-ink2">{p.label}</p>
                  <p className={`tnum mt-2 text-2xl font-bold ${(p.data?.projected_balance ?? 0) >= 0 ? "" : "text-neg"}`}>
                    {formatMoney(p.data?.projected_balance ?? 0, currency, locale)}
                  </p>
                  {p.data && (
                    <p className="mt-1 text-xs text-ink3">
                      From {formatMoney(p.data.current_balance, currency, locale)} today
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section aria-label="Spending projection">
          <h2 className="mb-4 font-display text-lg font-semibold tracking-tight">Spending Projection (3 months)</h2>
          {spendingRes.loading ? (
            <SkeletonRows rows={4} />
          ) : spending.length === 0 ? (
            <EmptyState
              icon={<Icon name="chart" className="size-7" />}
              title="No spending data"
              body="Add transactions to see spending projections."
            />
          ) : (
            <div className="rounded-2xl border border-line bg-surface p-5">
              <div className="space-y-4">
                {spending.map((s) => (
                  <div key={s.category} className="flex items-center gap-3">
                    <span className="w-32 shrink-0 truncate text-sm text-ink2">{s.category}</span>
                    <div className="flex-1">
                      <ProgressBar pct={s.pct} height="h-2" />
                    </div>
                    <span className="tnum w-20 shrink-0 text-right text-sm font-medium">{formatMoney(s.amount, currency, locale)}</span>
                    <span className="tnum w-12 shrink-0 text-right text-xs text-ink3">{s.pct.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section aria-label="Cash shortage warnings">
          <h2 className="mb-4 font-display text-lg font-semibold tracking-tight">Cash Warnings</h2>
          {warningsRes.loading ? (
            <SkeletonRows rows={3} />
          ) : warnings.length === 0 ? (
            <EmptyState
              icon={<Icon name="alert" className="size-7" />}
              title="All clear"
              body="No cash shortage warnings at this time."
            />
          ) : (
            <ul className="space-y-3">
              {warnings.map((w) => (
                <li key={w.id} className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4">
                  <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${SEVERITY_COLORS[w.severity]}`}>
                    <Icon name="alert" className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{w.message}</p>
                    <p className="mt-0.5 text-xs text-ink3">{w.type} · {w.date ?? "Ongoing"}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-label="Goal feasibility">
          <h2 className="mb-4 font-display text-lg font-semibold tracking-tight">Goal Feasibility</h2>
          {goalsRes.loading ? (
            <SkeletonRows rows={3} />
          ) : goals.length === 0 ? (
            <EmptyState
              icon={<Icon name="flag" className="size-7" />}
              title="No goals to check"
              body="Create goals to see if they're on track."
            />
          ) : (
            <div className="space-y-4">
              {goals.map((g) => {
                const progress = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0;
                return (
                  <div key={g.goal_id} className="rounded-2xl border border-line bg-surface p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[15px] font-medium">{g.goal_name}</p>
                        <p className="text-xs text-ink3">
                          {formatMoney(g.current_amount, currency, locale)} / {formatMoney(g.target_amount, currency, locale)}
                          {g.deadline && ` · By ${g.deadline}`}
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${g.feasible ? "bg-pos/15 text-pos" : "bg-neg/15 text-neg"}`}>
                        {g.feasible ? "On Track" : "At Risk"}
                      </span>
                    </div>
                    <div className="mt-3">
                      <ProgressBar pct={progress} height="h-1.5" />
                    </div>
                    <p className="mt-2 text-xs text-ink3">
                      Need {formatMoney(g.monthly_savings_needed, currency, locale)}/month to reach goal
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
