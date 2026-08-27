"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { PageHeader } from "../components/layout/AppShell";
import { TransactionLedger } from "../components/transactions/TransactionLedger";
import { TransactionFormModal } from "../components/transactions/TransactionFormModal";
import { Button } from "../components/ui/Button";
import { Segmented } from "../components/ui/Controls";
import { Select } from "../components/ui/Input";
import { ConfirmDialog } from "../components/ui/Modal";
import { RecurringPanel } from "../components/ui/RecurringPanel";
import { EmptyState, ErrorState, SkeletonRows } from "../components/ui/States";
import { Icon } from "../components/icons";
import { useResource } from "../hooks/useResource";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { del } from "../lib/api";
import { formatMoney } from "../lib/format";
import type { Account, Category, RecurringRule, Transaction, TransactionPage } from "../types";

type Tab = "activity" | "recurring";
type TypeFilter = "all" | "expense" | "income";

const TABS: Tab[] = ["activity", "recurring"];

export default function TransactionsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const currency = user?.currency ?? "USD";
  const locale = user?.locale ?? "en-US";

  const searchParams = useSearchParams() ?? new URLSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tabParam = searchParams.get("tab") ?? "activity";
  const tab: Tab = TABS.includes(tabParam as Tab) ? (tabParam as Tab) : "activity";
  const typeParam = searchParams.get("type") ?? "all";
  const typeFilter: TypeFilter = ["all", "expense", "income"].includes(typeParam) ? (typeParam as TypeFilter) : "all";
  const query = searchParams.get("q") ?? "";
  const pageRaw = Number(searchParams.get("page") ?? "1");
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;
  const categoryId = searchParams.get("category_id");
  const accountId = searchParams.get("account_id");

  const setParams = (patch: Record<string, string | number | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "" || value === "all" || value === "activity" || (key === "page" && Number(value) <= 1)) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    }
    const qs = next.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  const accountsRes = useResource<{ items: Account[] }>("/accounts");
  const categoriesRes = useResource<{ items: Category[] }>("/categories");

  const filterQS = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), page_size: "25" });
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (categoryId) params.set("category_id", categoryId);
    if (accountId) params.set("account_id", accountId);
    if (query.trim()) params.set("q", query.trim());
    return params.toString();
  }, [page, typeFilter, categoryId, accountId, query]);

  const txnsRes = useResource<TransactionPage>(tab === "activity" ? `/transactions?${filterQS}` : null);
  const recurringRes = useResource<{ items: RecurringRule[] }>(tab === "recurring" ? "/recurring" : null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const accounts = accountsRes.data?.items.filter((a) => !a.archived) ?? [];
  const categories = categoriesRes.data?.items ?? [];

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await del(`/transactions/${deleting.id}`);
      toast("Transaction deleted");
      txnsRes.reload();
    } catch {
      toast("Could not delete the transaction.", "error");
    } finally {
      setDeleteBusy(false);
      setDeleting(null);
    }
  };

  const pageTotals = useMemo(() => {
    const items = txnsRes.data?.items ?? [];
    return {
      in: items.reduce((s, t) => s + (t.type === "income" ? t.amount : 0), 0),
      out: items.reduce((s, t) => s + (t.type === "expense" ? t.amount : 0), 0)
    };
  }, [txnsRes.data]);

  const resetFilters = () => {
    setParams({ type: null, category_id: null, account_id: null, q: null, page: null });
  };

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle={
          tab === "activity"
            ? `${txnsRes.data?.total ?? 0} recorded · in ${formatMoney(pageTotals.in, currency, locale)} · out ${formatMoney(pageTotals.out, currency, locale)}`
            : "Rules that post to your ledger on schedule."
        }
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Icon name="plus" className="size-4" /> Add Transaction
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Segmented<Tab>
          value={tab}
          onChange={(v) => setParams({ tab: v, page: null })}
          options={[
            { value: "activity", label: "Activity" },
            { value: "recurring", label: "Recurring" }
          ]}
        />

        {tab === "activity" ? (
          <>
            <div className="relative ml-auto w-full max-w-[220px]">
              <Icon name="search" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink3" />
              <input
                value={query}
                onChange={(e) => {
                  setParams({ q: e.target.value, page: null });
                }}
                placeholder="Search notes, payees…"
                aria-label="Search transactions"
                autoComplete="off"
                className="h-9 w-full rounded-md border border-line bg-surface pl-9 pr-3 text-sm placeholder:text-ink3 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
              />
            </div>

            <Select
              aria-label="Filter by category"
              className="h-9 !w-auto min-w-[150px] text-sm"
              value={categoryId ?? ""}
              onChange={(e) => {
                setParams({ category_id: e.target.value || null, page: null });
              }}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>

            <Select
              aria-label="Filter by account"
              className="h-9 !w-auto min-w-[130px] text-sm"
              value={accountId ?? ""}
              onChange={(e) => {
                setParams({ account_id: e.target.value || null, page: null });
              }}
            >
              <option value="">All accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </>
        ) : null}
      </div>

      {tab === "activity" ? (
        txnsRes.error ? (
          <ErrorState message={txnsRes.error} onRetry={txnsRes.reload} />
        ) : txnsRes.loading ? (
          <SkeletonRows rows={6} />
        ) : !txnsRes.data || txnsRes.data.items.length === 0 ? (
          <EmptyState
            icon={<Icon name="activity" className="size-8" />}
            title="No transactions here"
            body={
              query || categoryId || accountId || typeFilter !== "all"
                ? "Nothing matches these filters."
                : "Record your first transaction and your financial picture starts taking shape."
            }
            action={
              query || categoryId || accountId || typeFilter !== "all" ? (
                <Button variant="secondary" onClick={resetFilters}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div>
            <TransactionLedger
              transactions={txnsRes.data.items}
              currency={currency}
              locale={locale}
              onEdit={(txn) => {
                setEditing(txn);
                setFormOpen(true);
              }}
              onDelete={setDeleting}
            />
            {txnsRes.data.total > txnsRes.data.items.length * txnsRes.data.page ? (
              <div className="mt-6 text-center">
                <Button variant="secondary" onClick={() => setParams({ page: page + 1 })}>
                  Load More
                </Button>
              </div>
            ) : null}
          </div>
        )
      ) : (
        <RecurringPanel
          rules={recurringRes.data?.items ?? []}
          loading={recurringRes.loading || accountsRes.loading}
          accounts={accounts}
          categories={categories}
          currency={currency}
          locale={locale}
          onChanged={recurringRes.reload}
        />
      )}

      <TransactionFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={(msg) => {
          toast(msg);
          txnsRes.reload();
        }}
        accounts={accounts}
        categories={categories}
        currency={currency}
        locale={locale}
        editing={editing}
      />

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => void confirmDelete()}
        busy={deleteBusy}
        title="Delete Transaction?"
        body={`This will remove “${deleting?.payee ?? "this transaction"}” from your ledger. This can’t be undone.`}
      />
    </div>
  );
}
