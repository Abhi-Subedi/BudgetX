"use client";

import { PageHeader } from "../components/layout/AppShell";
import { ProgressBar } from "../components/ui/Controls";
import { Icon } from "../components/icons";
import { ErrorState, Skeleton } from "../components/ui/States";
import { useResource } from "../hooks/useResource";

interface HealthResponse {
  overall_score: number;
  dimensions: Record<string, number>;
  insights: string[];
}

const SCORE_RING_COLOR = (pct: number) =>
  pct >= 80 ? "text-pos" : pct >= 60 ? "text-warn" : "text-neg";

const DIMENSION_TONE = (pct: number) =>
  pct >= 80 ? "pos" : pct >= 60 ? "warn" : "neg";

export default function HealthScorePage() {
  const healthRes = useResource<HealthResponse>("/health/score");

  if (healthRes.error) return <ErrorState message={healthRes.error} onRetry={healthRes.reload} />;

  return (
    <div>
      <PageHeader
        title="Financial Health"
        subtitle="Your overall financial wellness at a glance."
      />

      {healthRes.loading || !healthRes.data ? (
        <div className="space-y-5">
          <Skeleton className="h-64 rounded-2xl" />
          <div className="grid gap-5 sm:grid-cols-2">
            {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
        </div>
      ) : (
        <HealthBody data={healthRes.data} />
      )}
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const pct = score;
  const colorClass = SCORE_RING_COLOR(pct);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg width="140" height="140" viewBox="0 0 120 120" className="-rotate-90">
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-sunken"
          />
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={`${colorClass} transition-all duration-1000 ease-out`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`tnum font-display text-4xl font-extrabold ${colorClass}`}>{score}</span>
          <span className="text-xs text-ink3">/ 100</span>
        </div>
      </div>
      <p className="text-center text-sm text-ink2">
        {pct >= 80 ? "Your finances are in great shape!" :
         pct >= 60 ? "Room for improvement — see below." :
         "Some areas need attention. Keep reading for tips."}
      </p>
    </div>
  );
}

function HealthBody({ data }: { data: HealthResponse }) {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-line bg-surface p-8">
        <ScoreRing score={data.overall_score} />
      </section>

      <section>
        <h2 className="mb-4 font-display text-[15px] font-bold tracking-tight text-white">Dimension Breakdown</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(data.dimensions).map(([key, value]) => {
            const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
            const tone = DIMENSION_TONE(value);
            return (
              <div
                key={key}
                className="rounded-2xl border border-line bg-surface p-5 transition-colors duration-200 hover:border-ink3/40"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-ink2">{label}</span>
                  <span className={`tnum text-sm font-bold ${tone === "pos" ? "text-pos" : tone === "warn" ? "text-warn" : "text-neg"}`}>
                    {value}
                  </span>
                </div>
                <ProgressBar pct={value} tone={tone === "pos" ? "brand" : tone === "warn" ? "warn" : "neg"} height="h-1.5" />
              </div>
            );
          })}
        </div>
      </section>

      {data.insights.length > 0 && (
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="mb-3 font-display text-[15px] font-bold tracking-tight text-white">Insights</h2>
          <ul className="space-y-3">
            {data.insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-brand/15 text-brand">
                  <Icon name="spark" className="size-3.5" />
                </span>
                <span className="text-[13px] leading-relaxed text-ink2">{insight}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
