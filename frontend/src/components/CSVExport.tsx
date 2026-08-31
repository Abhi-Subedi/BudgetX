"use client";

import { useState } from "react";

import { Icon } from "./icons";
import * as api from "../lib/api";

interface Transaction {
  id: string;
  date: string;
  type: string;
  amount: number;
  category?: string;
  account?: string;
  payee?: string;
  note?: string;
}

function toCSVRow(values: (string | number | undefined)[]): string {
  return values
    .map((v) => {
      const s = v === undefined || v === null ? "" : String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    })
    .join(",");
}

export function CSVExport() {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    setSuccess(false);
    try {
      const data = await api.get<{ items: Transaction[] }>(
        "/transactions?limit=9999",
      );
      const transactions = data.items ?? [];

      const headers = [
        "date",
        "type",
        "amount",
        "category",
        "account",
        "payee",
        "note",
      ];
      const rows = [
        headers.join(","),
        ...transactions.map((t) =>
          toCSVRow([
            t.date,
            t.type,
            t.amount,
            t.category,
            t.account,
            t.payee,
            t.note,
          ]),
        ),
      ];

      const csv = rows.join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const now = new Date();
      const filename = `budgetx-transactions-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}.csv`;

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
      setTimeout(() => setError(null), 4000);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={handleExport}
        disabled={exporting}
        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line bg-surface px-3.5 text-[13px] font-medium text-ink2 transition-colors hover:bg-sunken/60 hover:text-white disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
      >
        <Icon
          name={exporting ? "repeat" : "document-text"}
          className="size-4"
        />
        {exporting ? "Exporting..." : "Export CSV"}
      </button>
      {success ? (
        <span className="text-xs font-medium text-pos">Exported!</span>
      ) : null}
      {error ? (
        <span className="text-xs font-medium text-neg">{error}</span>
      ) : null}
    </div>
  );
}
