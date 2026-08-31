"use client";

import { useCallback, useEffect, useState } from "react";

import { PageHeader } from "../components/layout/AppShell";
import { Icon } from "../components/icons";
import { useAuth } from "../hooks/useAuth";
import { formatMoney } from "../lib/format";
import * as api from "../lib/api";

interface Overview {
  income: number;
  expense: number;
  saved: number;
}

const CATEGORIES = ["Food", "Transport", "Entertainment"] as const;

export default function WhatIfPage() {
  const { user } = useAuth();
  const currency = user?.currency ?? "USD";
  const locale = user?.locale ?? "en-US";

  const [incomeChange, setIncomeChange] = useState("");
  const [categoryChanges, setCategoryChanges] = useState<Record<string, string>>({});
  const [baseData, setBaseData] = useState<Overview | null>(null);
  const [simulated, setSimulated] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const now = new Date();
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const overview = await api.get<Overview>(`/analytics/overview?month=${month}`);
        setBaseData(overview);
        setSimulated(null);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSimulate = useCallback(() => {
    if (!baseData) return;

    const incomeDelta = parseFloat(incomeChange) || 0;
    let expenseDelta = 0;

    for (const cat of CATEGORIES) {
      const val = parseFloat(categoryChanges[cat] || "0");
      if (!isNaN(val)) expenseDelta += val;
    }

    const newIncome = baseData.income + incomeDelta;
    const newExpense = baseData.expense + expenseDelta;
    const newSaved = newIncome - newExpense;

    setSimulated({
      income: newIncome,
      expense: newExpense,
      saved: newSaved,
    });
  }, [baseData, incomeChange, categoryChanges]);

  if (loading) {
    return (
      <div>
        <PageHeader title="What-If Simulator" subtitle="Model scenarios before committing to changes." />
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-sunken" />
          ))}
        </div>
      </div>
    );
  }

  const yearlySaved = baseData ? baseData.saved * 12 : 0;
  const projectedYearlySaved = simulated ? simulated.saved * 12 : null;
  const diff = projectedYearlySaved !== null ? projectedYearlySaved - yearlySaved : null;

  return (
    <div>
      <PageHeader
        title="What-If Simulator"
        subtitle="Model scenarios before committing to changes."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="mb-4 font-display text-[15px] font-bold tracking-tight text-white">Income Change</h2>
          <div className="flex items-center gap-3">
            <span className="text-ink3">+/−</span>
            <input
              type="number"
              value={incomeChange}
              onChange={(e) => setIncomeChange(e.target.value)}
              placeholder="0.00"
              className="h-10 w-full rounded-lg border border-line bg-sunken px-3 text-sm text-white outline-none placeholder:text-ink3 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
            <span className="text-sm text-ink3">{currency}/mo</span>
          </div>

          <h2 className="mb-3 mt-6 font-display text-[15px] font-bold tracking-tight text-white">Category Spending Changes</h2>
          <div className="space-y-3">
            {CATEGORIES.map((cat) => (
              <div key={cat} className="flex items-center gap-3">
                <label className="w-28 shrink-0 text-sm text-ink2">{cat}</label>
                <input
                  type="number"
                  value={categoryChanges[cat] || ""}
                  onChange={(e) => setCategoryChanges((prev) => ({ ...prev, [cat]: e.target.value }))}
                  placeholder="0.00"
                  className="h-10 w-full rounded-lg border border-line bg-sunken px-3 text-sm text-white outline-none placeholder:text-ink3 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
                <span className="text-sm text-ink3">{currency}/mo</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleSimulate}
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-md bg-brand px-5 text-sm font-medium text-white transition-colors hover:bg-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <Icon name="spark" className="size-4" />
            Simulate
          </button>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="mb-4 font-display text-[15px] font-bold tracking-tight text-white">Results</h2>

          {!baseData ? (
            <p className="text-sm text-ink3">No data available.</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-sunken p-4">
                  <p className="text-xs font-medium text-ink3">Current Yearly Savings</p>
                  <p className="tnum mt-1 font-display text-lg font-bold text-white">
                    {formatMoney(yearlySaved, currency, locale)}
                  </p>
                </div>
                <div className="rounded-xl bg-sunken p-4">
                  <p className="text-xs font-medium text-ink3">Projected Yearly Savings</p>
                  <p className="tnum mt-1 font-display text-lg font-bold text-white">
                    {projectedYearlySaved !== null ? formatMoney(projectedYearlySaved, currency, locale) : "—"}
                  </p>
                </div>
              </div>

              {diff !== null && (
                <div className={`rounded-xl p-4 ${diff >= 0 ? "bg-pos/15" : "bg-neg/15"}`}>
                  <p className="text-xs font-medium text-ink3">Difference per year</p>
                  <p className={`tnum mt-1 font-display text-lg font-bold ${diff >= 0 ? "text-pos" : "text-neg"}`}>
                    {diff >= 0 ? "+" : ""}{formatMoney(diff, currency, locale)}
                  </p>
                </div>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink3">Monthly income</span>
                  <span className="tnum font-medium text-white">
                    {formatMoney(simulated?.income ?? baseData.income, currency, locale)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink3">Monthly expenses</span>
                  <span className="tnum font-medium text-white">
                    {formatMoney(simulated?.expense ?? baseData.expense, currency, locale)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-line pt-2">
                  <span className="text-ink3">Monthly saved</span>
                  <span className="tnum font-medium text-white">
                    {formatMoney(simulated?.saved ?? baseData.saved, currency, locale)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
