"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { PageHeader } from "../components/layout/AppShell";
import { Button } from "../components/ui/Button";
import { useToast } from "../hooks/useToast";
import * as api from "../lib/api";
import { ApiError } from "../lib/api";

interface NotificationPrefs {
  budget_alerts: boolean;
  overspending_alerts: boolean;
  bill_reminders: boolean;
  goal_reminders: boolean;
  weekly_summary: boolean;
  monthly_summary: boolean;
  security_alerts: boolean;
  marketing: boolean;
}

const PREFS_CONFIG: Array<{ key: keyof NotificationPrefs; label: string; description: string; locked?: boolean }> = [
  { key: "budget_alerts", label: "Budget Alerts", description: "Get notified when you approach budget limits" },
  { key: "overspending_alerts", label: "Overspending Alerts", description: "Alerts when you exceed budget categories" },
  { key: "bill_reminders", label: "Bill Reminders", description: "Reminders before bills are due" },
  { key: "goal_reminders", label: "Goal Reminders", description: "Updates on your savings goals progress" },
  { key: "weekly_summary", label: "Weekly Summary", description: "A weekly email digest of your finances" },
  { key: "monthly_summary", label: "Monthly Summary", description: "A monthly email report of your financial activity" },
  { key: "security_alerts", label: "Security Alerts", description: "Important security notifications for your account", locked: true },
  { key: "marketing", label: "Marketing", description: "Product updates and tips" }
];

export default function NotificationsPrefsPage() {
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    budget_alerts: true,
    overspending_alerts: true,
    bill_reminders: true,
    goal_reminders: true,
    weekly_summary: true,
    monthly_summary: true,
    security_alerts: true,
    marketing: false
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<NotificationPrefs>("/preferences/notifications");
        setPrefs({
          budget_alerts: res.budget_alerts ?? true,
          overspending_alerts: res.overspending_alerts ?? true,
          bill_reminders: res.bill_reminders ?? true,
          goal_reminders: res.goal_reminders ?? true,
          weekly_summary: res.weekly_summary ?? true,
          monthly_summary: res.monthly_summary ?? true,
          security_alerts: res.security_alerts ?? true,
          marketing: res.marketing ?? false
        });
      } catch {
        // use defaults
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggle = (key: keyof NotificationPrefs) => {
    if (PREFS_CONFIG.find((p) => p.key === key)?.locked) return;
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.put("/preferences/notifications", prefs);
      toast("Notification preferences saved");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not save preferences.", "error");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Notifications" subtitle="Control what you get notified about." />
        <div className="flex h-40 items-center justify-center text-sm text-ink3">Loading…</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Notifications" subtitle="Control what you get notified about." />

      <form onSubmit={save} className="max-w-lg space-y-1">
        {PREFS_CONFIG.map((config) => (
          <div
            key={config.key}
            className="flex items-center justify-between rounded-lg border border-line px-5 py-4"
          >
            <div>
              <p className="text-sm font-medium">{config.label}</p>
              <p className="text-xs text-ink3">{config.description}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs[config.key]}
              onClick={() => toggle(config.key)}
              disabled={config.locked}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand ${
                prefs[config.key] ? "bg-brand" : "bg-sunken"
              } ${config.locked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <span
                className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  prefs[config.key] ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        ))}

        <div className="pt-4">
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save Preferences"}
          </Button>
        </div>
      </form>
    </div>
  );
}
