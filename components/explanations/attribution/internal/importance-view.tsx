"use client"

import { useMemo, useState } from "react"
import { filterInternalLimeKeys } from "@/lib/feature-filters"
import {
  MethodSidebar,
  MethodSidebarSection,
} from "../../shared/method-sidebar"
import {
  DEFAULT_TOP_N_OPTIONS,
  TopNSelector,
} from "../../shared/top-n-selector"
import { buildAttributionRows } from "../build-rows"
import { HORIZON_CUMULATIVE } from "./horizons"
import { ImportanceChart } from "./importance-chart"
import { ContributionLegend } from "./contribution-legend"
import { getMethodExplanation } from "./method-copy"
import type { AttributionBaseProps } from "./types"
import { getDirectionLabels } from "../../shared/colors"

type Props = AttributionBaseProps & {
  method: string
}

const DEFAULT_TOP_N = 10

export function ImportanceView({
  method,
  content,
  glossary,
  featureValues,
  modelType,
  topN = DEFAULT_TOP_N,
  showTopNSelector = false,
  topNOptions = DEFAULT_TOP_N_OPTIONS,
}: Props) {
  const [visibleCount, setVisibleCount] = useState(topN)

  const filteredContent = useMemo(
    () => filterInternalLimeKeys(content),
    [content],
  )

  if (Object.keys(filteredContent).length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No attribution data</p>
    )
  }

  const rows = buildAttributionRows({
    content: filteredContent,
    sortHorizon: HORIZON_CUMULATIVE,
    plottedHorizons: [HORIZON_CUMULATIVE],
    topN: visibleCount,
    glossary,
  })

  const direction = getDirectionLabels(modelType, null)
  const explanation = getMethodExplanation(method)
  const totalAvailable = Object.keys(filteredContent).length

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            {method} — top {rows.length} feature{rows.length !== 1 ? "s" : ""}
          </p>

          {showTopNSelector && (
            <TopNSelector
              value={visibleCount}
              onChange={setVisibleCount}
              options={topNOptions}
              maxAvailable={totalAvailable}
            />
          )}
        </div>

        <ImportanceChart
          rows={rows}
          glossary={glossary}
          featureValues={featureValues}
        />
      </div>

      <MethodSidebar
        title={explanation.title}
        description={explanation.description}
      >
        <MethodSidebarSection>
          <ContributionLegend hasNegative={false} direction={direction} />
        </MethodSidebarSection>
      </MethodSidebar>
    </div>
  )
}