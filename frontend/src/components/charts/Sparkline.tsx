interface SparklineProps {
  values: number[];
  className?: string;
}

export function Sparkline({ values, className = "" }: SparklineProps) {
  if (values.length < 2) return null;

  const W = 180;
  const H = 56;
  const max = Math.max(...values, 1);
  const step = W / (values.length - 1);
  const points = values.map((v, i) => {
    const x = i * step;
    const y = H - 4 - (v / max) * (H - 10);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = `M${points.join(" L")}`;
  const area = `${line} L${W},${H} L0,${H} Z`;
  const lastX = W;
  const lastY = H - 4 - (values[values.length - 1] / max) * (H - 10);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <linearGradient id="bx-spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#bx-spark)" className="animate-fade-in" />
      <path
        d={line}
        fill="none"
        stroke="#10B981"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="600"
        className="animate-draw-in"
      />
      <circle cx={lastX - 2} cy={lastY} r="3" fill="#10B981" />
    </svg>
  );
}
