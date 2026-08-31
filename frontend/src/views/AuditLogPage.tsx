"use client";

import { useState } from "react";

import { PageHeader } from "../components/layout/AppShell";
import { Badge } from "../components/ui/Controls";
import { Icon } from "../components/icons";
import { EmptyState, ErrorState, SkeletonRows } from "../components/ui/States";
import { useResource } from "../hooks/useResource";
import { parseISO } from "../lib/format";

interface AuditEntry {
  id: number;
  action: "create" | "update" | "delete";
  entity_type: string;
  entity_id: number;
  details: Record<string, unknown> | null;
  created_at: string;
}

const ENTITY_TYPES = [
  "all",
  "transaction",
  "budget",
  "goal",
  "account",
  "category",
  "bill",
  "subscription",
];

function actionBadgeTone(action: string) {
  switch (action) {
    case "create":
      return "pos" as const;
    case "update":
      return "warn" as const;
    case "delete":
      return "neg" as const;
    default:
      return "neutral" as const;
  }
}

function formatTimestamp(iso: string) {
  const d = parseISO(iso);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export default function AuditLogPage() {
  const [entityFilter, setEntityFilter] = useState("all");
  const endpoint =
    entityFilter === "all"
      ? "/audit-log?limit=50"
      : `/audit-log?limit=50&entity_type=${entityFilter}`;

  const logRes = useResource<{ items: AuditEntry[] }>(endpoint);

  if (logRes.error)
    return <ErrorState message={logRes.error} onRetry={logRes.reload} />;

  return (
    <div>
      <PageHeader
        title="Activity Log"
        subtitle="See what's changed in your account."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {ENTITY_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setEntityFilter(t)}
                className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  entityFilter === t
                    ? "bg-brand text-white"
                    : "bg-surface text-ink2 hover:bg-sunken/60"
                }`}
              >
                {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        }
      />

      {logRes.loading || !logRes.data ? (
        <section className="rounded-2xl border border-line bg-surface p-5">
          <SkeletonRows rows={8} />
        </section>
      ) : logRes.data.items.length === 0 ? (
        <section className="rounded-2xl border border-line bg-surface p-5">
          <EmptyState
            icon={<Icon name="activity" className="size-7" />}
            title="No activity yet"
            body="Changes to your data will appear here."
          />
        </section>
      ) : (
        <section className="rounded-2xl border border-line bg-surface">
          <ul className="divide-y divide-line/70">
            {logRes.data.items.map((entry) => (
              <li
                key={entry.id}
                className="flex items-start gap-4 p-4 transition-colors hover:bg-sunken/30"
              >
                <Badge tone={actionBadgeTone(entry.action)}>
                  {entry.action}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">
                    {entry.entity_type.replace(/_/g, " ")}
                    <span className="ml-1.5 text-xs text-ink3">
                      #{entry.entity_id}
                    </span>
                  </p>
                  {entry.details && Object.keys(entry.details).length > 0 ? (
                    <p className="mt-0.5 text-xs text-ink3 truncate">
                      {Object.entries(entry.details)
                        .map(([k, v]) => `${k}: ${String(v)}`)
                        .join(" · ")}
                    </p>
                  ) : null}
                </div>
                <span className="tnum shrink-0 text-xs text-ink3">
                  {formatTimestamp(entry.created_at)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
