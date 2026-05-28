"use client"

import { useMemo, useState } from "react"
import { HORIZON_CUMULATIVE, sortHorizons } from "./horizons"
import type { HorizonLens } from "./horizon-chips"

type Args = {
  horizonContents?: Record<string, Record<string, number>>
  timeHorizon: string | null | undefined
}

type ResolvedHorizons = {
  allChipHorizons: string[]
  probabilityHorizons: string[]
  hasCumulative: boolean
  hasProbability: boolean
}

type Result = ResolvedHorizons & {
  lens: HorizonLens
  highlightedHorizon: string
  effectiveSortHorizon: string
  plottedHorizons: string[]
  isOverlay: boolean
  handleChipClick: (horizon: string) => void
}

export function useHorizonLens({
  horizonContents,
  timeHorizon,
}: Args): Result {
  const activeHorizon = timeHorizon ?? HORIZON_CUMULATIVE

  const horizonResolution = useMemo<ResolvedHorizons>(() => {
    const available = horizonContents ? Object.keys(horizonContents) : []
    const probabilityHorizons = sortHorizons(
      available.filter((h) => h !== HORIZON_CUMULATIVE),
    )
    const hasCumulative = available.includes(HORIZON_CUMULATIVE)
    const hasProbability = probabilityHorizons.length > 0

    const allChipHorizons: string[] = []
    if (hasCumulative) allChipHorizons.push(HORIZON_CUMULATIVE)
    allChipHorizons.push(...probabilityHorizons)

    return {
      allChipHorizons,
      probabilityHorizons,
      hasCumulative,
      hasProbability,
    }
  }, [horizonContents])

  const initialLens: HorizonLens =
    activeHorizon === HORIZON_CUMULATIVE ? "cumulative" : "probability"
  const [lens, setLens] = useState<HorizonLens>(initialLens)

  const initialHighlight =
    activeHorizon === HORIZON_CUMULATIVE && horizonResolution.hasProbability
      ? horizonResolution.probabilityHorizons[0]
      : activeHorizon
  const [highlightedHorizon, setHighlightedHorizon] =
    useState<string>(initialHighlight)

  const plottedHorizons: string[] =
    lens === "cumulative" ? [HORIZON_CUMULATIVE] : horizonResolution.probabilityHorizons

  const effectiveSortHorizon =
    lens === "cumulative"
      ? HORIZON_CUMULATIVE
      : plottedHorizons.includes(highlightedHorizon)
        ? highlightedHorizon
        : (plottedHorizons[0] ?? activeHorizon)

  const isOverlay =
    !!horizonContents &&
    lens === "probability" &&
    horizonResolution.probabilityHorizons.length > 1

  function handleChipClick(horizon: string) {
    if (horizon === HORIZON_CUMULATIVE) {
      setLens("cumulative")
    } else {
      setLens("probability")
      setHighlightedHorizon(horizon)
    }
  }

  return {
    ...horizonResolution,
    lens,
    highlightedHorizon,
    effectiveSortHorizon,
    plottedHorizons,
    isOverlay,
    handleChipClick,
  }
}