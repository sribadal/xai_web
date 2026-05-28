"use client"

import { useMemo, useState } from "react"
import {
  filterInternalCaseRecord,
  filterInternalFeatures,
} from "@/lib/feature-filters"
import { buildEntries } from "./build-entries"
import { CARD_SECTIONS, FILTER_MODES } from "./card-sections"
import { ExactValuesTable } from "./exact-values-table"
import { FilterChips } from "./filter-chips"
import { HORIZON_CUMULATIVE, sortHorizons } from "./horizons"
import { valuesEqual } from "./labels"
import { PredictionHeadline } from "./prediction-headline"
import {
  extractPatientPrediction,
  resolveScale,
} from "./scale"
import { Sidebar } from "./sidebar"
import type {
  ChangedFeature,
  CounterfactualViewProps,
  EntryPair,
  FilterMode,
} from "./types"

export function CounterfactualView({
  content,
  metadata,
  features,
  featuresRaw,
  method,
  modelType = "rsf",
  prediction,
  timeHorizon,
  glossary,
  horizonContents,
}: CounterfactualViewProps) {
  const [filterMode, setFilterMode] = useState<FilterMode>("clinical")
  const [showOnlyChanged, setShowOnlyChanged] = useState(false)

  const availableHorizons = useMemo(
    () => (horizonContents ? sortHorizons(Object.keys(horizonContents)) : []),
    [horizonContents],
  )

  const initialHorizon = timeHorizon ?? HORIZON_CUMULATIVE
  const [activeHorizon, setActiveHorizon] = useState<string>(initialHorizon)

  const effectiveHorizon =
    availableHorizons.length > 0 && !availableHorizons.includes(activeHorizon)
      ? availableHorizons[0]
      : activeHorizon

  const horizonEntry = horizonContents?.[effectiveHorizon]
  const effectiveContent = horizonEntry?.content ?? content
  const effectiveMetadata = horizonEntry?.metadata ?? metadata

  const filteredContent = useMemo(
    () => filterInternalFeatures(effectiveContent),
    [effectiveContent],
  )
  const filteredFeatures = useMemo(
    () => filterInternalCaseRecord(features as Record<string, unknown>),
    [features],
  )
  const filteredFeaturesRaw = useMemo(
    () =>
      featuresRaw
        ? filterInternalCaseRecord(featuresRaw as Record<string, unknown>)
        : undefined,
    [featuresRaw],
  )

  const rawQueryRaw = effectiveMetadata?.raw_query as
    | Record<string, unknown>
    | undefined
    | null
  const rawCfRaw = effectiveMetadata?.raw_cf as
    | Record<string, unknown>
    | undefined
    | null
  const rawQuery = rawQueryRaw
    ? filterInternalCaseRecord(rawQueryRaw)
    : undefined
  const rawCf = rawCfRaw ? filterInternalCaseRecord(rawCfRaw) : undefined

  const cfDf = effectiveMetadata?.counterfactual_df as
    | Record<string, unknown>[]
    | undefined
    | null
  const cfRow = cfDf?.[0]
    ? filterInternalCaseRecord(cfDf[0] as Record<string, unknown>)
    : undefined

  const scale = resolveScale(modelType, effectiveHorizon)

  const originalPrediction: number | null =
    effectiveMetadata?.original_prediction != null
      ? Number(effectiveMetadata.original_prediction)
      : extractPatientPrediction(prediction, scale, effectiveHorizon)

  const cfPrediction: number | null =
    effectiveMetadata?.cf_prediction != null
      ? Number(effectiveMetadata.cf_prediction)
      : null

  const { pairs, changed } = useMemo(
    () =>
      buildEntries({
        content: filteredContent,
        originalFeatures: filteredFeatures,
        originalFeaturesRaw: filteredFeaturesRaw,
        rawQuery,
        rawCf,
        cfRow,
        modelType,
        glossary,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      filteredContent,
      filteredFeatures,
      filteredFeaturesRaw,
      effectiveMetadata,
      modelType,
      glossary,
    ],
  )

  const changedMap = useMemo(() => {
    const m = new Map<string, ChangedFeature>()
    for (const c of changed) m.set(c.rawKey, c)
    return m
  }, [changed])

  const currentFilter = FILTER_MODES.find((m) => m.id === filterMode)!

  const filterCounts: Record<FilterMode, number> = useMemo(() => {
    const counts: Record<FilterMode, number> = {
      treatment: 0,
      clinical: 0,
      all: 0,
    }
    for (const c of changed) {
      for (const mode of FILTER_MODES) {
        if (mode.includes.has(c.actionability)) counts[mode.id]++
      }
    }
    return counts
  }, [changed])

  const visiblePairs = useMemo(
    () =>
      pairs
        .filter((p) => currentFilter.includes.has(p.original.actionability))
        .filter((p) => !showOnlyChanged || changedMap.has(p.original.rawKey)),
    [pairs, currentFilter, showOnlyChanged, changedMap],
  )

  const pairsBySection = useMemo(() => {
    const map = new Map<string, EntryPair[]>()
    for (const section of CARD_SECTIONS) {
      map.set(
        section.id,
        visiblePairs.filter((p) =>
          section.cats.includes(p.original.actionability),
        ),
      )
    }
    return map
  }, [visiblePairs])

  const visibleChanged = changed.filter((c) =>
    currentFilter.includes.has(c.actionability),
  )
  const implausibleCount = visibleChanged.filter((c) => c.implausible).length

  if (Object.keys(filteredContent).length === 0 && !cfRow) {
    return (
      <p className="text-sm text-muted-foreground">No data for this patient</p>
    )
  }

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0 space-y-4">
        <PredictionHeadline
          scale={scale}
          originalPrediction={originalPrediction}
          cfPrediction={cfPrediction}
          changeCount={visibleChanged.length}
        />

        <div className="flex items-center justify-end gap-2 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <FilterChips
              mode={filterMode}
              setMode={setFilterMode}
              counts={filterCounts}
            />
            <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyChanged}
                onChange={(e) => setShowOnlyChanged(e.target.checked)}
                className="h-3 w-3 cursor-pointer"
              />
              Only show differing features
            </label>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border/50 bg-card shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="sticky left-0 z-[1] bg-muted/40 text-left px-3 py-3 text-[10px] uppercase tracking-wide text-muted-foreground font-semibold border-b border-border/60 min-w-[200px]">
                  Feature
                </th>
                <th className="text-left px-3 py-3 border-b border-border/60 border-l border-border/30 min-w-[140px] bg-emerald-50/40 dark:bg-emerald-950/15">
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    This patient
                  </span>
                </th>
                <th className="text-left px-3 py-3 border-b border-border/60 border-l border-border/30 min-w-[160px] bg-sky-50/40 dark:bg-sky-950/15">
                  <span className="text-xs font-semibold text-sky-700 dark:text-sky-400">
                    Alternative profile
                  </span>
                </th>
              </tr>
            </thead>
            {CARD_SECTIONS.map((section) => {
              const sectionPairs = pairsBySection.get(section.id) ?? []
              if (sectionPairs.length === 0) return null
              return (
                <tbody key={section.id}>
                  <tr>
                    <td
                      colSpan={3}
                      className="px-3 py-1.5 text-[10px] uppercase tracking-wide text-muted-foreground/80 bg-muted/40 border-y border-border/40 font-semibold"
                    >
                      {section.label}
                    </td>
                  </tr>
                  {sectionPairs.map((pair, rowIdx) => {
                    const orig = pair.original
                    const cf = pair.counterfactual
                    const isChanged = !valuesEqual(orig.rawValue, cf.rawValue)
                    const changedFeature = changedMap.get(orig.rawKey)
                    const implausible = !!changedFeature?.implausible
                    const implausibleReason = changedFeature?.implausibleReason
                    const isEven = rowIdx % 2 === 0
                    const rowBgClass = isEven ? "bg-background" : "bg-muted/10"

                    return (
                      <tr
                        key={orig.rawKey}
                        className={`${rowBgClass} hover:bg-muted/30 transition-colors group`}
                      >
                        <th
                          scope="row"
                          className={`sticky left-0 z-[1] text-left px-3 py-2 align-top text-[12px] text-foreground font-medium border-b border-border/30 ${rowBgClass} group-hover:bg-muted/30 transition-colors min-w-[200px] max-w-[260px]`}
                        >
                          <span className="block">{orig.label}</span>
                          {orig.definition && (
                            <span className="block text-[10px] text-muted-foreground mt-0.5 font-normal leading-snug">
                              {orig.definition}
                            </span>
                          )}
                        </th>

                        <td className="px-3 py-2 align-top text-[12px] text-foreground border-l border-border/30 border-b border-border/30 font-medium bg-emerald-50/30 dark:bg-emerald-950/10 font-mono">
                          {orig.displayValue}
                        </td>

                        <td
                          className={`px-3 py-2 align-top text-[12px] border-l border-border/30 border-b border-border/30 font-mono ${
                            isChanged
                              ? implausible
                                ? "bg-amber-50 dark:bg-amber-950/30"
                                : "bg-sky-50 dark:bg-sky-950/30"
                              : "bg-sky-50/30 dark:bg-sky-950/10"
                          }`}
                        >
                          <div className="flex items-start gap-1.5 flex-wrap">
                            <span
                              className={
                                isChanged
                                  ? implausible
                                    ? "text-amber-900 font-medium dark:text-amber-200"
                                    : "text-sky-900 font-medium dark:text-sky-200"
                                  : "text-muted-foreground"
                              }
                            >
                              {cf.displayValue}
                            </span>
                            {isChanged && implausible && (
                              <span className="inline-block text-[9px] uppercase tracking-wide px-1 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 font-sans">
                                ⚠ implausible
                              </span>
                            )}
                          </div>
                          {isChanged && implausibleReason && (
                            <span className="block text-[10px] text-muted-foreground/80 mt-0.5 leading-snug font-normal font-sans">
                              {implausibleReason}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              )
            })}
            {visiblePairs.length === 0 && (
              <tbody>
                <tr>
                  <td
                    colSpan={3}
                    className="text-center text-sm text-muted-foreground py-6"
                  >
                    No features match the current filter.
                  </td>
                </tr>
              </tbody>
            )}
          </table>
        </div>

        <p className="text-[10px] text-muted-foreground flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center">
            <span className="inline-block w-3 h-3 rounded-sm bg-sky-50 border border-sky-200 dark:bg-sky-950/30 dark:border-sky-800/40 mr-1.5" />
            Suggested change
          </span>
          <span className="inline-flex items-center">
            <span className="inline-block w-3 h-3 rounded-sm bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/40 mr-1.5" />
            Clinically implausible change
          </span>
        </p>

        <ExactValuesTable changed={visibleChanged} />
      </div>

      <Sidebar
        method={method}
        modelType={modelType}
        changedCount={visibleChanged.length}
        implausibleCount={implausibleCount}
        currentFilter={currentFilter}
        horizons={availableHorizons}
        activeHorizon={effectiveHorizon}
        onSelectHorizon={setActiveHorizon}
      />
    </div>
  )
}