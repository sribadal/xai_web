"use client"

import type { CaseRecord } from "./types"
import { getSimilarity } from "./helpers"

type Props = {
  cases: CaseRecord[]
  selectedIdx: number
  onSelect: (idx: number) => void
  caseLabelPrefix: string
}

export function CaseSelector({
  cases,
  selectedIdx,
  onSelect,
  caseLabelPrefix,
}: Props) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-muted-foreground">Compare to:</span>
      <div className="flex rounded-md border border-border overflow-hidden">
        {cases.map((c, i) => {
          const sim = getSimilarity(c)
          return (
            <button
              key={i}
              onClick={() => onSelect(i)}
              className={`px-2.5 py-1 text-[10px] font-mono transition-colors ${
                selectedIdx === i
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              }`}
            >
              {caseLabelPrefix} {i + 1}
              {sim !== null && (
                <span className="ml-1 opacity-70">
                  ({(sim * 100).toFixed(0)}%)
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}