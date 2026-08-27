import { formatMoney } from "../../lib/format";
import type { CategorySlice } from "../../types";

const SIZE = 190;
const STROKE = 26;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

export function CategoryDonut({
  slices,
  currency,
  locale = "en-US"
}: {
  slices: CategorySlice[];
  currency: string;
  locale?: string;
}) {
  const total = slices.reduce((sum, s) => sum + s.amount, 0);
  if (!slices.length || total <= 0) return null;

  let offset = 0;
  const arcs = slices.slice(0, 8).map((slice) => {
    const frac = slice.amount / total;
    const dash = frac * C;
    const arc = { ...slice, dash, offset, gap: C - dash };
    offset += dash;
    return arc;
  });

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label="Spending by category">
        <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
          {arcs.map((arc) => (
            <circle
              key={arc.name}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke={arc.color}
              strokeWidth={STROKE}
              strokeDasharray={`${Math.max(arc.dash - 2.5, 0)} ${arc.gap}`}
              strokeLinecap="butt"
              className="animate-fade-in"
            />
          ))}
        </g>
        <text x="50%" y="47%" textAnchor="middle" fontSize="11" fill="#64748B" fontWeight="600" letterSpacing="1">
          SPENT
        </text>
        <text x="50%" y="59%" textAnchor="middle" fontSize="17" fill="#F1F5F9" fontWeight="700" className="tnum">
          {formatMoney(total, currency, locale)}
        </text>
      </svg>

      <ul className="w-full min-w-0 flex-1 space-y-2.5">
        {arcs.map((arc) => (
          <li key={arc.name} className="flex items-center gap-3 text-sm">
            <span className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: arc.color }} />
            <span className="min-w-0 flex-1 truncate">{arc.name}</span>
            <span className="tnum text-ink2">{formatMoney(arc.amount, currency, locale)}</span>
            <span className="tnum w-10 text-right text-xs text-ink3">{Math.round(arc.pct)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
