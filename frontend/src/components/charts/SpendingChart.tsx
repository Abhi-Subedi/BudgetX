"use client";

import { useMemo, useState } from "react";

import { formatMoney } from "../../lib/format";
import type { SpendingPoint } from "../../types";

interface Props {
  series: SpendingPoint[];
  currency: string;
  locale?: string;
}

const W = 720;
const H = 260;
const PAD_X = 8;
const PAD_TOP = 14;
const PAD_BOTTOM = 26;

function buildPath(points: Array<{ x: number; y: number }>): string {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}

export function SpendingChart({ series, currency, locale = "en-US" }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  const geometry = useMemo(() => {
    if (series.length < 2) return null;
    const maxVal = Math.max(...series.map((p) => Math.max(p.current, p.previous)), 100);
    const niceMax = maxVal * 1.08;
    const innerW = W - PAD_X * 2;
    const innerH = H - PAD_TOP - PAD_BOTTOM;
    const toXY = (value: number, idx: number) => ({
      x: PAD_X + (idx / (series.length - 1)) * innerW,
      y: PAD_TOP + innerH - (value / niceMax) * innerH
    });
    const currentPts = series.map((s, i) => toXY(s.current, i));
    const prevPts = series.map((s, i) => toXY(Math.min(s.previous, niceMax), i));
    return { currentPts, prevPts, niceMax, innerH, innerW };
  }, [series]);

  if (!geometry) return null;

  const { currentPts, prevPts, niceMax, innerH } = geometry;
  const baseline = H - PAD_BOTTOM;

  const areaCurrent = `${buildPath(currentPts)} L${currentPts[currentPts.length - 1].x},${baseline} L${currentPts[0].x},${baseline} Z`;
  const linePrev = buildPath(prevPts.slice(0, Math.max(1, Math.min(prevPts.length, currentPts.length))));

  const gridLines = [0.25, 0.5, 0.75, 1].map((f) => ({
    y: baseline - f * innerH,
    value: niceMax * f
  }));

  const activeIdx = hover !== null ? hover : null;
  const activePoint = activeIdx !== null ? series[activeIdx] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`Cumulative spending this month compared with last month`}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const relX = ((e.clientX - rect.left) / rect.width) * W;
          const ratio = (relX - PAD_X) / (W - PAD_X * 2);
          const idx = Math.round(ratio * (series.length - 1));
          setHover(Math.max(0, Math.min(series.length - 1, idx)));
        }}
      >
        <defs>
          <linearGradient id="bx-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {gridLines.map((g, i) => (
          <g key={i}>
            <line x1={PAD_X} x2={W - PAD_X} y1={g.y} y2={g.y} stroke="#233046" strokeWidth="1" strokeDasharray="1 4" />
          </g>
        ))}

        {reducedMotion ? (
          <>
            <path d={areaCurrent} fill="url(#bx-area)" />
            <path d={buildPath(currentPts)} fill="none" stroke="#10B981" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
            <path d={linePrev} fill="none" stroke="#64748B" strokeWidth="1.6" strokeDasharray="3 4" strokeLinecap="round" />
          </>
        ) : (
          <>
            <path d={areaCurrent} fill="url(#bx-area)" className="animate-fade-in" />
            <path
              d={buildPath(currentPts)}
              fill="none"
              stroke="#10B981"
              strokeWidth="2.4"
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray="1200"
              className="animate-draw-in"
            />
            <path d={linePrev} fill="none" stroke="#64748B" strokeWidth="1.6" strokeDasharray="3 4" strokeLinecap="round" className="animate-fade-in" />
          </>
        )}

        {activePoint && activeIdx !== null ? (
          <g>
            <line x1={currentPts[activeIdx].x} x2={currentPts[activeIdx].x} y1={PAD_TOP} y2={baseline} stroke="#10B981" strokeWidth="1" opacity="0.35" />
            <circle cx={currentPts[activeIdx].x} cy={currentPts[activeIdx].y} r="4.5" fill="#10B981" stroke="#0B1120" strokeWidth="2" />
          </g>
        ) : null}

        {[1, 7, 14, 21, series.length].filter((d) => d <= series.length).map((d) => {
          const idx = Math.min(d - 1, series.length - 1);
          return (
            <text key={d} x={currentPts[idx]?.x ?? 0} y={H - 8} textAnchor="middle" fontSize="10.5" fill="#64748B">
              Day {d}
            </text>
          );
        })}
      </svg>

      {activePoint ? (
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 rounded-md border border-line bg-sunken px-3 py-1.5 text-xs text-paper shadow-lift">
          <span className="tnum font-semibold">Day {activePoint.day}</span>
          <span className="mx-1.5 text-paper/40">·</span>
          <span className="tnum">{formatMoney(activePoint.current, currency, locale)}</span>
        </div>
      ) : null}
    </div>
  );
}
