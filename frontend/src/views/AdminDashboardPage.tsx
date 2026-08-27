"use client";

import { PageHeader } from "../components/layout/AppShell";
import { Icon } from "../components/icons";
import { ErrorState, Skeleton } from "../components/ui/States";
import { useResource } from "../hooks/useResource";
import { useAuth } from "../hooks/useAuth";
import { formatNumber } from "../lib/format";

interface AdminStats {
  total_users: number;
  active_users: number;
  new_registrations: number;
  total_transactions: number;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const statsRes = useResource<AdminStats>("/admin/stats");

  if (!user?.is_admin) {
    return (
      <div>
        <PageHeader title="Admin Dashboard" />
        <section className="rounded-2xl border border-line bg-surface p-5">
          <ErrorState message="You don't have permission to view this page." />
        </section>
      </div>
    );
  }

  if (statsRes.error) return <ErrorState message={statsRes.error} onRetry={statsRes.reload} />;

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Platform overview and key metrics."
      />

      {statsRes.loading || !statsRes.data ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        </div>
      ) : (
        <AdminBody data={statsRes.data} />
      )}
    </div>
  );
}

function AdminBody({ data }: { data: AdminStats }) {
  const stats = [
    { icon: "users" as const, tone: "brand" as const, label: "Total Users", value: formatNumber(data.total_users), sub: "All registered accounts" },
    { icon: "activity" as const, tone: "pos" as const, label: "Active Users", value: formatNumber(data.active_users), sub: "Logged in last 30 days" },
    { icon: "trending-up" as const, tone: "info" as const, label: "New Registrations", value: formatNumber(data.new_registrations), sub: "This month" },
    { icon: "document-text" as const, tone: "neg" as const, label: "Total Transactions", value: formatNumber(data.total_transactions), sub: "All time" },
  ];

  const toneBg: Record<string, string> = {
    brand: "bg-brand/15 text-brand",
    pos: "bg-pos/15 text-pos",
    info: "bg-info/15 text-info",
    neg: "bg-neg/15 text-neg",
  };

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-2xl border border-line bg-surface p-5 transition-colors duration-200 hover:border-ink3/40"
        >
          <div className="flex items-center gap-2.5">
            <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${toneBg[s.tone]}`}>
              <Icon name={s.icon} className="size-4" />
            </span>
            <span className="truncate text-sm font-medium text-ink2">{s.label}</span>
          </div>
          <p className="tnum mt-3 font-display text-3xl font-extrabold tracking-tight">{s.value}</p>
          <p className="mt-1 text-xs text-ink3">{s.sub}</p>
        </div>
      ))}
    </div>
  );
}
