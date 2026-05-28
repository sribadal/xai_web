"use client"

import { parseFeatureKey } from "@/lib/parse-feature-key"
import type { GlossaryEntry } from "@/app/admin/patients/actions"
import { formatVal } from "./helpers"
import type { DiffRow } from "./types"

type Props = {
  active?: boolean
  payload?: { payload: DiffRow }[]
  glossary?: Record<string, GlossaryEntry>
}

export function DiffTooltip({ active, payload, glossary }: Props) {
  if (!active || !payload?.length) return null
  const { fullLabel, diff, queryVal, caseVal, rawKey } = payload[0].payload
  const parsed = parseFeatureKey(rawKey)
  const entry = glossary?.[parsed.feature]

  return (
    <div className="rounded-md border bg-popover px-3 py-2 shadow-md max-w-[280px]">
      <p className="text-xs font-medium">{fullLabel}</p>
      <div className="mt-1.5 space-y-0.5">
        <div className="flex justify-between gap-4 text-xs">
          <span className="text-muted-foreground">This patient</span>
          <span className="font-mono">{formatVal(queryVal)}</span>
        </div>
        <div className="flex justify-between gap-4 text-xs">
          <span className="text-muted-foreground">Selected case</span>
          <span className="font-mono">{formatVal(caseVal)}</span>
        </div>
        <div className="flex justify-between gap-4 text-xs border-t border-border/40 pt-1 mt-1">
          <span className="text-muted-foreground">Difference</span>
          <span className="font-mono font-medium">
            {diff > 0 ? "+" : ""}
            {formatVal(diff)}
          </span>
        </div>
      </div>
      {entry?.definition && (
        <p className="text-[11px] text-muted-foreground mt-1.5 pt-1.5 border-t border-border/40 leading-relaxed">
          {entry.definition}
        </p>
      )}
    </div>
  )
}