"use client";

import { useCallback, useRef, useState } from "react";

import { Icon } from "./icons";
import { Modal } from "./ui/Modal";
import * as api from "../lib/api";

interface ParsedRow {
  date: string;
  type: string;
  amount: string;
  category: string;
  account: string;
  payee: string;
  note: string;
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    if (cols.length >= 2 && cols[0]) {
      rows.push({
        date: cols[0] || "",
        type: cols[1] || "expense",
        amount: cols[2] || "0",
        category: cols[3] || "",
        account: cols[4] || "",
        payee: cols[5] || "",
        note: cols[6] || "",
      });
    }
  }
  return rows;
}

export function CSVImport() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ParsedRow[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const rows = parseCSV(text);
      setPreview(rows);
      setModalOpen(true);
    };
    reader.readAsText(file);

    if (fileRef.current) fileRef.current.value = "";
  }, []);

  const handleImport = async () => {
    if (!preview || preview.length === 0) return;
    setImporting(true);
    setError(null);
    try {
      await api.post("/transactions/import", { transactions: preview });
      setModalOpen(false);
      setPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        onChange={handleFile}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />
      <button
        onClick={() => fileRef.current?.click()}
        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line bg-surface px-3.5 text-[13px] font-medium text-ink2 transition-colors hover:bg-sunken/60 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
      >
        <Icon name="arrow-up" className="size-4" />
        Import CSV
      </button>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Import Transactions"
        wide
      >
        <div className="p-5">
          {preview && preview.length === 0 ? (
            <p className="text-sm text-ink3">
              No valid transactions found in the file.
            </p>
          ) : (
            <>
              <p className="mb-3 text-sm text-ink2">
                Previewing{" "}
                <strong className="font-semibold text-white">
                  {preview?.length ?? 0}
                </strong>{" "}
                transaction(s).
              </p>
              <div className="max-h-64 overflow-auto rounded-lg border border-line">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-line bg-sunken">
                      <th className="px-3 py-2 font-medium text-ink3">Date</th>
                      <th className="px-3 py-2 font-medium text-ink3">Type</th>
                      <th className="px-3 py-2 font-medium text-ink3">
                        Amount
                      </th>
                      <th className="px-3 py-2 font-medium text-ink3">
                        Category
                      </th>
                      <th className="px-3 py-2 font-medium text-ink3">Payee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview?.slice(0, 20).map((row, i) => (
                      <tr key={i} className="border-b border-line/50">
                        <td className="px-3 py-1.5 text-ink2">{row.date}</td>
                        <td className="px-3 py-1.5 text-ink2">{row.type}</td>
                        <td className="px-3 py-1.5 font-medium text-white">
                          {row.amount}
                        </td>
                        <td className="px-3 py-1.5 text-ink2">
                          {row.category}
                        </td>
                        <td className="px-3 py-1.5 text-ink2">{row.payee}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {(preview?.length ?? 0) > 20 && (
                <p className="mt-2 text-xs text-ink3">
                  …and {(preview?.length ?? 0) - 20} more rows.
                </p>
              )}
            </>
          )}
          {error ? (
            <p
              role="alert"
              className="mt-4 rounded-md bg-negtint px-3.5 py-2.5 text-sm text-neg"
            >
              {error}
            </p>
          ) : null}
          <div className="mt-5 flex justify-end gap-2.5">
            <button
              onClick={() => setModalOpen(false)}
              className="h-10 rounded-md px-4 text-sm font-medium text-ink2 transition-colors hover:bg-sunken hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={importing || !preview || preview.length === 0}
              autoFocus
              className="h-10 rounded-md bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-strong disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {importing ? "Importing…" : "Import"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
