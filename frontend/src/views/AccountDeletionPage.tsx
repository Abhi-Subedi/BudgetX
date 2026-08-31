"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import { PageHeader } from "../components/layout/AppShell";
import { Button } from "../components/ui/Button";
import { Field } from "../components/ui/Input";
import { ConfirmDialog } from "../components/ui/Modal";
import { Icon } from "../components/icons";

import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";

import * as api from "../lib/api";
import { ApiError } from "../lib/api";

export default function AccountDeletionPage() {
  const { logout } = useAuth();
  const { toast } = useToast();

  // --------------------------------------------------------
  // State
  // --------------------------------------------------------

  const [password, setPassword] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [busy, setBusy] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);

  // --------------------------------------------------------
  // Export account data
  // --------------------------------------------------------

  const handleExport = async () => {
    setExportBusy(true);

    try {
      const res = await api.get<{ data: unknown }>("/account/export");

      const data = res.data ?? res;

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");

      a.href = url;
      a.download = "budgetx-data-export.json";

      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);

      toast("Data exported successfully");
    } catch (err) {
      toast(
        err instanceof ApiError ? err.message : "Could not export data.",
        "error",
      );
    } finally {
      setExportBusy(false);
    }
  };

  // --------------------------------------------------------
  // Open confirmation dialog
  // --------------------------------------------------------

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!password.trim()) {
      toast("Please enter your password.", "error");

      return;
    }

    setConfirmOpen(true);
  };

  // --------------------------------------------------------
  // Permanently delete account
  // --------------------------------------------------------

  const handleDelete = async () => {
    if (!password.trim()) {
      toast("Please enter your password.", "error");

      return;
    }

    setBusy(true);

    try {
      await api.request("/account", {
        method: "DELETE",
        body: JSON.stringify({
          value: password,
        }),
      });

      // Clear sensitive data from component state.
      setPassword("");
      setConfirmOpen(false);

      toast("Account deleted. Redirecting…");

      // Log the user out after successful deletion.
      logout();
    } catch (err) {
      toast(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : "Could not delete account.",
        "error",
      );

      setBusy(false);
    }
  };

  // --------------------------------------------------------
  // Render
  // --------------------------------------------------------

  return (
    <div>
      <PageHeader
        title="Delete Account"
        subtitle="Permanently delete your account and all data."
      />

      <div className="max-w-lg space-y-6">
        {/* ==================================================
            WARNING
        ================================================== */}

        <div className="rounded-lg border border-neg/30 bg-negtint/30 px-5 py-4">
          <div className="flex gap-3">
            <Icon name="alert" className="mt-0.5 size-5 shrink-0 text-neg" />

            <div className="space-y-2 text-sm text-ink2">
              <p className="font-medium text-neg">
                This action cannot be undone.
              </p>

              <ul className="list-disc space-y-1 pl-4">
                <li>
                  All your transactions, budgets, and financial data will be
                  permanently deleted.
                </li>

                <li>All linked accounts will be disconnected.</li>

                <li>Your account will be permanently removed.</li>

                <li>You will be logged out immediately.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ==================================================
            EXPORT DATA
        ================================================== */}

        <section>
          <h2 className="eyebrow mb-3 border-b border-line pb-2">
            Export Your Data
          </h2>

          <p className="mb-3 text-sm text-ink2">
            Before deleting your account, you can download a copy of your
            BudgetX data in JSON format.
          </p>

          <Button
            variant="secondary"
            disabled={exportBusy || busy}
            onClick={handleExport}
          >
            <Icon name="document-text" className="size-4" />

            {exportBusy ? "Exporting…" : "Export My Data"}
          </Button>
        </section>

        {/* ==================================================
            PASSWORD CONFIRMATION
        ================================================== */}

        <section>
          <h2 className="eyebrow mb-3 border-b border-line pb-2">
            Confirm Deletion
          </h2>

          <p className="mb-4 text-sm text-ink2">
            Enter your password to continue. You will be asked to confirm the
            deletion one more time.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field
              label="Enter your password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
              }}
              placeholder="Your password"
              disabled={busy}
            />

            <Button
              type="submit"
              variant="danger"
              disabled={!password.trim() || busy}
            >
              <Icon name="trash" className="size-4" />
              Delete Account
            </Button>
          </form>
        </section>
      </div>

      {/* ====================================================
          FINAL DELETE CONFIRMATION DIALOG
      ==================================================== */}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          if (!busy) {
            setConfirmOpen(false);
          }
        }}
        onConfirm={handleDelete}
        title="Delete Account"
        body={
          "Are you absolutely sure you want to delete your account? " +
          "This will permanently erase all your data and cannot be reversed."
        }
        confirmLabel="Yes, delete my account"
        busy={busy}
      />
    </div>
  );
}
