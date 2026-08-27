"use client";

import { useState } from "react";

import { PageHeader } from "../components/layout/AppShell";
import { Button } from "../components/ui/Button";
import { Badge, ProgressBar } from "../components/ui/Controls";
import { Field, Select } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { EmptyState, ErrorState, Skeleton } from "../components/ui/States";
import { Icon } from "../components/icons";
import { useResource } from "../hooks/useResource";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { post, ApiError } from "../lib/api";
import { formatMoney } from "../lib/format";

interface DebtSummary {
  total_debt: number;
  monthly_payments: number;
  active_count: number;
}

interface Debt {
  id: number;
  name: string;
  type: string;
  principal: number;
  remaining_balance: number;
  interest_rate: number;
  minimum_payment: number;
  due_day: number;
  start_date: string;
  paid_off: boolean;
}

const DEBT_TYPES = [
  { value: "loan", label: "Loan" },
  { value: "credit_card", label: "Credit Card" },
  { value: "mortgage", label: "Mortgage" },
  { value: "student", label: "Student Loan" },
  { value: "personal", label: "Personal" },
  { value: "other", label: "Other" }
];

export default function DebtsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const currency = user?.currency ?? "USD";
  const locale = user?.locale ?? "en-US";
  const summaryRes = useResource<DebtSummary>("/debts/summary");
  const debtsRes = useResource<{ items: Debt[] }>("/debts");

  const [createOpen, setCreateOpen] = useState(false);
  const [paying, setPaying] = useState<Debt | null>(null);

  return (
    <div>
      <PageHeader
        title="Debts"
        subtitle="Track and pay down what you owe."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Icon name="plus" className="size-4" /> Add Debt
          </Button>
        }
      />

      {debtsRes.error ? (
        <ErrorState message={debtsRes.error} onRetry={debtsRes.reload} />
      ) : debtsRes.loading || summaryRes.loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      ) : (
        <>
          {summaryRes.data ? (
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-line bg-surface p-5">
                <p className="text-sm text-ink2">Total Debt</p>
                <p className="tnum mt-1 font-display text-2xl font-bold tracking-tight">
                  {formatMoney(summaryRes.data.total_debt, currency, locale)}
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-surface p-5">
                <p className="text-sm text-ink2">Monthly Payments</p>
                <p className="tnum mt-1 font-display text-2xl font-bold tracking-tight">
                  {formatMoney(summaryRes.data.monthly_payments, currency, locale)}
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-surface p-5">
                <p className="text-sm text-ink2">Active Debts</p>
                <p className="tnum mt-1 font-display text-2xl font-bold tracking-tight">
                  {summaryRes.data.active_count}
                </p>
              </div>
            </div>
          ) : null}

          {!debtsRes.data || debtsRes.data.items.length === 0 ? (
            <EmptyState
              icon={<Icon name="target" className="size-8" />}
              title="No debts tracked"
              body="Add your loans, credit cards, or other debts to see payoff progress."
              action={
                <Button onClick={() => setCreateOpen(true)}>
                  <Icon name="plus" className="size-4" /> Add Your First Debt
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-line border-y border-line">
              {debtsRes.data.items.map((debt) => {
                const paidPct = debt.principal > 0 ? ((debt.principal - debt.remaining_balance) / debt.principal) * 100 : 0;
                return (
                  <li key={debt.id} className="group py-5">
                    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5">
                          <h2 className="truncate font-display text-lg font-semibold tracking-tight">{debt.name}</h2>
                          <Badge tone={debt.paid_off ? "pos" : "neutral"}>
                            {debt.paid_off ? "Paid Off" : debt.type.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="tnum mt-1 text-sm text-ink2">
                          {formatMoney(debt.remaining_balance, currency, locale)} remaining
                          {debt.principal > 0 ? ` of ${formatMoney(debt.principal, currency, locale)}` : ""}
                          {" · "}
                          {debt.interest_rate}% APR
                          {" · "}
                          Min. {formatMoney(debt.minimum_payment, currency, locale)}/mo
                          {" · "}
                          Due day {debt.due_day}
                        </p>
                      </div>
                      {!debt.paid_off ? (
                        <div className="flex items-center gap-2 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
                          <Button size="sm" variant="secondary" onClick={() => setPaying(debt)}>
                            Make Payment
                          </Button>
                        </div>
                      ) : null}
                    </div>
                    <div className="mt-3 max-w-xl">
                      <ProgressBar pct={paidPct} tone="brand" height="h-2" delay={80} />
                      <p className="mt-1 text-xs text-ink3">{Math.round(paidPct)}% paid</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      <DebtFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={(m) => {
          toast(m);
          debtsRes.reload();
          summaryRes.reload();
        }}
      />

      {paying ? (
        <PaymentModal
          debt={paying}
          currency={currency}
          locale={locale}
          onClose={() => setPaying(null)}
          onSaved={(m) => {
            toast(m);
            debtsRes.reload();
            summaryRes.reload();
            setPaying(null);
          }}
        />
      ) : null}
    </div>
  );
}

function DebtFormModal({
  open,
  onClose,
  onSaved
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("loan");
  const [principal, setPrincipal] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [minimumPayment, setMinimumPayment] = useState("");
  const [dueDay, setDueDay] = useState("1");
  const [startDate, setStartDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const submit = async () => {
    const principalVal = Number.parseFloat(principal);
    if (!name.trim()) return setError("Give the debt a name.");
    if (!principalVal || principalVal <= 0) return setError("Enter the principal amount.");
    setBusy(true);
    try {
      await post("/debts", {
        name: name.trim(),
        type,
        principal: principalVal,
        interest_rate: Number.parseFloat(interestRate) || 0,
        minimum_payment: Number.parseFloat(minimumPayment) || 0,
        due_day: Number(dueDay) || 1,
        start_date: startDate || null
      });
      onSaved(`Debt "${name.trim()}" added`);
      setName("");
      setPrincipal("");
      setInterestRate("");
      setMinimumPayment("");
      setDueDay("1");
      setStartDate("");
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add the debt.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Debt">
      <div className="space-y-4 px-5 pb-6 pt-5 sm:px-6">
        <Field label="Name" placeholder="e.g. Visa card" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <Select label="Type" value={type} onChange={(e) => setType(e.target.value)}>
          {DEBT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
        <Field label="Principal" inputMode="decimal" placeholder="5000" value={principal} onChange={(e) => setPrincipal(e.target.value.replace(/[^\d.]/g, ""))} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Interest Rate (%)" inputMode="decimal" placeholder="18.9" value={interestRate} onChange={(e) => setInterestRate(e.target.value.replace(/[^\d.]/g, ""))} />
          <Field label="Minimum Payment" inputMode="decimal" placeholder="200" value={minimumPayment} onChange={(e) => setMinimumPayment(e.target.value.replace(/[^\d.]/g, ""))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Due Day" type="number" min="1" max="28" value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
          <Field label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
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
            {busy ? "Adding…" : "Add Debt"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function PaymentModal({
  debt,
  currency,
  locale,
  onClose,
  onSaved
}: {
  debt: Debt;
  currency: string;
  locale: string;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [amountText, setAmountText] = useState(String(debt.minimum_payment));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const value = Number.parseFloat(amountText);
    if (!value || value <= 0) return setError("Enter an amount greater than zero.");
    setBusy(true);
    try {
      await post(`/debts/${debt.id}/payments`, { amount: value });
      onSaved(`${formatMoney(value, currency, locale)} payment recorded for ${debt.name}`);
      setAmountText("");
      setError(null);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not record the payment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`Pay ${debt.name}`}>
      <div className="px-5 pb-6 pt-5 sm:px-6">
        <p className="mb-4 text-sm text-ink2">
          Remaining: {formatMoney(debt.remaining_balance, currency, locale)}
        </p>
        <input
          autoFocus
          inputMode="decimal"
          placeholder="0"
          value={amountText}
          onChange={(e) => setAmountText(e.target.value.replace(/[^\d.]/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && void submit()}
          aria-label="Payment amount"
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
            {busy ? "Recording…" : "Record Payment"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
