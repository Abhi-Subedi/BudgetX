"use client";

import { useEffect, useMemo, useState } from "react";

import { PageHeader } from "../components/layout/AppShell";
import { Button } from "../components/ui/Button";
import { Badge, ProgressBar } from "../components/ui/Controls";
import { Field } from "../components/ui/Input";
import { ConfirmDialog, Modal } from "../components/ui/Modal";
import { EmptyState, ErrorState, Skeleton } from "../components/ui/States";
import { Icon } from "../components/icons";
import { useResource } from "../hooks/useResource";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { del, post, put, ApiError } from "../lib/api";
import { formatMoney, monthKeyOf, monthLabel } from "../lib/format";
import type { BudgetProgress, Category } from "../types";

export default function BudgetsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const currency = user?.currency ?? "USD";
  const locale = user?.locale ?? "en-US";
  const budgetsRes = useResource<{ items: BudgetProgress[] }>("/budgets");
  const categoriesRes = useResource<{ items: Category[] }>("/categories?kind=expense");

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<BudgetProgress | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const expenseCategories = categoriesRes.data?.items ?? [];

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await del(`/budgets/${deleting.id}`);
      toast("Budget deleted");
      budgetsRes.reload();
    } catch {
      toast("Could not delete the budget.", "error");
    } finally {
      setDeleteBusy(false);
      setDeleting(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Budgets"
        subtitle="Plan the month before it spends itself."
        actions={
          <Button
            onClick={() => {
              setEditingId(null);
              setFormOpen(true);
            }}
          >
            <Icon name="plus" className="size-4" /> New Budget
          </Button>
        }
      />

      {budgetsRes.error ? (
        <ErrorState message={budgetsRes.error} onRetry={budgetsRes.reload} />
      ) : budgetsRes.loading ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      ) : !budgetsRes.data || budgetsRes.data.items.length === 0 ? (
        <EmptyState
          icon={<Icon name="target" className="size-8" />}
          title="No budgets yet"
          body="Give every category a job at the start of the month — BudgetX keeps score for you."
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Icon name="plus" className="size-4" /> Create Your First Budget
            </Button>
          }
        />
      ) : (
        <div className="space-y-12">
          {budgetsRes.data.items.map((budget) => {
            const overallPct = budget.total_budget > 0 ? (budget.total_spent / budget.total_budget) * 100 : 0;
            return (
              <section key={budget.id} aria-label={`${budget.name} ${monthLabel(budget.month.slice(0, 7), true)}`}>
                <header className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
                  <div>
                    <h2 className="font-display text-xl font-semibold tracking-tight">
                      {monthLabel(budget.month.slice(0, 7), true)}
                    </h2>
                    <p className="mt-1 text-sm text-ink2">
                      <span className="tnum font-semibold text-ink">
                        {formatMoney(budget.total_spent, currency, locale)}
                      </span>{" "}
                      of {formatMoney(budget.total_budget, currency, locale)}
                      {" · "}
                      {formatMoney(Math.max(budget.total_budget - budget.total_spent, 0), currency, locale)} left
                      {budget.days_left > 0 ? ` · ${budget.days_left} days to go` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {overallPct >= 100 ? <Badge tone="neg">Over</Badge> : overallPct >= 75 ? <Badge tone="warn">Watch</Badge> : <Badge tone="pos">On track</Badge>}
                    <button
                      onClick={() => {
                        setEditingId(budget.id);
                        setFormOpen(true);
                      }}
                      className="grid size-8 place-items-center rounded-md text-ink3 transition-colors hover:bg-sunken hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
                      aria-label="Edit Budget"
                    >
                      <Icon name="pencil" className="size-4" />
                    </button>
                    <button
                      onClick={() => setDeleting(budget)}
                      className="grid size-8 place-items-center rounded-md text-ink3 transition-colors hover:bg-negtint hover:text-neg focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
                      aria-label="Delete budget"
                    >
                      <Icon name="trash" className="size-4" />
                    </button>
                  </div>
                </header>

                <ProgressBar pct={overallPct} height="h-2" />

                <ul className="mt-6 grid gap-x-10 gap-y-5 md:grid-cols-2">
                  {budget.items.map((item) => (
                    <li key={item.item_id}>
                      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[15px]">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: item.category_color }} />
                          <span className="truncate font-medium">{item.category_name}</span>
                        </span>
                        <span className="tnum shrink-0 text-sm text-ink2">
                          <span className={`font-semibold ${item.remaining < 0 ? "text-neg" : "text-ink"}`}>
                            {formatMoney(item.spent, currency, locale)}
                          </span>{" "}
                          / {formatMoney(item.budgeted, currency, locale)}
                        </span>
                      </div>
                      <ProgressBar pct={item.pct_used} delay={100} />
                      <p className="mt-1 text-xs text-ink3">
                        {item.pct_used}% used
                        {item.remaining < 0
                          ? ` · over by ${formatMoney(-item.remaining, currency, locale)}`
                          : ` · ${formatMoney(item.remaining, currency, locale)} remaining`}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      <BudgetFormModal
        open={formOpen}
        editingId={editingId}
        budgets={budgetsRes.data?.items ?? []}
        categories={expenseCategories}
        currency={currency}
        onClose={() => setFormOpen(false)}
        onSaved={(msg) => {
          toast(msg);
          budgetsRes.reload();
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => void confirmDelete()}
        busy={deleteBusy}
        title="Delete Budget?"
        body={`This deletes your ${deleting ? monthLabel(deleting.month.slice(0, 7), true) : ""} plan. Your transactions are untouched.`}
      />
    </div>
  );
}

function BudgetFormModal({
  open,
  editingId,
  budgets,
  categories,
  currency,
  onClose,
  onSaved
}: {
  open: boolean;
  editingId: number | null;
  budgets: BudgetProgress[];
  categories: Category[];
  currency: string;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const editing = useMemo(() => budgets.find((b) => b.id === editingId) ?? null, [budgets, editingId]);
  const [monthKey, setMonthKey] = useState(monthKeyOf());
  const [amounts, setAmounts] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open && Object.keys(amounts).length === 0) {
      if (editing) {
        const initial: Record<number, string> = {};
        for (const item of editing.items) initial[item.category_id] = String(item.budgeted);
        setAmounts(initial);
        setMonthKey(editing.month.slice(0, 7));
      } else {
        setAmounts({});
        setMonthKey(monthKeyOf());
      }
    }
  }, [open]);

  if (!open) return null;

  const submit = async () => {
    const items = Object.entries(amounts)
      .map(([cid, value]) => ({ category_id: Number(cid), amount: Number.parseFloat(value) }))
      .filter((i) => !Number.isNaN(i.amount) && i.amount > 0);
    if (items.length === 0) {
      setError("Set an amount for at least one category.");
      return;
    }
    setBusy(true);
    try {
      if (editing) {
        await put(`/budgets/${editing.id}`, { items });
        onSaved("Budget updated");
      } else {
        await post("/budgets", { month: `${monthKey}-01`, items });
        onSaved("Budget created");
      }
      setAmounts({});
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save this budget.");
    } finally {
      setBusy(false);
    }
  };

  const totalPlanned = Object.values(amounts).reduce((s, v) => s + (Number.parseFloat(v) || 0), 0);

  return (
    <Modal open={open} onClose={onClose} wide title={editing ? "Edit Budget" : `Budget for ${monthLabel(monthKey, true)}`}>
      <div className="px-5 pb-6 pt-5 sm:px-6">
        {!editing ? (
          <div className="mb-4">
            <Field label="Month" type="month" value={monthKey} onChange={(e) => setMonthKey(e.target.value)} className="max-w-44" />
          </div>
        ) : null}

        <div className="max-h-[46dvh] space-y-2 overflow-y-auto pr-1">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-3">
              <span className="flex min-w-0 flex-1 items-center gap-2.5 text-[14px] font-medium">
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="truncate">{cat.name}</span>
              </span>
              <div className="relative w-32">
                <input
                  inputMode="decimal"
                  placeholder="—"
                  value={amounts[cat.id] ?? ""}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^\d.]/g, "");
                    setAmounts((a) => ({ ...a, [cat.id]: v }));
                    setError(null);
                  }}
                  aria-label={`${cat.name} budget`}
                  className="tnum h-9 w-full rounded-md border border-line bg-surface px-3 pr-8 text-right text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
                />
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-ink3">{currency}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-between border-t border-line pt-3 text-sm">
          <span className="text-ink2">Total planned</span>
          <span className="tnum font-semibold">{formatMoney(totalPlanned, currency)}</span>
        </div>

        {error ? (
          <p role="alert" className="mt-3 rounded-md bg-negtint px-3.5 py-2.5 text-sm text-neg animate-fade-in">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2.5">
          <button onClick={onClose} className="h-10 rounded-md px-4 text-sm font-medium text-ink2 transition-colors hover:bg-sunken hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand">
            Cancel
          </button>
          <Button onClick={() => void submit()} disabled={busy}>
            {busy ? "Saving…" : editing ? "Save Changes" : "Create Budget"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
