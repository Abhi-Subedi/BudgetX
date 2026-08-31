"use client";

import { useMemo, useState } from "react";

import { PageHeader } from "../components/layout/AppShell";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Controls";
import {
  EmptyState,
  ErrorState,
  Skeleton,
  SkeletonRows,
} from "../components/ui/States";
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

  const startDate = useMemo(() => {
    const now = new Date();

    const year = now.getFullYear();

    const month = String(now.getMonth() + 1).padStart(2, "0");

    return `${year}-${month}-01`;
  }, []);

  const summaryRes = useResource<SubscriptionSummary>(
    `/subscriptions/summary?start_date=${startDate}`,
  );

  const subsRes = useResource<{ items: Subscription[] }>("/subscriptions");

  const accountsRes = useResource<{ items: Account[] }>("/accounts");

  const [formOpen, setFormOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    amount: "",
    frequency: "monthly",
    category: "",
    start_date: "",
    next_billing_date: "",
    account_id: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accounts = accountsRes.data?.items.filter((a) => !a.archived) ?? [];

  const subs = subsRes.data?.items ?? [];

  /*

* Prevent null errors while the API request is loading.
  */
  const summary = summaryRes.data;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);
    setError(null);

    try {
      await post("/subscriptions", {
        name: form.name.trim(),
        amount: parseFloat(form.amount),
        frequency: form.frequency,
        category: form.category.trim() || undefined,
        start_date: form.start_date,
        next_billing_date: form.next_billing_date,
        account_id: form.account_id ? parseInt(form.account_id, 10) : undefined,
      });

      setFormOpen(false);

      setForm({
        name: "",
        amount: "",
        frequency: "monthly",
        category: "",
        start_date: "",
        next_billing_date: "",
        account_id: "",
      });

      subsRes.reload();
      summaryRes.reload();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to create subscription",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: number) {
    try {
      await post(`/subscriptions/${id}/toggle`);

      subsRes.reload();
      summaryRes.reload();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to update subscription",
      );
    }
  }

  async function handleCancel(id: number) {
    try {
      await post(`/subscriptions/${id}/cancel`);

      subsRes.reload();
      summaryRes.reload();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to cancel subscription",
      );
    }
  }

  return (
    <div>
      <PageHeader
        title="Subscriptions"
        subtitle="Manage your recurring subscriptions."
        actions={
          <Button onClick={() => setFormOpen(!formOpen)}>
            {" "}
            <Icon name="plus" className="size-4" />
            Add Subscription{" "}
          </Button>
        }
      />
      <div className="space-y-8">
        {/* SUMMARY */}
        <section aria-label="Summary">
          {summaryRes.loading ? (
            <div className="grid gap-6 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))}
            </div>
          ) : summaryRes.error ? (
            <ErrorState
              message={summaryRes.error}
              onRetry={summaryRes.reload}
            />
          ) : !summary ? (
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="rounded-2xl border border-line bg-surface p-5">
                <dt className="text-sm font-medium text-ink2">Monthly Cost</dt>
                <dd className="tnum mt-1.5 text-xl font-semibold">
                  {formatMoney(0, currency, locale)}
                </dd>
              </div>

              <div className="rounded-2xl border border-line bg-surface p-5">
                <dt className="text-sm font-medium text-ink2">Annual Cost</dt>
                <dd className="tnum mt-1.5 text-xl font-semibold">
                  {formatMoney(0, currency, locale)}
                </dd>
              </div>

              <div className="rounded-2xl border border-line bg-surface p-5">
                <dt className="text-sm font-medium text-ink2">Active</dt>
                <dd className="tnum mt-1.5 text-xl font-semibold">0</dd>
              </div>
            </div>
          ) : (
            <dl className="grid gap-6 sm:grid-cols-3">
              <div className="rounded-2xl border border-line bg-surface p-5">
                <dt className="text-sm font-medium text-ink2">Monthly Cost</dt>

                <dd className="tnum mt-1.5 text-xl font-semibold">
                  {formatMoney(summary.monthly_cost ?? 0, currency, locale)}
                </dd>
              </div>

              <div className="rounded-2xl border border-line bg-surface p-5">
                <dt className="text-sm font-medium text-ink2">Annual Cost</dt>

                <dd className="tnum mt-1.5 text-xl font-semibold">
                  {formatMoney(summary.annual_cost ?? 0, currency, locale)}
                </dd>
              </div>

              <div className="rounded-2xl border border-line bg-surface p-5">
                <dt className="text-sm font-medium text-ink2">Active</dt>

                <dd className="tnum mt-1.5 text-xl font-semibold">
                  {summary.active_count ?? 0}
                </dd>
              </div>
            </dl>
          )}
        </section>

        {/* ERROR */}
        {error && (
          <p
            role="alert"
            className="rounded-md bg-negtint px-3.5 py-2.5 text-sm text-neg"
          >
            {error}
          </p>
        )}

        {/* CREATE FORM */}
        {formOpen && (
          <section
            className="rounded-2xl border border-line bg-surface p-5"
            aria-label="Create subscription"
          >
            <h2 className="mb-4 font-display text-lg font-semibold tracking-tight">
              New Subscription
            </h2>

            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              {/* Subscription Name */}
              <div>
                <label
                  htmlFor="sub-name"
                  className="mb-1.5 block text-xs font-medium text-ink2"
                >
                  Subscription Name <span className="text-neg">*</span>
                </label>
                <input
                  id="sub-name"
                  type="text"
                  placeholder="e.g. Netflix, Spotify"
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      name: e.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-md border border-line bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
                />
              </div>

              {/* Amount */}
              <div>
                <label
                  htmlFor="sub-amount"
                  className="mb-1.5 block text-xs font-medium text-ink2"
                >
                  Amount <span className="text-neg">*</span>
                </label>
                <input
                  id="sub-amount"
                  type="number"
                  placeholder="0.00"
                  required
                  step="0.01"
                  min="0"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      amount: e.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-md border border-line bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
                />
              </div>

              {/* Frequency */}
              <div>
                <label
                  htmlFor="sub-frequency"
                  className="mb-1.5 block text-xs font-medium text-ink2"
                >
                  Billing Frequency
                </label>
                <select
                  id="sub-frequency"
                  value={form.frequency}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      frequency: e.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-md border border-line bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="sub-category"
                  className="mb-1.5 block text-xs font-medium text-ink2"
                >
                  Category
                </label>
                <input
                  id="sub-category"
                  type="text"
                  placeholder="e.g. Entertainment, Software"
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      category: e.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-md border border-line bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
                />
              </div>

              {/* Start Date */}
              <div>
                <label
                  htmlFor="sub-start-date"
                  className="mb-1.5 block text-xs font-medium text-ink2"
                >
                  Start Date <span className="text-neg">*</span>
                </label>
                <input
                  id="sub-start-date"
                  type="date"
                  required
                  value={form.start_date}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      start_date: e.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-md border border-line bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
                />
              </div>

              {/* Next Billing Date */}
              <div>
                <label
                  htmlFor="sub-next-billing"
                  className="mb-1.5 block text-xs font-medium text-ink2"
                >
                  Next Billing Date <span className="text-neg">*</span>
                </label>
                <input
                  id="sub-next-billing"
                  type="date"
                  required
                  value={form.next_billing_date}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      next_billing_date: e.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-md border border-line bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
                />
              </div>

              {/* Account */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="sub-account"
                  className="mb-1.5 block text-xs font-medium text-ink2"
                >
                  Payment Account
                </label>
                <select
                  id="sub-account"
                  value={form.account_id}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      account_id: e.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-md border border-line bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
                >
                  <option value="">Select account…</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.type ? a.type.toUpperCase() : "ACCOUNT"}) —{" "}
                      {a.currency}
                    </option>
                  ))}
                </select>
              </div>

              {/* Form Buttons */}
              <div className="flex gap-2 pt-2 sm:col-span-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Create"}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setFormOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </section>
        )}

        {/* SUBSCRIPTIONS LIST */}
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
                    <p className="truncate text-[15px] font-medium">
                      {sub.name}
                    </p>

                    <p className="text-xs text-ink3">
                      {sub.category && <span>{sub.category} · </span>}
                      {sub.frequency} · Next:{" "}
                      {formatDate(sub.next_billing_date)}
                    </p>
                  </div>

                  <span className="tnum text-[15px] font-semibold">
                    {formatMoney(sub.amount, currency, locale)}
                  </span>

                  <Badge tone={sub.active ? "pos" : "neutral"}>
                    {sub.active ? "Active" : "Paused"}
                  </Badge>

                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggle(sub.id)}
                    >
                      {sub.active ? "Pause" : "Resume"}
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-neg"
                      onClick={() => handleCancel(sub.id)}
                    >
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
