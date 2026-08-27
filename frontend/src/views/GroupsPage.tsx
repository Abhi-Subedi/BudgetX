"use client";

import { useState } from "react";
import Link from "next/link";

import { PageHeader } from "../components/layout/AppShell";
import { Button } from "../components/ui/Button";
import { Field } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { EmptyState, ErrorState, SkeletonRows } from "../components/ui/States";
import { Icon } from "../components/icons";
import { useResource } from "../hooks/useResource";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { post, ApiError } from "../lib/api";
import type { GroupSummary } from "../types";

export default function GroupsPage() {
  const { user } = useAuth();
  const groupsRes = useResource<{ items: GroupSummary[] }>("/groups");
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [code, setCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);

  const join = async () => {
    setJoinError(null);
    try {
      await post<{ id: number; name: string }>("/groups/join", { code: code.trim() });
      setCode("");
      setJoinOpen(false);
      groupsRes.reload();
    } catch (err) {
      setJoinError(err instanceof ApiError ? err.message : "Could not join with that code.");
    }
  };

  return (
    <div>
      <PageHeader
        title="Groups"
        subtitle="Shared money, handled together."
        actions={
          <>
            <Button variant="secondary" onClick={() => setJoinOpen(true)}>
              Join With Code
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Icon name="plus" className="size-4" /> New Group
            </Button>
          </>
        }
      />

      {groupsRes.error ? (
        <ErrorState message={groupsRes.error} onRetry={groupsRes.reload} />
      ) : groupsRes.loading ? (
        <SkeletonRows rows={3} />
      ) : !groupsRes.data || groupsRes.data.items.length === 0 ? (
        <EmptyState
          icon={<Icon name="users" className="size-8" />}
          title="No shared spaces yet"
          body="Create a Group for your household or trip — track shared expenses and see exactly who owes what."
          action={<Button onClick={() => setCreateOpen(true)}>Create a Group</Button>}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {groupsRes.data.items.map((group) => (
            <li key={group.id}>
              <Link
                href={`/groups/${group.id}`}
                className={`group block rounded-lg border border-line bg-surface p-5 shadow-line transition-shadow hover:shadow-lift focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand ${
                  group.owner_id === user?.id ? "" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-full bg-brand-tint text-brand-strong">
                    <Icon name="users" className="size-5" />
                  </span>
                  <span className="text-xs font-medium text-ink3">
                    {group.member_count} {group.member_count === 1 ? "member" : "members"}
                  </span>
                </div>
                <h2 className="mt-4 font-display text-lg font-semibold tracking-tight">{group.name}</h2>
                <p className="mt-1 flex items-center gap-1 text-sm text-ink2">
                  Open shared space
                  <Icon name="chevron-right" className="size-4 transition-transform group-hover:translate-x-0.5" />
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <CreateGroupModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => groupsRes.reload()} />

      <Modal open={joinOpen} onClose={() => setJoinOpen(false)} title="Join a Group">
        <div className="px-5 pb-6 pt-5 sm:px-6">
          <Field label="Invite code" placeholder="e.g. a1b2c3d4" value={code} onChange={(e) => setCode(e.target.value)} autoFocus />
          {joinError ? (
            <p role="alert" className="mt-3 rounded-md bg-negtint px-3.5 py-2.5 text-sm text-neg animate-fade-in">
              {joinError}
            </p>
          ) : null}
          <div className="mt-5 flex justify-end gap-2.5">
            <button onClick={() => setJoinOpen(false)} className="h-10 rounded-md px-4 text-sm font-medium text-ink2 transition-colors hover:bg-sunken hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand">
              Cancel
            </button>
            <Button onClick={() => void join()}>Join</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function CreateGroupModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const submit = async () => {
    if (!name.trim()) return setError("Give the group a name.");
    setBusy(true);
    try {
      await post<GroupSummary>("/groups", { name: name.trim(), currency: undefined });
      toast("Group created");
      setName("");
      setError(null);
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create the group.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New Group">
      <div className="space-y-4 px-5 pb-6 pt-5 sm:px-6">
        <Field label="Group name" placeholder="Household, Trip to Pokhara…" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <p className="text-[13px] leading-relaxed text-ink3">
          You’ll be the owner. Invite people by email or share the group’s join code.
        </p>
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
            {busy ? "Creating…" : "Create"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
