"use client";

import { useState } from "react";

import { PageHeader } from "../components/layout/AppShell";
import { Button } from "../components/ui/Button";
import { EmptyState, ErrorState, Skeleton } from "../components/ui/States";
import { Icon } from "../components/icons";
import { useResource } from "../hooks/useResource";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { post } from "../lib/api";
import { formatMoney, formatDateLong } from "../lib/format";

interface NetWorthCurrent {
  assets: number;
  liabilities: number;
  net_worth: number;
}

interface NetWorthHistoryItem {
  id: number;
  date: string;
  assets: number;
  liabilities: number;
  net_worth: number;
}

export default function NetWorthPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const currency = user?.currency ?? "USD";
  const locale = user?.locale ?? "en-US";
  const currentRes = useResource<NetWorthCurrent>("/net-worth/current");
  const historyRes = useResource<{ items: NetWorthHistoryItem[] }>(
    "/net-worth/history",
  );

  const [snapshotBusy, setSnapshotBusy] = useState(false);

  const saveSnapshot = async () => {
    setSnapshotBusy(true);
    try {
      await post("/net-worth/snapshot");
      toast("Net worth snapshot saved");
      currentRes.reload();
      historyRes.reload();
    } catch {
      toast("Could not save snapshot.", "error");
    } finally {
      setSnapshotBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Net Worth"
        subtitle="Assets minus liabilities over time."
        actions={
          <Button onClick={() => void saveSnapshot()} disabled={snapshotBusy}>
            <Icon name="flag" className="size-4" />{" "}
            {snapshotBusy ? "Saving…" : "Save Snapshot"}
          </Button>
        }
      />

      {currentRes.error ? (
        <ErrorState message={currentRes.error} onRetry={currentRes.reload} />
      ) : currentRes.loading ? (
        <Skeleton className="h-40 w-full rounded-lg" />
      ) : currentRes.data ? (
        <div className="mb-8 rounded-2xl border border-line bg-surface p-6">
          <p className="text-sm text-ink2">Current Net Worth</p>
          <p
            className={`tnum mt-2 font-display text-4xl font-bold tracking-tight ${currentRes.data.net_worth < 0 ? "text-neg" : ""}`}
          >
            {formatMoney(currentRes.data.net_worth, currency, locale)}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-ink3">Assets</p>
              <p className="tnum font-semibold text-pos">
                {formatMoney(currentRes.data.assets, currency, locale)}
              </p>
            </div>
            <div>
              <p className="text-ink3">Liabilities</p>
              <p className="tnum font-semibold text-neg">
                {formatMoney(currentRes.data.liabilities, currency, locale)}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {historyRes.error ? (
        <ErrorState message={historyRes.error} onRetry={historyRes.reload} />
      ) : historyRes.loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : !historyRes.data || historyRes.data.items.length === 0 ? (
        <EmptyState
          icon={<Icon name="chart" className="size-8" />}
          title="No snapshots yet"
          body="Save a net worth snapshot to start tracking your wealth over time."
        />
      ) : (
        <div>
          <h2 className="eyebrow mb-4">History</h2>
          <ul className="divide-y divide-line border-y border-line">
            {historyRes.data.items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between py-4"
              >
                <div>
                  <p className="text-[15px] font-medium">
                    {formatDateLong(item.date)}
                  </p>
                  <p className="text-[13px] text-ink3">
                    Assets: {formatMoney(item.assets, currency, locale)} ·
                    Liabilities:{" "}
                    {formatMoney(item.liabilities, currency, locale)}
                  </p>
                </div>
                <span>{item?.date ? formatDateLong(item.date) : "N/A"}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
