import type { Transaction } from "../../types";
import { formatMoney, relativeDay } from "../../lib/format";

interface LedgerProps {
  transactions: Transaction[];
  currency: string;
  locale?: string;
  onEdit?: (txn: Transaction) => void;
  onDelete?: (txn: Transaction) => void;
}

export function TransactionLedger({ transactions, currency, locale = "en-US", onEdit, onDelete }: LedgerProps) {
  const groups: Array<{ label: string | null; items: Transaction[] }> = [];
  for (const txn of transactions) {
    const label = relativeDay(txn.occurred_at);
    const last = groups[groups.length - 1];
    if (last && last.label === label && label !== null) {
      last.items.push(txn);
    } else {
      groups.push({ label, items: [txn] });
    }
  }

  return (
    <div>
      {groups.map((group, gi) => (
        <section key={`${group.label ?? group.items[0]?.occurred_at}-${gi}`} className={gi > 0 ? "mt-7" : ""}>
          {group.label ? (
            <h3 className="eyebrow mb-1 border-b border-line pb-2">{group.label}</h3>
          ) : (
            <h3 className="eyebrow mb-1 border-b border-line pb-2">
              {new Date(group.items[0].occurred_at + "T00:00:00").toLocaleDateString(locale, {
                month: "short",
                day: "numeric"
              })}
            </h3>
          )}
          <ul className="divide-y divide-line/60">
            {group.items.map((txn) => {
              const isIncome = txn.type === "income";
              return (
                <li key={txn.id} className="group flex items-center gap-3.5 py-3">
                  <span
                    aria-hidden="true"
                    className="grid size-9 shrink-0 place-items-center rounded-full text-[10px] font-bold uppercase tracking-wide"
                    style={{
                      backgroundColor: `${txn.category_color ?? "#64748B"}1F`,
                      color: txn.category_color ?? "#94A3B8"
                    }}
                  >
                    {(txn.category_name ?? "•").slice(0, 2)}
                  </span>
                  <div className="min-w-0 flex-1 cursor-default">
                    <p className="truncate text-[15px] font-medium leading-snug">
                      {txn.payee ?? txn.category_name ?? (isIncome ? "Income" : "Expense")}
                      {txn.group_id !== null ? (
                        <span className="ml-1.5 rounded bg-sunken px-1 py-px align-middle text-[10px] font-semibold uppercase tracking-wide text-ink3">
                          shared
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-[13px] leading-snug text-ink3">
                      {txn.note ? `${txn.note} · ` : ""}
                      {txn.account_name}
                    </p>
                  </div>
                  <span
                    className={`tnum shrink-0 text-[15px] font-semibold tabular-nums ${
                      isIncome ? "text-pos" : "text-ink"
                    }`}
                  >
                    {formatMoney(isIncome ? txn.amount : -txn.amount, currency, locale, { signed: true })}
                  </span>
                  {(onEdit || onDelete) && (
                    <div className="ml-1 flex shrink-0 gap-1 opacity-0 transition-opacity pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto">
                      {onEdit ? (
                        <button
                          onClick={() => onEdit(txn)}
                          aria-label={`Edit ${txn.payee ?? "transaction"}`}
                          className="grid size-8 place-items-center rounded-md text-ink3 transition-colors hover:bg-sunken hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
                        >
                          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                            <path d="M4 20h4.5L20 8.5a2.1 2.1 0 0 0-3-3L5.5 17 4 20ZM14.5 8l3 3" />
                          </svg>
                        </button>
                      ) : null}
                      {onDelete ? (
                        <button
                          onClick={() => onDelete(txn)}
                          aria-label={`Delete ${txn.payee ?? "transaction"}`}
                          className="grid size-8 place-items-center rounded-md text-ink3 transition-colors hover:bg-negtint hover:text-neg focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
                        >
                          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                            <path d="M5 7h14M9.5 7V4.5h5V7m-8 0 .8 13h9.4l.8-13M10 11v5m4-5v5" />
                          </svg>
                        </button>
                      ) : null}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
