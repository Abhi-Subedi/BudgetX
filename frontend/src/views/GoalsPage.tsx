"use client";

import { useState } from "react";

import { PageHeader } from "../components/layout/AppShell";
import { Button } from "../components/ui/Button";
import { ProgressBar } from "../components/ui/Controls";
import { Field } from "../components/ui/Input";
import { ConfirmDialog, Modal } from "../components/ui/Modal";
import { EmptyState, ErrorState, SkeletonRows } from "../components/ui/States";
import { Icon } from "../components/icons";
import { useResource } from "../hooks/useResource";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { del, post, ApiError } from "../lib/api";
import { deadlineLabel, formatMoney } from "../lib/format";
import type { Goal } from "../types";

export default function GoalsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const currency = user?.currency ?? "USD";
  const locale = user?.locale ?? "en-US";
  const goalsRes = useResource<{ items: Goal[] }>("/goals");

  const [createOpen, setCreateOpen] = useState(false);
  const [contributing, setContributing] = useState<Goal | null>(null);
  const [deleting, setDeleting] = useState<Goal | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await del(`/goals/${deleting.id}`);
      toast("Goal deleted");
      goalsRes.reload();
    } catch {
      toast("Could not delete the goal.", "error");
    } finally {
      setDeleteBusy(false);
      setDeleting(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Goals"
        subtitle="Money with a destination."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Icon name="plus" className="size-4" /> New Goal
          </Button>
        }
      />

      {goalsRes.error ? (
        <ErrorState message={goalsRes.error} onRetry={goalsRes.reload} />
      ) : goalsRes.loading ? (
        <SkeletonRows rows={4} />
      ) : !goalsRes.data || goalsRes.data.items.length === 0 ? (
        <EmptyState
          icon={<Icon name="flag" className="size-8" />}
          title="No goals yet"
          body="An emergency fund, a new laptop, a trip you keep postponing — give it a target and watch it fill."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Icon name="plus" className="size-4" /> Create a Goal
            </Button>
          }
        />
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {goalsRes.data.items.map((goal) => {
            const pct = goal.target_amount > 0 ? Math.min(100, (goal.current_amount / goal.target_amount) * 100) : 0;
            const remaining = Math.max(goal.target_amount - goal.current_amount, 0);
            return (
              <li key={goal.id} className="group py-5">
                <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: goal.color }} />
                      <h2 className="truncate font-display text-lg font-semibold tracking-tight">{goal.name}</h2>
                      {pct >= 100 ? <span className="text-[11px] font-bold uppercase tracking-wider text-pos">Funded</span> : null}
                    </div>
                    <p className="tnum mt-1 text-sm text-ink2">
                      {formatMoney(goal.current_amount, currency, locale)} of {formatMoney(goal.target_amount, currency, locale)}
                      {" · "}
                      {Math.round(pct)}%
                      {remaining > 0 && pct > 0 ? ` · ${formatMoney(remaining, currency, locale)} to go` : ""}
                      {goal.deadline ? ` · ${deadlineLabel(goal.deadline)}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
                    <Button size="sm" variant="secondary" onClick={() => setContributing(goal)}>
                      Contribute
                    </Button>
                    <button
                      onClick={() => setDeleting(goal)}
                      aria-label={`Delete ${goal.name}`}
                      className="grid size-8 place-items-center rounded-md text-ink3 transition-colors hover:bg-negtint hover:text-neg focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
                    >
                      <Icon name="trash" className="size-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 max-w-xl">
                  <ProgressBar pct={pct} tone="brand" height="h-2" delay={80} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <GoalFormModal open={createOpen} onClose={() => setCreateOpen(false)} onSaved={(m) => { toast(m); goalsRes.reload(); }} />

      <ContributeModal goal={contributing} onClose={() => setContributing(null)} onSaved={(m) => { toast(m); goalsRes.reload(); }} />

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => void confirmDelete()}
        busy={deleteBusy}
        title="Delete Goal?"
        body={`“${deleting?.name ?? ""}” and its progress will be removed. This can’t be undone.`}
      />
    </div>
  );
}

function GoalFormModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: (msg: string) => void }) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const submit = async () => {
    const value = Number.parseFloat(target);
    if (!name.trim()) return setError("Give your goal a name.");
    if (!value || value <= 0) return setError("Set a target amount greater than zero.");
    setBusy(true);
    try {
      await post("/goals", {
        name: name.trim(),
        target_amount: value,
        deadline: deadline || null,
        color: "#10B981"
      });
      onSaved(`Goal “${name.trim()}” created`);
      setName("");
      setTarget("");
      setDeadline("");
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create the goal.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New Goal">
      <div className="space-y-4 px-5 pb-6 pt-5 sm:px-6">
        <Field label="Name" placeholder="Emergency fund" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <Field label="Target amount" inputMode="decimal" placeholder="50000" value={target} onChange={(e) => setTarget(e.target.value.replace(/[^\d.]/g, ""))} />
        <Field label="Deadline (optional)" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        {error ? (
          <p role="alert" className="rounded-md bg-negtint px-3.5 py-2.5 text-sm text-neg animate-fade-in">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2.5 pt-1">
          <button onClick={onClose} className="h-10 rounded-md px-4 text-sm font-medium text-ink2 transition-colors hover:bg-sunken hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand">
            Cancel
          </button>
          <Button onClick={() => void submit()} disabled={busy}>
            {busy ? "Creating…" : "Create Goal"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ContributeModal({ goal, onClose, onSaved }: { goal: Goal | null; onClose: () => void; onSaved: (msg: string) => void }) {
  const [amountText, setAmountText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!goal) return null;

  const submit = async () => {
    const value = Number.parseFloat(amountText);
    if (!value || value <= 0) return setError("Enter an amount greater than zero.");
    setBusy(true);
    try {
      await post(`/goals/${goal.id}/contributions`, { amount: value });
      onSaved(`${formatMoney(value)} added to ${goal.name}`);
      setAmountText("");
      setError(null);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add the contribution.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`Add to ${goal.name}`}>
      <div className="px-5 pb-6 pt-5 sm:px-6">
        <input
          autoFocus
          inputMode="decimal"
          placeholder="0"
          value={amountText}
          onChange={(e) => setAmountText(e.target.value.replace(/[^\d.]/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && void submit()}
          aria-label="Contribution amount"
          className="tnum w-full border-b border-line bg-transparent pb-3 text-center font-display text-4xl font-semibold tracking-tight outline-none placeholder:text-line focus:border-brand"
        />
        {error ? (
          <p role="alert" className="mt-4 rounded-md bg-negtint px-3.5 py-2.5 text-sm text-neg animate-fade-in">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex justify-end gap-2.5">
          <button onClick={onClose} className="h-10 rounded-md px-4 text-sm font-medium text-ink2 transition-colors hover:bg-sunken hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand">
            Cancel
          </button>
          <Button onClick={() => void submit()} disabled={busy}>
            {busy ? "Adding…" : "Add Contribution"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
