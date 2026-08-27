"use client";

import { useState } from "react";

import { PageHeader } from "../components/layout/AppShell";
import { Button } from "../components/ui/Button";
import { Field } from "../components/ui/Input";
import { Select } from "../components/ui/Input";
import { ConfirmDialog, Modal } from "../components/ui/Modal";
import { EmptyState, ErrorState, SkeletonRows } from "../components/ui/States";
import { Icon } from "../components/icons";
import { useResource } from "../hooks/useResource";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { del, post, ApiError } from "../lib/api";
import { formatMoney, formatDate } from "../lib/format";
import type { Account } from "../types";

interface Transfer {
  id: number;
  from_account_id: number;
  to_account_id: number;
  from_account_name: string;
  to_account_name: string;
  amount: number;
  fee: number;
  note: string | null;
  created_at: string;
}

export default function TransfersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const currency = user?.currency ?? "USD";
  const locale = user?.locale ?? "en-US";
  const transfersRes = useResource<{ items: Transfer[] }>("/transfers");
  const accountsRes = useResource<{ items: Account[] }>("/accounts");

  const [createOpen, setCreateOpen] = useState(false);
  const [deleting, setDeleting] = useState<Transfer | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const accounts = accountsRes.data?.items ?? [];

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await del(`/transfers/${deleting.id}`);
      toast("Transfer deleted");
      transfersRes.reload();
    } catch {
      toast("Could not delete the transfer.", "error");
    } finally {
      setDeleteBusy(false);
      setDeleting(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Transfers"
        subtitle="Move money between accounts."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Icon name="plus" className="size-4" /> New Transfer
          </Button>
        }
      />

      {transfersRes.error ? (
        <ErrorState message={transfersRes.error} onRetry={transfersRes.reload} />
      ) : transfersRes.loading ? (
        <SkeletonRows rows={4} />
      ) : !transfersRes.data || transfersRes.data.items.length === 0 ? (
        <EmptyState
          icon={<Icon name="chevron-right" className="size-8" />}
          title="No transfers yet"
          body="Move money between your accounts to keep balances accurate."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Icon name="plus" className="size-4" /> Record a Transfer
            </Button>
          }
        />
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {transfersRes.data.items.map((transfer) => (
            <li key={transfer.id} className="group flex items-center gap-4 py-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sunken text-ink2">
                <Icon name="chevron-right" className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium">
                  {transfer.from_account_name} → {transfer.to_account_name}
                </p>
                <p className="text-[13px] text-ink3">
                  {formatDate(transfer.created_at)}
                  {transfer.note ? ` · ${transfer.note}` : ""}
                </p>
              </div>
              <div className="text-right">
                <span className="tnum text-[17px] font-semibold">
                  {formatMoney(transfer.amount, currency, locale)}
                </span>
                {transfer.fee > 0 ? (
                  <p className="text-xs text-ink3">
                    Fee: {formatMoney(transfer.fee, currency, locale)}
                  </p>
                ) : null}
              </div>
              <button
                onClick={() => setDeleting(transfer)}
                aria-label={`Delete transfer`}
                className="hidden size-8 shrink-0 place-items-center rounded-md text-ink3 transition-colors hover:bg-negtint hover:text-neg group-hover:grid focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
              >
                <Icon name="trash" className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <TransferFormModal
        open={createOpen}
        accounts={accounts}
        onClose={() => setCreateOpen(false)}
        onSaved={(m) => {
          toast(m);
          transfersRes.reload();
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => void confirmDelete()}
        busy={deleteBusy}
        title="Delete Transfer?"
        body="This transfer record will be permanently removed."
      />
    </div>
  );
}

function TransferFormModal({
  open,
  accounts,
  onClose,
  onSaved
}: {
  open: boolean;
  accounts: Account[];
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [fee, setFee] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const submit = async () => {
    const amountVal = Number.parseFloat(amount);
    if (!fromAccountId) return setError("Select a source account.");
    if (!toAccountId) return setError("Select a destination account.");
    if (fromAccountId === toAccountId) return setError("Source and destination must be different.");
    if (!amountVal || amountVal <= 0) return setError("Enter an amount greater than zero.");
    setBusy(true);
    try {
      await post("/transfers", {
        from_account_id: Number(fromAccountId),
        to_account_id: Number(toAccountId),
        amount: amountVal,
        fee: Number.parseFloat(fee) || 0,
        note: note.trim() || null
      });
      onSaved("Transfer recorded");
      setFromAccountId("");
      setToAccountId("");
      setAmount("");
      setFee("");
      setNote("");
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not record the transfer.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New Transfer">
      <div className="space-y-4 px-5 pb-6 pt-5 sm:px-6">
        <Select
          label="From Account"
          value={fromAccountId}
          onChange={(e) => { setFromAccountId(e.target.value); setError(null); }}
        >
          <option value="">Select account…</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
        <Select
          label="To Account"
          value={toAccountId}
          onChange={(e) => { setToAccountId(e.target.value); setError(null); }}
        >
          <option value="">Select account…</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Amount"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
          />
          <Field
            label="Fee (optional)"
            inputMode="decimal"
            placeholder="0.00"
            value={fee}
            onChange={(e) => setFee(e.target.value.replace(/[^\d.]/g, ""))}
          />
        </div>
        <Field
          label="Note (optional)"
          placeholder="e.g. Savings contribution"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
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
            {busy ? "Recording…" : "Record Transfer"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}


