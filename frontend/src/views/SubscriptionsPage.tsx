"use client";

import { useState } from "react";

import { PageHeader } from "../components/layout/AppShell";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Controls";
import { EmptyState, ErrorState, Skeleton, SkeletonRows } from "../components/ui/States";
import { Icon } from "../components/icons";
import { useResource } from "../hooks/useResource";
import { useAuth } from "../hooks/useAuth";
import { post } from "../lib/api";
import { formatMoney, formatDate } from "../lib/format";
import type { Subscription, SubscriptionSummary, Account } from "../types";

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const currency = user?.currency ?? "USD";
  const locale = user?.locale ?? "en-US";

  const summaryRes = useResource<SubscriptionSummary>("/subscriptions/summary");
  const subsRes = useResource<{ items: Subscription[] }>("/subscriptions");
  const accountsRes = useResource<{ items: Account[] }>("/accounts");

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    amount: "",
    frequency: "monthly",
    category: "",
    next_billing_date: "",
    account_id: ""
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accounts = accountsRes.data?.items.filter((a) => !a.archived) ?? [];
  const subs = subsRes.data?.items ?? [];
  const summary = summaryRes.data;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await post("/subscriptions", {
        name: form.name,
        amount: parseFloat(form.amount),
        frequency: form.frequency,
        category: form.category,
        next_billing_date: form.next_billing_date,
        account_id: form.account_id ? parseInt(form.account_id) : undefined
      });
      setFormOpen(false);
      setForm({ name: "", amount: "", frequency: "monthly", category: "", next_billing_date: "", account_id: "" });
      subsRes.reload();
      summaryRes.reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create subscription");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: number) {
    try {
      await post(`/subscriptions/${id}/toggle`);
      subsRes.reload();
      summaryRes.reload();
    } catch {
      // silent
    }
  }

  async function handleCancel(id: number) {
    try {
      await post(`/subscriptions/${id}/cancel`);
      subsRes.reload();
      summaryRes.reload();
    } catch {
      // silent
    }
  }

  if (summaryRes.error) return <ErrorState message={summaryRes.error} onRetry={summaryRes.reload} />;

  return (
    <div>
      <PageHeader
        title="Subscriptions"
        subtitle="Manage your recurring subscriptions."
        actions={
          <Button onClick={() => setFormOpen(!formOpen)}>
            <Icon name="plus" className="size-4" /> Add Subscription
          </Button>
        }
      />

      <div className="space-y-8">
        <section aria-label="Summary">
          {summaryRes.loading || !summary ? (
            <div className="grid gap-6 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))}
            </div>
          ) : (
            <dl className="grid gap-6 sm:grid-cols-3">
              <div className="rounded-2xl border border-line bg-surface p-5">
                <dt className="text-sm font-medium text-ink2">Monthly Cost</dt>
                <dd className="tnum mt-1.5 text-xl font-semibold">{formatMoney(summary.monthly_cost, currency, locale)}</dd>
              </div>
              <div className="rounded-2xl border border-line bg-surface p-5">
                <dt className="text-sm font-medium text-ink2">Annual Cost</dt>
                <dd className="tnum mt-1.5 text-xl font-semibold">{formatMoney(summary.annual_cost, currency, locale)}</dd>
              </div>
              <div className="rounded-2xl border border-line bg-surface p-5">
                <dt className="text-sm font-medium text-ink2">Active</dt>
                <dd className="tnum mt-1.5 text-xl font-semibold">{summary.active_count}</dd>
              </div>
            </dl>
          )}
        </section>

        {formOpen && (
          <section className="rounded-2xl border border-line bg-surface p-5" aria-label="Create subscription">
            <h2 className="mb-4 font-display text-lg font-semibold tracking-tight">New Subscription</h2>
            {error && <p className="mb-3 text-sm text-neg">{error}</p>}
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Subscription name"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="h-10 rounded-md border border-line bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
              />
              <input
                type="number"
                placeholder="Amount"
                required
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className="h-10 rounded-md border border-line bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
              />
              <select
                value={form.frequency}
                onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
                className="h-10 rounded-md border border-line bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
              >
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="yearly">Yearly</option>
              </select>
              <input
                type="text"
                placeholder="Category"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="h-10 rounded-md border border-line bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
              />
              <input
                type="date"
                required
                value={form.next_billing_date}
                onChange={(e) => setForm((f) => ({ ...f, next_billing_date: e.target.value }))}
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
                <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Create"}</Button>
                <Button variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
              </div>
            </form>
          </section>
        )}

        <section aria-label="Subscriptions list">
          {subsRes.loading ? (
            <SkeletonRows rows={4} />
          ) : subs.length === 0 ? (
            <EmptyState
              icon={<Icon name="repeat" className="size-7" />}
              title="No subscriptions yet"
              body="Add your first subscription to start tracking recurring costs."
            />
          ) : (
            <ul className="divide-y divide-line">
              {subs.map((sub) => (
                <li key={sub.id} className="flex items-center gap-4 py-4">
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-sunken text-ink2">
                    <Icon name="repeat" className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium">{sub.name}</p>
                    <p className="text-xs text-ink3">
                      {sub.category && <span>{sub.category} · </span>}
                      {sub.frequency} · Next: {formatDate(sub.next_billing_date)}
                    </p>
                  </div>
                  <span className="tnum text-[15px] font-semibold">{formatMoney(sub.amount, currency, locale)}</span>
                  <Badge tone={sub.active ? "pos" : "neutral"}>{sub.active ? "Active" : "Paused"}</Badge>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="ghost" onClick={() => handleToggle(sub.id)}>
                      {sub.active ? "Pause" : "Resume"}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-neg" onClick={() => handleCancel(sub.id)}>
                      Cancel
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
