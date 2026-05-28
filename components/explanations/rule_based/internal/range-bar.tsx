"use client";

import { getRangeForFeature } from "./feature-ranges";

export function RangeBar({
  operator,
  value,
  feature,
}: {
  operator: string;
  value: string;
  feature: string;
}) {
  const numVal = parseFloat(value);
  if (isNaN(numVal)) return null;

  const knownRange = getRangeForFeature(feature);
  if (!knownRange) return null;

  const [min, max] = knownRange;
  if (numVal < min || numVal > max * 1.1) return null;

  const span = max - min || 1;
  const pct = Math.min(Math.max(((numVal - min) / span) * 100, 0), 100);

  const fillStyle =
    operator === "<=" || operator === "<"
      ? { left: "0%", width: `${pct}%` }
      : { left: `${pct}%`, width: `${100 - pct}%` };

  return (
    <div className="mt-1.5 space-y-0.5">
      <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="absolute h-full rounded-full bg-blue-400/60 dark:bg-blue-500/50"
          style={fillStyle}
        />
        <div
          className="absolute top-0 h-full w-px bg-foreground/40"
          style={{ left: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[9px] text-muted-foreground/60 font-mono">
        <span>{min}</span>
        <span className="text-foreground/50">{numVal}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}