"use client";

import { useState } from "react";

import { PageHeader } from "../components/layout/AppShell";
import { Button } from "../components/ui/Button";
import { ProgressBar } from "../components/ui/Controls";
import { EmptyState, ErrorState, Skeleton, SkeletonRows } from "../components/ui/States";
import { Icon } from "../components/icons";
import { useResource } from "../hooks/useResource";
import { useAuth } from "../hooks/useAuth";
import { post } from "../lib/api";
import { formatMoney } from "../lib/format";
import type { Investment, PortfolioSummary, Account } from "../types";

const INVESTMENT_TYPES = ["stock", "mutual_fund", "bond", "fixed_deposit", "crypto", "other"] as const;

const TYPE_LABELS: Record<string, string> = {
  stock: "Stock",
  mutual_fund: "Mutual Fund",
  bond: "Bond",
  fixed_deposit: "Fixed Deposit",
  crypto: "Crypto",
  other: "Other"
};

const TYPE_COLORS: Record<string, string> = {
  stock: "bg-brand/15 text-brand",
  mutual_fund: "bg-info/15 text-info",
  bond: "bg-pos/15 text-pos",
  fixed_deposit: "bg-warn/15 text-warn",
  crypto: "bg-neg/15 text-neg",
  other: "bg-ink3/15 text-ink3"
};

