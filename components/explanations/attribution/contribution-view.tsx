"use client"

import { useMemo, useState } from "react"
import { filterInternalLimeKeys } from "@/lib/feature-filters"
import { getDirectionLabels } from "../shared/colors"
import {
  MethodSidebar,
  MethodSidebarSection,
} from "../shared/method-sidebar"
import {
  DEFAULT_TOP_N_OPTIONS,
  TopNSelector,
} from "../shared/top-n-selector"
import { buildAttributionRows } from "./build-rows"
import { ContributionChart } from "./internal/contribution-chart"
import { ContributionLegend } from "./internal/contribution-legend"
import { HorizonChips } from "./internal/horizon-chips"
import { HorizonLensNote } from "./internal/horizon-lens-note"
import { getMethodExplanation } from "./internal/method-copy"
import { transformContributionValue } from "./internal/scale"
import type { ContributionViewProps } from "./internal/types"
import { useHorizonLens } from "./internal/use-horizon-lens"

type Props = ContributionViewProps & {
  /** The method id used to look up sidebar copy ("lime" / "deep_lift" / ...). */
  method: string
}

const DEFAULT_TOP_N = 10

export function ContributionView({
  method,
  content,
  horizonContents,
  glossary,
  featureValues,
  modelType,
  prediction,
  timeHorizon,
  topN = DEFAULT_TOP_N,
  showTopNSelector = false,
  topNOptions = DEFAULT_TOP_N_OPTIONS,
  showHorizonChips = true,
}: Props) {
  const [visibleCount, setVisibleCount] = useState(topN)

  const filteredContent = useMemo(
    () => filterInternalLimeKeys(content),
    [content],
  )

  const filteredHorizonContents = useMemo(() => {
    if (!horizonContents) return undefined
    const out: Record<string, Record<string, number>> = {}
    for (const [h, c] of Object.entries(horizonContents)) {
      out[h] = filterInternalLimeKeys(c)
    }
    return out
  }, [horizonContents])

  const horizonState = useHorizonLens({
    horizonContents: filteredHorizonContents,
    timeHorizon,
  })

  const effectiveHorizonContents = useMemo(() => {
    if (modelType !== "condor" || !filteredHorizonContents)
      return filteredHorizonContents
    const active = horizonState.effectiveSortHorizon
    if (!active || !filteredHorizonContents[active])
      return filteredHorizonContents
    return { [active]: filteredHorizonContents[active] }
  }, [modelType, filteredHorizonContents, horizonState.effectiveSortHorizon])

  if (Object.keys(filteredContent).length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No attribution data</p>
    )
  }

  const scaleMode = "raw"
  const effectiveHazardFactor = 1
  const rows = buildAttributionRows({
    content: filteredContent,
    horizonContents: effectiveHorizonContents,
    sortHorizon: horizonState.effectiveSortHorizon,
    plottedHorizons: horizonState.plottedHorizons,
    topN: visibleCount,
    transform: (v) =>
      transformContributionValue(v, scaleMode, effectiveHazardFactor),
  })

  const direction = getDirectionLabels(modelType, timeHorizon)
  const explanation = getMethodExplanation(method, modelType)

  const hasNegativeAcrossRows = horizonState.isOverlay
    ? rows.some((r) => Object.values(r.byHorizon).some((v) => v < 0))
    : rows.some((r) => r.value < 0)

  const totalAvailable = Object.keys(filteredContent).length

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0 space-y-3">
        {showHorizonChips && horizonState.allChipHorizons.length > 1 && (
          <HorizonChips
            horizons={horizonState.allChipHorizons}
            lens={horizonState.lens}
            highlightedHorizon={horizonState.effectiveSortHorizon}
            onChipClick={horizonState.handleChipClick}
          />
        )}

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            Top {rows.length} feature{rows.length !== 1 ? "s" : ""}
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

        <ContributionChart
          rows={rows}
          plottedHorizons={horizonState.plottedHorizons}
          activeHorizon={horizonState.effectiveSortHorizon}
          isOverlay={modelType === "condor" ? false : horizonState.isOverlay}
          goodSign={direction.goodSign}
          glossary={glossary}
          featureValues={featureValues}
        />
      </div>

      <MethodSidebar
        title={explanation.title}
        description={explanation.description}
      >
        <MethodSidebarSection>
          <ContributionLegend
            hasNegative={hasNegativeAcrossRows}
            direction={direction}
          />
        </MethodSidebarSection>

        {showHorizonChips && horizonState.allChipHorizons.length > 1 && (
          <MethodSidebarSection>
            <HorizonLensNote
              lens={horizonState.lens}
              highlightedHorizon={horizonState.effectiveSortHorizon}
            />
          </MethodSidebarSection>
        )}
      </MethodSidebar>
    </div>
  )
}