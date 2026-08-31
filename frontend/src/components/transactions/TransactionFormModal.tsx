"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Icon } from "../icons";
import { Modal } from "../ui/Modal";
import { Segmented } from "../ui/Controls";
import { Select } from "../ui/Input";
import { formatMoney } from "../../lib/format";
import { post, put } from "../../lib/api";
import { ApiError } from "../../lib/api";
import { todayISO } from "../../lib/format";
import type { Account, Category, Transaction, TxnType } from "../../types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (message: string) => void;
  accounts: Account[];
  categories: Category[];
  currency: string;
  locale?: string;
  editing?: Transaction | null;
}

export function TransactionFormModal({
  open,
  onClose,
  onSaved,
  accounts,
  categories,
  currency,
  locale = "en-US",
  editing
}: Props) {
  const [type, setType] = useState<TxnType>("expense");
  const [amountText, setAmountText] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [accountId, setAccountId] = useState<number>(accounts[0]?.id ?? 0);
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setType(editing.type);
      setAmountText(String(editing.amount));
      setCategoryId(editing.category_id);
      setAccountId(editing.account_id);
      setDate(editing.occurred_at.slice(0, 10));
      setNote(editing.note ?? "");
    } else {
      setType("expense");
      setAmountText("");
      setCategoryId(null);
      setAccountId(accounts[0]?.id ?? 0);
      setDate(todayISO());
      setNote("");
    }
    setError(null);
    const t = window.setTimeout(() => amountRef.current?.focus(), 80);
    return () => window.clearTimeout(t);
  }, [open, editing]);

  const relevantCategories = useMemo(
    () => categories.filter((c) => c.kind === type),
    [categories, type]
  );

  useEffect(() => {
    if (categoryId !== null && !relevantCategories.some((c) => c.id === categoryId)) {
      setCategoryId(null);
    }
  }, [relevantCategories, categoryId]);

  const amount = Number.parseFloat(amountText.replace(/,/g, ""));

  const submit = async () => {
    if (!amountText || Number.isNaN(amount) || amount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (accounts.length === 0) {
      setError("Create an account first — it keeps your balances honest.");
      return;
    }
    setBusy(true);
    setError(null);
    const payload = {
      amount,
      type,
      account_id: accountId,
      category_id: categoryId,
      occurred_at: date || todayISO(),
      note: note.trim() || null
    };
    try {
      if (editing) {
        await put(`/transactions/${editing.id}`, payload);
        onSaved("Transaction updated");
      } else {
        await post("/transactions", payload);
        onSaved(`${type === "expense" ? "Spent" : "Received"} ${formatMoney(amount, currency, locale)} recorded`);
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save the transaction.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit Transaction" : undefined} >
      <div className="px-5 pb-6 pt-5 sm:px-6">
        {!editing ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold tracking-tight">Add Transaction</h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="grid size-8 place-items-center rounded-md text-ink3 transition-colors hover:bg-sunken hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
              >
                <Icon name="close" className="size-[18px]" />
              </button>
            </div>
            <Segmented
              ariaLabel="Transaction type"
              value={type}
              onChange={(v) => setType(v)}
              options={[
                { value: "expense", label: "Expense" },
                { value: "income", label: "Income" }
              ]}
            />
          </>
        ) : (
          <Segmented
            ariaLabel="Transaction type"
            value={type}
            onChange={(v) => setType(v)}
            options={[
              { value: "expense", label: "Expense" },
              { value: "income", label: "Income" }
            ]}
          />
        )}

        <div className="mt-5 flex items-baseline justify-center gap-2 border-b border-line pb-5">
          <span className={`font-display text-3xl font-medium ${type === "income" ? "text-pos" : "text-ink3"}`}>
            {type === "income" ? "+" : "−"}
          </span>
          <input
            ref={amountRef}
            inputMode="decimal"
            placeholder="0" autoComplete="off" spellCheck={false}
            value={amountText}
            onChange={(e) => {
              const v = e.target.value.replace(/[^\d.,]/g, "");
              setAmountText(v);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit();
            }}
            aria-label="Amount"
            className={`tnum w-full max-w-[220px] rounded-md bg-transparent text-right font-display text-[44px] font-semibold tracking-tight outline-none placeholder:text-line focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand/40 ${
              type === "income" ? "text-pos" : "text-ink"
            }`}
          />
          <span className="text-lg font-medium text-ink3">{currency}</span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {relevantCategories.map((cat) => {
            const active = categoryId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoryId(active ? null : cat.id)}
                aria-pressed={active}
                className={`flex items-center gap-2 rounded-md border px-3 py-2.5 text-left text-[13px] font-medium transition-[background-color,border-color,color,box-shadow] duration-100 ${
                  active ? "border-transparent text-white shadow-lift" : "border-line bg-surface text-ink2 hover:border-ink3/40 hover:text-ink"
                }`}
                style={active ? { backgroundColor: cat.color } : undefined}
              >
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: active ? "rgba(255,255,255,.85)" : cat.color }}
                />
                <span className="truncate">{cat.name}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <Select label="Account" value={accountId} onChange={(e) => setAccountId(Number(e.target.value))}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
          <div>
            <label htmlFor="txn-date" className="mb-1.5 block text-[13px] font-medium text-ink2">
              Date
            </label>
            <input
              id="txn-date"
              type="date"
              autoComplete="off"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-10 w-full rounded-md border border-line bg-surface px-3 text-[15px] focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
            />
          </div>
        </div>

        <div className="mt-4">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit();
            }}
            placeholder="Note — e.g. Dinner with family…"
            aria-label="Note"
            autoComplete="off"
            className="h-10 w-full rounded-md border border-line bg-surface px-3 text-[15px] placeholder:text-ink3 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
          />
        </div>

        {error ? (
          <p role="alert" className="mt-4 rounded-md bg-negtint px-3.5 py-2.5 text-sm text-neg animate-fade-in">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="h-11 rounded-md px-4 text-[15px] font-medium text-ink2 transition-colors hover:bg-sunken hover:text-ink"
          >
            Cancel
          </button>
          <button
            onClick={() => void submit()}
            disabled={busy}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-brand px-5 text-[15px] font-medium text-white transition-[background-color,transform] hover:bg-brand-strong active:scale-[.98] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {busy ? (
              "Saving…"
            ) : (
              <>
                {editing ? "Save Changes" : "Save"}
                {!editing ? <Icon name="check" className="size-4" /> : null}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
