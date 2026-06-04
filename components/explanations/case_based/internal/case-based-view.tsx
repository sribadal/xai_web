"use client"

import { useMemo } from "react"
import {
  filterInternalCaseRecord,
  filterInternalFeatures,
} from "@/lib/feature-filters"
import { SideBySideView } from "./side-by-side-view"
import type {
  CaseBasedViewProps,
  CaseRecord,
  PrototypeContent,
} from "./types"

function isPrototypeContent(content: unknown): content is PrototypeContent {
  return (
    typeof content === "object" &&
    content !== null &&
    !Array.isArray(content) &&
    "similar_prototypes" in content
  )
}

export function CaseBasedView({
  content,
  method,
  features,
  featuresRaw,
  prediction,
  glossary,
  timeHorizon,
}: CaseBasedViewProps) {
  const filteredFeatures = useMemo(
    () => filterInternalFeatures(features),
    [features],
  )
  const filteredFeaturesRaw = useMemo(
    () =>
      featuresRaw
        ? filterInternalCaseRecord(featuresRaw as Record<string, unknown>)
        : undefined,
    [featuresRaw],
  )

  if (!content) {
    return <p className="text-sm text-muted-foreground">No data</p>
  }

  if (isPrototypeContent(content)) {
    const filteredPrototypes = content.similar_prototypes.map(
      (p) => filterInternalCaseRecord(p) as CaseRecord,
    )
    return (
      <SideBySideView
        cases={filteredPrototypes}
        queryFeatures={filteredFeatures}
        queryRawFeatures={filteredFeaturesRaw}
        queryPrediction={prediction}
        method={method}
        glossary={glossary}
        isPrototype
        timeHorizon={timeHorizon}
      />
    )
  }

  if (Array.isArray(content)) {
    const filteredCases = (content as CaseRecord[]).map(
      (c) => filterInternalCaseRecord(c) as CaseRecord,
    )
    return (
      <SideBySideView
        cases={filteredCases}
        queryFeatures={filteredFeatures}
        queryRawFeatures={filteredFeaturesRaw}
        queryPrediction={prediction}
        method={method}
        glossary={glossary}
        timeHorizon={timeHorizon}
      />
    )
  }

  return <p className="text-sm text-muted-foreground">Unexpected data shape</p>
}