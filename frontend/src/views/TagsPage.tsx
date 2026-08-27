"use client";

import { useState } from "react";

import { PageHeader } from "../components/layout/AppShell";
import { Button } from "../components/ui/Button";
import { Field } from "../components/ui/Input";
import { ConfirmDialog, Modal } from "../components/ui/Modal";
import { EmptyState, ErrorState, SkeletonRows } from "../components/ui/States";
import { Icon } from "../components/icons";
import { useResource } from "../hooks/useResource";
import { useToast } from "../hooks/useToast";
import { del, post, ApiError } from "../lib/api";

interface Tag {
  id: number;
  name: string;
  color: string;
  transaction_count: number;
}

export default function TagsPage() {
  const { toast } = useToast();
  const tagsRes = useResource<Tag[]>("/tags");

  const [createOpen, setCreateOpen] = useState(false);
  const [deleting, setDeleting] = useState<Tag | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await del(`/tags/${deleting.id}`);
      toast("Tag deleted");
      tagsRes.reload();
    } catch {
      toast("Could not delete the tag.", "error");
    } finally {
      setDeleteBusy(false);
      setDeleting(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Tags"
        subtitle="Label your transactions for sharper insights."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Icon name="plus" className="size-4" /> New Tag
          </Button>
        }
      />

      {tagsRes.error ? (
        <ErrorState message={tagsRes.error} onRetry={tagsRes.reload} />
      ) : tagsRes.loading ? (
        <SkeletonRows rows={4} />
      ) : !tagsRes.data || tagsRes.data.length === 0 ? (
        <EmptyState
          icon={<Icon name="flag" className="size-8" />}
          title="No tags yet"
          body="Create tags to categorize transactions across accounts — #groceries, #work, #vacation."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Icon name="plus" className="size-4" /> Create Your First Tag
            </Button>
          }
        />
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {tagsRes.data.map((tag) => (
            <li key={tag.id} className="group flex items-center gap-4 py-4">
              <span
                className="size-5 shrink-0 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium">{tag.name}</p>
                <p className="text-[13px] text-ink3">
                  {tag.transaction_count} transaction{tag.transaction_count !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={() => setDeleting(tag)}
                aria-label={`Delete tag ${tag.name}`}
                className="hidden size-8 shrink-0 place-items-center rounded-md text-ink3 transition-colors hover:bg-negtint hover:text-neg group-hover:grid focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
              >
                <Icon name="trash" className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <TagFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={(m) => {
          toast(m);
          tagsRes.reload();
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => void confirmDelete()}
        busy={deleteBusy}
        title="Delete Tag?"
        body={`The tag "${deleting?.name ?? ""}" will be removed. Transactions using it will keep their other tags.`}
      />
    </div>
  );
}

function TagFormModal({
  open,
  onClose,
  onSaved
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#10B981");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const submit = async () => {
    if (!name.trim()) return setError("Give the tag a name.");
    setBusy(true);
    try {
      await post("/tags", { name: name.trim(), color });
      onSaved(`Tag "${name.trim()}" created`);
      setName("");
      setColor("#10B981");
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create the tag.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New Tag">
      <div className="space-y-4 px-5 pb-6 pt-5 sm:px-6">
        <Field
          label="Name"
          placeholder="e.g. Groceries"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-ink2">Color</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-full cursor-pointer rounded-md border border-line bg-surface"
          />
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
            {busy ? "Creating…" : "Create Tag"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}


