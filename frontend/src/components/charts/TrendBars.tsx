"use client";

import { useEffect, useState } from "react";

import { formatMoney } from "../../lib/format";
import type { TrendPoint } from "../../types";

interface Props {
  points: TrendPoint[];
  currency: string;
  locale?: string;
}

export function TrendBars({ points, currency, locale = "en-US" }: Props) {
  const [grown, setGrown] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setGrown(true);
      return;
    }
    const t = window.setTimeout(() => setGrown(true), 60);
    return () => window.clearTimeout(t);
  }, []);

  if (!points.length) return null;
  const max = Math.max(...points.flatMap((p) => [p.income, p.expense]), 100) * 1.1;

  return (
    <div>
      <div className="flex items-end gap-3 sm:gap-5" role="img" aria-label="Income and expenses by month">
        {points.map((p, i) => {
          const incomeH = (p.income / max) * 150;
          const expenseH = (p.expense / max) * 150;
          return (
            <div key={p.month} className="group flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="flex h-[152px] w-full items-end justify-center gap-1.5">
                <div
                  className="relative h-full w-full max-w-[22px] overflow-hidden rounded-t-[3px]"
                  title={`Income ${formatMoney(p.income, currency, locale)}`}
                >
                  <div
                    className="absolute inset-x-0 bottom-0 h-full origin-bottom rounded-t-[3px] bg-brand transition-transform duration-700 ease-out motion-reduce:transition-none"
                    style={{
                      transform: `scaleY(${grown ? Math.max((incomeH / 150), p.income > 0 ? 0.02 : 0) : 0})`,
                      transitionDelay: `${i * 45}ms`
                    }}
                  />
                </div>
                <div
                  className="relative h-full w-full max-w-[22px] overflow-hidden rounded-t-[3px]"
                  title={`Expenses ${formatMoney(p.expense, currency, locale)}`}
                >
                  <div
                    className="absolute inset-x-0 bottom-0 h-full origin-bottom rounded-t-[3px] bg-ink3/60 transition-transform duration-700 ease-out group-hover:bg-neg/70 motion-reduce:transition-none"
                    style={{
                      transform: `scaleY(${grown ? Math.max((expenseH / 150), p.expense > 0 ? 0.02 : 0) : 0})`,
                      transitionDelay: `${i * 45 + 60}ms`
                    }}
                  />
                </div>
              </div>
              <span className="text-[11px] font-medium text-ink3">{p.label}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-5 border-t border-line pt-3 text-xs text-ink2">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-[2px] bg-brand" /> Income
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-[2px] bg-ink3/60" /> Expenses
        </span>
      </div>
    </div>
  );
}
