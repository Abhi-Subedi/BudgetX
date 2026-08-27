"use client";

import { useState } from "react";

import { PageHeader } from "../components/layout/AppShell";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Controls";
import { Field, Select } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { EmptyState, ErrorState, SkeletonRows } from "../components/ui/States";
import { Icon } from "../components/icons";
import type { IconName } from "../components/icons";
import { useResource } from "../hooks/useResource";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { patch, post, ApiError } from "../lib/api";
import { formatMoney, SUPPORTED_CURRENCIES } from "../lib/format";
import type { Account, AccountType } from "../types";

const TYPE_META: Record<AccountType, { label: string; icon: IconName }> = {
  cash: { label: "Cash", icon: "wallet" },
  bank: { label: "Bank", icon: "activity" },
  wallet: { label: "Wallet", icon: "wallet" },
  credit: { label: "Credit card", icon: "target" },
  savings: { label: "Savings", icon: "flag" },
  investment: { label: "Investment", icon: "chart" }
};

interface AccountsResponse {
  items: Account[];
  total_balance: number;
}

export default function AccountsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const currency = user?.currency ?? "USD";
  const locale = user?.locale ?? "en-US";
  const accountsRes = useResource<AccountsResponse>("/accounts");

  const [createOpen, setCreateOpen] = useState(false);

  const grouped = new Map<AccountType, Account[]>();
  for (const account of accountsRes.data?.items ?? []) {
    if (!grouped.has(account.type)) grouped.set(account.type, []);
    grouped.get(account.type)!.push(account);
  }

  return (
    <div>
      <PageHeader
        title="Accounts"
        subtitle="Every place your money lives."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Icon name="plus" className="size-4" /> Add Account
          </Button>
        }
      />

      {accountsRes.error ? (
        <ErrorState message={accountsRes.error} onRetry={accountsRes.reload} />
      ) : accountsRes.loading ? (
        <SkeletonRows rows={4} />
      ) : (
        <>
          <section className="border-b border-line pb-8" aria-label="Net total">
            <p className="eyebrow mb-2">Across all active accounts</p>
            <p className="tnum font-display text-4xl font-semibold tracking-tight">
              {formatMoney(accountsRes.data?.total_balance ?? 0, currency, locale)}
            </p>
          </section>

          {!accountsRes.data || accountsRes.data.items.length === 0 ? (
            <EmptyState
              title="No accounts yet"
              body="Add the accounts you actually use — cash in your pocket, a bank account, a mobile wallet."
              action={<Button onClick={() => setCreateOpen(true)}>Add Your First Account</Button>}
            />
          ) : (
            [...grouped.entries()].map(([type, items]) => (
              <section key={type} className="mt-10" aria-label={TYPE_META[type].label}>
                <h2 className="eyebrow mb-1 border-b border-line pb-2">{TYPE_META[type].label}</h2>
                <ul className="divide-y divide-line/60">
                  {items.map((account) => (
                    <li key={account.id} className="group flex items-center gap-4 py-4">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sunken text-ink2">
                        <Icon name={TYPE_META[account.type].icon} className="size-4.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium">
                          {account.name}
                          {account.archived ? (
                            <Badge>
                              <span>Archived</span>
                            </Badge>
                          ) : null}
                        </p>
                        <p className="text-[13px] text-ink3">
                          {account.currency}
                          {account.opening_balance !== 0 && !account.archived
                            ? ` · opened with ${formatMoney(account.opening_balance, account.currency, locale)}`
                            : ""}
                        </p>
                      </div>
                      <span className={`tnum text-[17px] font-semibold ${account.balance < 0 ? "text-neg" : ""}`}>
                        {formatMoney(account.balance, account.currency, locale)}
                      </span>
                      {!account.archived ? (
                        <button
                          onClick={async () => {
                            try {
                              await patch(`/accounts/${account.id}`, { archived: true });
                              toast(`${account.name} archived`);
                              accountsRes.reload();
                            } catch {
                              toast("Could not archive this account.", "error");
                            }
                          }}
                          aria-label={`Archive ${account.name}`}
                          className="hidden size-8 shrink-0 place-items-center rounded-md text-ink3 transition-colors hover:bg-sunken hover:text-ink group-hover:grid"
                        >
                          <Icon name="close" className="size-4" />
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </>
      )}

      <AccountFormModal open={createOpen} defaultCurrency={currency} onClose={() => setCreateOpen(false)} onSaved={(m) => { toast(m); accountsRes.reload(); }} />
    </div>
  );
}

function AccountFormModal({
  open,
  defaultCurrency,
  onClose,
  onSaved
}: {
  open: boolean;
  defaultCurrency: string;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("bank");
  const [opening, setOpening] = useState("");
  const [currencyCode, setCurrencyCode] = useState(defaultCurrency);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const submit = async () => {
    if (!name.trim()) return setError("Give the account a name.");
    setBusy(true);
    try {
      await post("/accounts", {
        name: name.trim(),
        type,
        opening_balance: Number.parseFloat(opening) || 0,
        currency: currencyCode
      });
      onSaved(`${name.trim()} added`);
      setName("");
      setOpening("");
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create the account.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Account">
      <div className="space-y-4 px-5 pb-6 pt-5 sm:px-6">
        <Field label="Name" placeholder="e.g. Main bank" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <Select label="Type" value={type} onChange={(e) => setType(e.target.value as AccountType)}>
          {(Object.keys(TYPE_META) as AccountType[]).map((t) => (
            <option key={t} value={t}>
              {TYPE_META[t].label}
            </option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Opening balance" inputMode="decimal" placeholder="0.00" value={opening} onChange={(e) => setOpening(e.target.value.replace(/[^\d.-]/g, ""))} />
          <Select label="Currency" value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)}>
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
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
            {busy ? "Adding…" : "Add Account"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
