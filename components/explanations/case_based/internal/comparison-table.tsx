"use client"

import { useMemo, useState } from "react"
import { buildFeatureLabel } from "@/components/explanations/shared/labels"
import type { GlossaryEntry } from "@/app/admin/patients/actions"
import { compareValues, formatVal, resolveDisplayValue } from "./helpers"
import type { CaseRecord } from "./types"

type Props = {
  cases: CaseRecord[]
  queryFeatures: Record<string, unknown>
  queryRawFeatures?: Record<string, unknown>
  glossary?: Record<string, GlossaryEntry>
  caseLabelPrefix?: string
}

export function ComparisonTable({
  cases,
  queryFeatures,
  queryRawFeatures,
  glossary,
  caseLabelPrefix = "Case",
}: Props) {
  const [showOnlyDiffering, setShowOnlyDiffering] = useState(true)

  const allFeatureCols = useMemo(() => {
    const set = new Set<string>()
    for (const k of Object.keys(queryFeatures)) {
      if (!k.startsWith("_")) set.add(k)
    }
    for (const c of cases) {
      for (const k of Object.keys(c)) {
        if (!k.startsWith("_")) set.add(k)
      }
    }
    return [...set].sort()
  }, [queryFeatures, cases])

  const rows = useMemo(() => {
    return allFeatureCols.map((col) => {
      const qv = queryFeatures[col]
      const caseVals = cases.map((c) => c[col])
      const anyDiffer = caseVals.some((cv) => compareValues(qv, cv) !== "same")
      return { col, qv, caseVals, anyDiffer }
    })
  }, [allFeatureCols, cases, queryFeatures])

  const visibleRows = showOnlyDiffering ? rows.filter((r) => r.anyDiffer) : rows

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          Comparative analysis — {visibleRows.length} of {rows.length} feature
          {rows.length !== 1 ? "s" : ""}
        </p>
        <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={showOnlyDiffering}
            onChange={(e) => setShowOnlyDiffering(e.target.checked)}
            className="h-3 w-3 cursor-pointer"
          />
          Show only differing features
        </label>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
            <tr className="border-b">
              <th className="text-left p-2 font-medium min-w-[180px]">
                Feature
              </th>
              <th className="text-right p-2 font-medium bg-emerald-50/40 dark:bg-emerald-900/10 border-l border-r border-border/40">
                This patient
              </th>
              {cases.map((_, i) => (
                <th
                  key={i}
                  className="text-right p-2 font-medium border-r border-border/40 last:border-r-0"
                >
                  {caseLabelPrefix} {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 ? (
              <tr>
                <td
                  colSpan={cases.length + 2}
                  className="p-4 text-center text-muted-foreground italic"
                >
                  No differing features
                </td>
              </tr>
            ) : (
              visibleRows.map(({ col, qv, caseVals }) => {
                const labels = buildFeatureLabel(col, glossary, 30)
                const queryDisplay = resolveDisplayValue(
                  col,
                  queryFeatures,
                  queryRawFeatures,
                )
                return (
                  <tr
                    key={col}
                    className="border-b last:border-0 hover:bg-muted/30"
                  >
                    <td
                      className="p-2 text-muted-foreground"
                      title={labels.full}
                    >
                      {labels.short}
                    </td>
                    <td className="p-2 text-right font-mono bg-emerald-50/40 dark:bg-emerald-900/10 border-l border-r border-border/40 font-medium">
                      {formatVal(queryDisplay)}
                    </td>
                    {caseVals.map((cv, i) => {
                      const cmp = compareValues(qv, cv)
                      const cls =
                        cmp === "higher"
                          ? "text-blue-600 dark:text-blue-400"
                          : cmp === "lower"
                            ? "text-orange-600 dark:text-orange-400"
                            : cmp === "different"
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-muted-foreground"
                      const weight =
                        cmp !== "same" && cmp !== "missing" ? "font-medium" : ""
                      return (
                        <td
                          key={i}
                          className={`p-2 text-right font-mono border-r border-border/40 last:border-r-0 ${cls} ${weight}`}
                        >
                          {formatVal(cv)}
                        </td>
                      )
                    })}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}