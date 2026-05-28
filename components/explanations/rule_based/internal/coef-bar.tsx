"use client";

export function CoefBar({
  coef,
  maxAbsCoef,
}: {
  coef: number;
  maxAbsCoef: number;
}) {
  const safeMax = maxAbsCoef > 0 ? maxAbsCoef : 1;
  const widthPct = Math.min(100, (Math.abs(coef) / safeMax) * 100);
  const isNegative = coef < 0;

  return (
    <div
      className="relative h-1 w-full rounded-full bg-muted/60 overflow-hidden"
      title={`weight ${coef >= 0 ? "+" : ""}${coef.toFixed(3)}`}
    >
      <div
        className={`absolute top-0 left-0 h-full ${
          isNegative ? "bg-emerald-500/70" : "bg-red-500/70"
        }`}
        style={{ width: `${widthPct}%` }}
      />
    </div>
  );
}