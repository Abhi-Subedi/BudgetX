"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { PageHeader } from "../components/layout/AppShell";
import { Button } from "../components/ui/Button";
import { Avatar, Badge } from "../components/ui/Controls";
import { Field } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { EmptyState, ErrorState, SkeletonRows } from "../components/ui/States";
import { Icon } from "../components/icons";
import { useResource } from "../hooks/useResource";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { post, ApiError } from "../lib/api";
import { formatMoney, todayISO } from "../lib/format";
import type { GroupActivityItem, GroupBalance, GroupDetail } from "../types";

export default function GroupDetailPage() {
  const { groupId = '' } = useParams() || {};
  const gid = Number(Array.isArray(groupId) ? groupId[0] : groupId);
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const currency = user?.currency ?? "USD";
  const locale = user?.locale ?? "en-US";

  const groupRes = useResource<GroupDetail>(`/groups/${gid}`);
  const balancesRes = useResource<{ items: GroupBalance[] }>(`/groups/${gid}/balances`);
  const activityRes = useResource<{ items: GroupActivityItem[] }>(`/groups/${gid}/activity`);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (groupRes.error) {
    return <ErrorState message={groupRes.error} onRetry={groupRes.reload} />;
  }
  if (groupRes.loading || !groupRes.data) {
    return (
      <div className="space-y-8">
        <SkeletonRows rows={3} />
        <SkeletonRows rows={4} />
      </div>
    );
  }

  const group = groupRes.data;
  const isOwner = group.your_role === "owner";
  const canInvite = isOwner || group.your_role === "admin";

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(group.invite_code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast("Couldn't copy -- the code is " + group.invite_code, "info");
    }
  };

  return (
    <div>
      <button
        onClick={() => void router.push("/groups")}
        className="mb-5 inline-flex items-center gap-1 text-sm font-medium text-ink2 transition-colors hover:text-ink"
      >
        <Icon name="chevron-left" className="size-4" /> All groups
      </button>

      <PageHeader
        title={group.name}
        subtitle={`${group.members.length} members · ${currency}`}
        actions={
          <>
            <Button variant="secondary" onClick={copyCode}>
              <Icon name={copied ? "check" : "copy"} className="size-4" />
              {copied ? "Copied" : `Code ${group.invite_code}`}
            </Button>
            {canInvite ? (
              <Button onClick={() => setInviteOpen(true)}>
                <Icon name="plus" className="size-4" /> Invite
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-x-14 gap-y-12 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-10">
          <section aria-label="Members">
            <h2 className="eyebrow mb-3 border-b border-line pb-2">Members</h2>
            <ul className="divide-y divide-line/60">
              {group.members.map((m) => (
                <li key={m.user_id} className="flex items-center gap-3 py-3">
                  <Avatar name={m.name} className="size-9" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium">{m.name}</p>
                    <p className="truncate text-[13px] text-ink3">{m.email}</p>
                  </div>
                  <Badge tone={m.role === "owner" ? "pos" : "neutral"}>{m.role}</Badge>
                </li>
              ))}
            </ul>
          </section>

          <section aria-label="Balances">
            <h2 className="eyebrow mb-3 border-b border-line pb-2">Who owes what</h2>
            {!balancesRes.data || balancesRes.data.items.length === 0 ? (
              <SkeletonRows rows={3} />
            ) : balancesRes.data.items.every((b) => Math.abs(b.net) < 0.01) ? (
              <p className="py-6 text-center text-sm text-ink2">All square. Nobody owes anybody.</p>
            ) : (
              <ul className="divide-y divide-line/60">
                {balancesRes.data.items
                  .filter((b) => Math.abs(b.net) >= 0.01 || b.owes.length > 0)
                  .map((b) => {
                    const owesLabel =
                      b.net > 0.01
                        ? `gets back ${formatMoney(b.net, currency, locale)}`
                        : b.net < -0.01
                          ? `owes ${formatMoney(-b.net, currency, locale)}`
                          : "settled";
                    return (
                      <li key={b.user_id} className="flex items-center justify-between py-3">
                        <span className="min-w-0 truncate text-[15px] font-medium">
                          {b.name}
                          {b.user_id === user?.id ? " (you)" : ""}
                        </span>
                        <span className={`tnum shrink-0 text-sm font-semibold ${b.net > 0 ? "text-pos" : b.net < 0 ? "text-neg" : "text-ink3"}`}>
                          {owesLabel}
                        </span>
                      </li>
                    );
                  })}
              </ul>
            )}
          </section>
        </div>

        <section aria-label="Shared activity">
          <header className="mb-3 flex items-center justify-between border-b border-line pb-2">
            <h2 className="font-display text-xl font-semibold tracking-tight">Shared expenses</h2>
            <Button size="sm" variant="secondary" onClick={() => setExpenseOpen(true)}>
              <Icon name="plus" className="size-4" /> Add Expense
            </Button>
          </header>
          {activityRes.error ? (
            <ErrorState message={activityRes.error} onRetry={activityRes.reload} />
          ) : !activityRes.data || activityRes.data.items.length === 0 ? (
            <EmptyState
              title="No shared expenses yet"
              body="Add your first shared cost and BudgetX will split it evenly across the group."
            />
          ) : (
            <ul className="divide-y divide-line/60">
              {activityRes.data.items.map((item) => (
                <li key={item.transaction_id} className="flex items-start gap-3.5 py-3.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sunken text-ink2">
                    <Icon name="users" className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium">{item.description}</p>
                    <p className="text-[13px] text-ink3">
                      paid by {item.paid_by_name}
                      {item.paid_by_id === user?.id ? " (you)" : ""} · {" "}
                      {new Date(item.occurred_at + "T00:00:00").toLocaleDateString(locale, { month: "short", day: "numeric" })}
                      {" · your share "}
                      <span className="tnum font-medium text-ink2">{formatMoney(item.your_share, currency, locale)}</span>
                    </p>
                  </div>
                  <span className="tnum shrink-0 text-[15px] font-semibold">{formatMoney(item.amount, currency, locale)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <InviteModal open={inviteOpen} groupId={gid} onClose={() => setInviteOpen(false)} />

      <GroupExpenseModal
        open={expenseOpen}
        groupId={gid}
        members={group.members}
        currency={currency}
        onClose={() => setExpenseOpen(false)}
        onSaved={(m) => {
          toast(m);
          activityRes.reload();
          balancesRes.reload();
          groupRes.reload();
        }}
      />
    </div>
  );
}

function InviteModal({ open, groupId, onClose }: { open: boolean; groupId: number; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await post<{ code: string; email: string }>(`/groups/${groupId}/invite`, { email: email.trim() });
      setCode(res.code);
      setEmail("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send the invitation.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Invite Someone">
      <div className="space-y-4 px-5 pb-6 pt-5 sm:px-6">
        <Field
          label="Email address"
          type="email"
          placeholder="them@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
        />
        {error ? (
          <p role="alert" className="rounded-md bg-negtint px-3.5 py-2.5 text-sm text-neg animate-fade-in">
            {error}
          </p>
        ) : null}
        {code ? (
          <div className="rounded-md border border-brand/30 bg-brand-fade px-4 py-3 animate-pop-in">
            <p className="text-[13px] text-brand-strong">
              Invitation created. Share this code:
              <span className="tnum ml-1.5 font-mono text-base font-bold">{code}</span>
            </p>
          </div>
        ) : null}
        <div className="flex justify-end gap-2.5">
          <button onClick={onClose} className="h-10 rounded-md px-4 text-sm font-medium text-ink2 transition-colors hover:bg-sunken hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand">
            Close
          </button>
          <Button onClick={() => void submit()} disabled={busy || !email.trim()}>
            {busy ? "Inviting..." : "Create Invitation"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function GroupExpenseModal({
  open,
  groupId,
  members,
  currency,
  onClose,
  onSaved
}: {
  open: boolean;
  groupId: number;
  members: GroupDetail["members"];
  currency: string;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [description, setDescription] = useState("");
  const [amountText, setAmountText] = useState("");
  const [paidById, setPaidById] = useState<number>(members[0]?.user_id ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!open) return null;

  const submit = async () => {
    const value = Number.parseFloat(amountText);
    if (!description.trim()) return setError("Describe the expense.");
    if (!value || value <= 0) return setError("Enter an amount greater than zero.");
    setBusy(true);
    try {
      await post(`/groups/${groupId}/expenses`, {
        description: description.trim(),
        amount: value,
        paid_by_user_id: paidById,
        occurred_at: todayISO()
      });
      onSaved("Shared expense added");
      setDescription("");
      setAmountText("");
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add the expense.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Shared Expense">
      <div className="space-y-4 px-5 pb-6 pt-5 sm:px-6">
        <input
          autoFocus
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What was it for?"
          aria-label="Description"
          onKeyDown={(e) => e.key === "Enter" && void submit()}
          className="h-11 w-full rounded-md border border-line bg-surface px-3 text-[15px] placeholder:text-ink3 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
        />
        <div className="flex items-baseline gap-2">
          <input
            inputMode="decimal"
            placeholder="0"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value.replace(/[^\d.]/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && void submit()}
            aria-label="Amount"
            className="tnum w-full border-b border-line bg-transparent pb-2 text-center font-display text-3xl font-semibold outline-none placeholder:text-line focus:border-brand"
          />
          <span className="text-base text-ink3">{currency}</span>
        </div>
        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-ink2">Paid by</span>
          <select
            value={paidById}
            onChange={(e) => setPaidById(Number(e.target.value))}
            aria-label="Paid by"
            className="h-10 w-full rounded-md border border-line bg-surface px-3 text-[15px] focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
          >
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.name}
                {m.user_id === members[0]?.user_id ? "" : ""}
              </option>
            ))}
          </select>
        </div>
        <p className="text-[13px] text-ink3">The bill splits evenly across all {members.length} members.</p>
        {error ? (
          <p role="alert" className="rounded-md bg-negtint px-3.5 py-2.5 text-sm text-neg animate-fade-in">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2.5">
          <button onClick={onClose} className="h-10 rounded-md px-4 text-sm font-medium text-ink2 transition-colors hover:bg-sunken hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand">
            Cancel
          </button>
          <Button onClick={() => void submit()} disabled={busy}>
            {busy ? "Saving..." : "Save Expense"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

