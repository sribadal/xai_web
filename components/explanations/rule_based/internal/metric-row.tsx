"use client";

export function MetricRow({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description?: string;
}) {
  const isPercentage = value <= 1;
  const pct = value * 100;
  const colorClass = isPercentage
    ? pct >= 90
      ? "text-emerald-600 dark:text-emerald-400"
      : pct >= 70
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400"
    : "text-foreground";

  return (
    <div className="space-y-1" title={description}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={`text-xs font-mono font-medium ${colorClass}`}>
          {isPercentage ? `${pct.toFixed(1)}%` : value.toFixed(3)}
        </span>
      </div>
      {isPercentage && (
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              pct >= 90
                ? "bg-emerald-500"
                : pct >= 70
                  ? "bg-amber-500"
                  : "bg-red-500"
            }`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      )}
      {description && (
        <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}