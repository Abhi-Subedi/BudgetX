"use client";

import { useEffect, useState } from "react";

import { Icon } from "../icons";
import { Button } from "./Button";
import { Field, Select } from "./Input";
import { Modal } from "./Modal";
import { Badge } from "./Controls";
import { EmptyState } from "./States";
import { del, post, put, ApiError } from "../../lib/api";
import { formatMoney, formatDate, todayISO } from "../../lib/format";
import type { Account, Category, RecurringRule } from "../../types";

const FREQ_LABEL: Record<string, string> = {
  daily: "Every day",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly"
};

interface Props {
  rules: RecurringRule[];
  loading: boolean;
  accounts: Account[];
  categories: Category[];
  onChanged: () => void;
  currency: string;
  locale: string;
}

export function RecurringPanel({ rules, loading, accounts, categories, onChanged, currency }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringRule | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const removeRule = async (rule: RecurringRule) => {
    setBusyId(rule.id);
    try {
      await del(`/recurring/${rule.id}`);
      onChanged();
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <div className="py-10 text-center text-sm text-ink3">Loading…</div>;

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button
          variant="secondary"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          disabled={accounts.length === 0}
        >
          <Icon name="plus" className="size-4" /> New Rule
        </Button>
      </div>

      {rules.length === 0 ? (
        <EmptyState
          icon={<Icon name="repeat" className="size-8" />}
          title="Nothing on autopilot"
          body="Rent, salary, subscriptions — set them once and BudgetX posts them on schedule."
          action={
            accounts.length > 0 ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                Create a Rule
              </Button>
            ) : null
          }
        />
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {rules.map((rule) => (
            <li key={rule.id} className="group flex items-center gap-4 py-3.5">
              <span className={`grid size-9 shrink-0 place-items-center rounded-full ${rule.active ? "bg-brand-tint text-brand-strong" : "bg-sunken text-ink3"}`}>
                <Icon name="repeat" className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium">{rule.payee ?? "Recurring transaction"}</p>
                <p className="text-[13px] text-ink3">
                  {FREQ_LABEL[rule.frequency]} · next {formatDate(rule.next_run_date)}
                  {!rule.active ? " · paused" : ""}
                </p>
              </div>
              {rule.type === "income" ? <Badge tone="pos">in</Badge> : null}
              <span className={`tnum text-[15px] font-semibold ${rule.type === "income" ? "text-pos" : ""}`}>
                {rule.type === "income" ? "+" : "−"}
                {formatMoney(rule.amount, currency)}
              </span>
              <div className="hidden gap-1 group-hover:flex">
                <button
                  onClick={() => {
                    setEditing(rule);
                    setFormOpen(true);
                  }}
                  aria-label="Edit rule"
                  className="grid size-8 place-items-center rounded-md text-ink3 hover:bg-sunken hover:text-ink"
                >
                  <Icon name="pencil" className="size-4" />
                </button>
                <button
                  onClick={() => void removeRule(rule)}
                  disabled={busyId === rule.id}
                  aria-label="Delete rule"
                  className="grid size-8 place-items-center rounded-md text-ink3 hover:bg-negtint hover:text-neg"
                >
                  <Icon name="trash" className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <RecurringFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editing={editing}
        accounts={accounts}
        categories={categories.filter((c) => c.kind === "expense")}
        onSaved={() => {
          onChanged();
          setFormOpen(false);
        }}
      />
    </div>
  );
}

function RecurringFormModal({
  open,
  onClose,
  editing,
  accounts,
  categories,
  onSaved
}: {
  open: boolean;
  onClose: () => void;
  editing: RecurringRule | null;
  accounts: Account[];
  categories: Category[];
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [payee, setPayee] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [frequency, setFrequency] = useState<RecurringRule["frequency"]>("monthly");
  const [accountId, setAccountId] = useState<number>(0);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [nextRun, setNextRun] = useState(todayISO());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setAmount(editing ? String(editing.amount) : "");
    setPayee(editing?.payee ?? "");
    setType(editing?.type ?? "expense");
    setFrequency(editing?.frequency ?? "monthly");
    setAccountId(editing?.account_id ?? accounts[0]?.id ?? 0);
    setCategoryId(editing?.category_id ?? null);
    setNextRun(editing?.next_run_date.slice(0, 10) ?? todayISO());
    setError(null);
  };

  useEffect(() => {
    if (open && amount === "" && !editing) {
      reset();
    }
  }, [open]);

  const submit = async () => {
    const value = Number.parseFloat(amount);
    if (!value || value <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        amount: value,
        type,
        account_id: accountId || accounts[0]?.id,
        category_id: categoryId,
        frequency,
        next_run_date: nextRun,
        payee: payee.trim() || null
      };
      if (editing) await put(`/recurring/${editing.id}`, payload);
      else await post("/recurring", payload);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save this rule.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit Recurring Rule" : "New Recurring Rule"}>
      <div className="space-y-4 px-5 pb-6 pt-5 sm:px-6">
        <Field label="Name / payee" placeholder="Netflix, Salary…" value={payee} onChange={(e) => setPayee(e.target.value)} />
        <Field label="Amount" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Type" value={type} onChange={(e) => setType(e.target.value as "expense" | "income")}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </Select>
          <Select label="Frequency" value={frequency} onChange={(e) => setFrequency(e.target.value as RecurringRule["frequency"])}>
            {Object.entries(FREQ_LABEL).map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select label="Account" value={accountId} onChange={(e) => setAccountId(Number(e.target.value))}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
          <Select label="Category" value={categoryId ?? ""} onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}>
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <Field label="Next occurrence" type="date" value={nextRun} onChange={(e) => setNextRun(e.target.value)} />

        {error ? (
          <p role="alert" className="rounded-md bg-negtint px-3.5 py-2.5 text-sm text-neg">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2.5 pt-1">
          <button onClick={onClose} className="h-10 rounded-md px-4 text-sm font-medium text-ink2 transition-colors hover:bg-sunken hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand">
            Cancel
          </button>
          <Button onClick={() => void submit()} disabled={busy}>
            {busy ? "Saving…" : "Save Rule"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