export default function InvestmentsPage() {
  const { user } = useAuth();
  const currency = user?.currency ?? "USD";
  const locale = user?.locale ?? "en-US";

  const portfolioRes = useResource<PortfolioSummary>("/investments/portfolio");
  const investmentsRes = useResource<{ items: Investment[] }>("/investments");
  const accountsRes = useResource<{ items: Account[] }>("/accounts");

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    investment_type: "stock" as Investment["investment_type"],
    symbol: "",
    units: "",
    buy_price: "",
    current_price: "",
    buy_date: "",
    account_id: ""
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accounts = accountsRes.data?.items.filter((a) => !a.archived) ?? [];
  const investments = investmentsRes.data?.items ?? [];
  const portfolio = portfolioRes.data;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await post("/investments", {
        name: form.name,
        investment_type: form.investment_type,
        symbol: form.symbol || undefined,
        units: parseFloat(form.units),
        buy_price: parseFloat(form.buy_price),
        current_price: parseFloat(form.current_price),
        buy_date: form.buy_date,
        account_id: form.account_id ? parseInt(form.account_id) : undefined
      });
      setFormOpen(false);
      setForm({ name: "", investment_type: "stock", symbol: "", units: "", buy_price: "", current_price: "", buy_date: "", account_id: "" });
      investmentsRes.reload();
      portfolioRes.reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add investment");
    } finally {
      setSaving(false);
    }
  }

  if (portfolioRes.error) return <ErrorState message={portfolioRes.error} onRetry={portfolioRes.reload} />;

  return (
    <div>
      <PageHeader
        title="Investments"
        subtitle="Track your investment portfolio."
        actions={
          <Button onClick={() => setFormOpen(!formOpen)}>
            <Icon name="plus" className="size-4" /> Add Investment
          </Button>
        }
      />

      <div className="space-y-8">
        <section aria-label="Portfolio summary">
          {portfolioRes.loading || !portfolio ? (
            <div className="grid gap-6 sm:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))}
            </div>
          ) : (
            <>
              <dl className="grid gap-6 sm:grid-cols-4">
                <div className="rounded-2xl border border-line bg-surface p-5">
                  <dt className="text-sm font-medium text-ink2">Total Invested</dt>
                  <dd className="tnum mt-1.5 text-xl font-semibold">{formatMoney(portfolio.total_invested, currency, locale)}</dd>
                </div>
                <div className="rounded-2xl border border-line bg-surface p-5">
                  <dt className="text-sm font-medium text-ink2">Current Value</dt>
                  <dd className="tnum mt-1.5 text-xl font-semibold">{formatMoney(portfolio.current_value, currency, locale)}</dd>
                </div>
                <div className="rounded-2xl border border-line bg-surface p-5">
                  <dt className="text-sm font-medium text-ink2">P&L</dt>
                  <dd className={`tnum mt-1.5 text-xl font-semibold ${portfolio.profit_loss >= 0 ? "text-pos" : "text-neg"}`}>
                    {portfolio.profit_loss >= 0 ? "+" : ""}{formatMoney(portfolio.profit_loss, currency, locale)}
                  </dd>
                </div>
                <div className="rounded-2xl border border-line bg-surface p-5">
                  <dt className="text-sm font-medium text-ink2">ROI</dt>
                  <dd className={`tnum mt-1.5 text-xl font-semibold ${portfolio.roi_pct >= 0 ? "text-pos" : "text-neg"}`}>
                    {portfolio.roi_pct >= 0 ? "+" : ""}{portfolio.roi_pct.toFixed(2)}%
                  </dd>
                </div>
              </dl>

              {portfolio.allocation.length > 0 && (
                <div className="mt-6 rounded-2xl border border-line bg-surface p-5">
                  <h3 className="mb-4 text-sm font-medium text-ink2">Allocation by Type</h3>
                  <div className="space-y-3">
                    {portfolio.allocation.map((a) => (
                      <div key={a.investment_type} className="flex items-center gap-3">
                        <span className="w-28 shrink-0 text-sm text-ink2">{TYPE_LABELS[a.investment_type] ?? a.investment_type}</span>
                        <div className="flex-1">
                          <ProgressBar
                            pct={a.pct}
                            height="h-2"
                            className="bg-sunken"
                          />
                        </div>
                        <span className="tnum w-16 shrink-0 text-right text-sm font-medium">{a.pct.toFixed(1)}%</span>
                        <span className="tnum w-24 shrink-0 text-right text-sm text-ink3">{formatMoney(a.current_value, currency, locale)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {formOpen && (
          <section className="rounded-2xl border border-line bg-surface p-5" aria-label="Add investment">
            <h2 className="mb-4 font-display text-lg font-semibold tracking-tight">New Investment</h2>
            {error && <p className="mb-3 text-sm text-neg">{error}</p>}
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Investment name"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="h-10 rounded-md border border-line bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
              />
              <select
                value={form.investment_type}
                onChange={(e) => setForm((f) => ({ ...f, investment_type: e.target.value as Investment["investment_type"] }))}
                className="h-10 rounded-md border border-line bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
              >
                {INVESTMENT_TYPES.map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Symbol (e.g. AAPL)"
                value={form.symbol}
                onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))}
                className="h-10 rounded-md border border-line bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
              />
              <input
                type="number"
                placeholder="Units"
                required
                step="0.0001"
                min="0"
                value={form.units}
                onChange={(e) => setForm((f) => ({ ...f, units: e.target.value }))}
                className="h-10 rounded-md border border-line bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
              />
              <input
                type="number"
                placeholder="Buy price"
                required
                step="0.01"
                min="0"
                value={form.buy_price}
                onChange={(e) => setForm((f) => ({ ...f, buy_price: e.target.value }))}
                className="h-10 rounded-md border border-line bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
              />
              <input
                type="number"
                placeholder="Current price"
                required
                step="0.01"
                min="0"
                value={form.current_price}
                onChange={(e) => setForm((f) => ({ ...f, current_price: e.target.value }))}
                className="h-10 rounded-md border border-line bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
              />
              <input
                type="date"
                required
                value={form.buy_date}
                onChange={(e) => setForm((f) => ({ ...f, buy_date: e.target.value }))}
                className="h-10 rounded-md border border-line bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
              />
              <select
                value={form.account_id}
                onChange={(e) => setForm((f) => ({ ...f, account_id: e.target.value }))}
                className="h-10 rounded-md border border-line bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
              >
                <option value="">Select account</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Add Investment"}</Button>
                <Button variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
              </div>
            </form>
          </section>
        )}

        <section aria-label="Investments list">
          {investmentsRes.loading ? (
            <SkeletonRows rows={4} />
          ) : investments.length === 0 ? (
            <EmptyState
              icon={<Icon name="target" className="size-7" />}
              title="No investments yet"
              body="Add your first investment to start tracking your portfolio."
            />
          ) : (
            <ul className="divide-y divide-line">
              {investments.map((inv) => {
                const pnl = (inv.current_price - inv.buy_price) * inv.units;
                const pnlPct = inv.buy_price > 0 ? ((inv.current_price - inv.buy_price) / inv.buy_price) * 100 : 0;
                return (
                  <li key={inv.id} className="flex items-center gap-4 py-4">
                    <div className={`grid size-9 shrink-0 place-items-center rounded-lg ${TYPE_COLORS[inv.investment_type]}`}>
                      <span className="text-[10px] font-bold uppercase">{TYPE_LABELS[inv.investment_type]?.slice(0, 2)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium">
                        {inv.name}
                        {inv.symbol && <span className="ml-1.5 text-xs text-ink3">{inv.symbol}</span>}
                      </p>
                      <p className="text-xs text-ink3">
                        {inv.units} units · Bought at {formatMoney(inv.buy_price, currency, locale)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="tnum text-[15px] font-semibold">{formatMoney(inv.current_price, currency, locale)}</p>
                      <p className={`tnum text-xs font-medium ${pnl >= 0 ? "text-pos" : "text-neg"}`}>
                        {pnl >= 0 ? "+" : ""}{formatMoney(pnl, currency, locale)} ({pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%)
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
