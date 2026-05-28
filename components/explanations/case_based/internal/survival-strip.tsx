"use client"

import type { SurvivalHorizons } from "./patient-summary"

type Props = {
  horizons: SurvivalHorizons
  label?: string
}

function fmtPct(p: number | null): string {
  if (p === null) return "—"
  return `${Math.round(p * 100)}%`
}

export function SurvivalStrip({ horizons, label = "Predicted survival" }: Props) {
  const entries: { months: string; value: number | null }[] = [
    { months: "3mo", value: horizons.three },
    { months: "6mo", value: horizons.six },
    { months: "12mo", value: horizons.twelve },
  ].filter((e) => e.value !== null)

  if (entries.length === 0) return null

  return (
    <div className="px-3 py-1.5 bg-sky-50/50 dark:bg-sky-900/10 border-b border-border/40">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide mr-2">
        {label}
      </span>
      <span className="text-xs font-mono">
        {entries.map((e, i) => (
          <span key={e.months}>
            {i > 0 && <span className="text-muted-foreground"> · </span>}
            <span className="font-medium">{fmtPct(e.value)}</span>
            <span className="text-muted-foreground"> at {e.months}</span>
          </span>
        ))}
      </span>
    </div>
  )
}