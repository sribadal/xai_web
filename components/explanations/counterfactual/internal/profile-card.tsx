import { type Actionability } from "@/lib/feature-actionability"
import { buildRowDetail } from "./build-row-detail"
import { CARD_SECTIONS } from "./card-sections"
import { valuesEqual } from "./labels"
import type {
  CardEntry,
  ChangedFeature,
  EntryPair,
  ModelType,
} from "./types"

function CardRow({
  entry,
  counterpart,
  side,
  implausible,
  implausibleReason,
  modelType,
}: {
  entry: CardEntry
  counterpart: CardEntry
  side: "original" | "counterfactual"
  implausible: boolean
  implausibleReason?: string
  modelType: ModelType
}) {
  const isChanged = !valuesEqual(entry.rawValue, counterpart.rawValue)

  const valueClass = isChanged
    ? side === "counterfactual"
      ? implausible
        ? "text-amber-700 dark:text-amber-400 font-medium"
        : "text-sky-700 dark:text-sky-400 font-medium"
      : "text-foreground font-medium"
    : "text-muted-foreground"

  const labelClass = isChanged ? "text-foreground" : "text-muted-foreground/80"

  const detail = isChanged
    ? buildRowDetail({
        definition: entry.definition,
        feature: entry.feature,
        modelType,
        implausibleReason,
      })
    : null

  return (
    <div
      className={`px-3 py-1.5 text-xs ${isChanged ? "bg-muted/30" : ""}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className={`truncate ${labelClass}`}>{entry.label}</span>
        <span className={`font-mono shrink-0 ${valueClass}`}>
          {entry.displayValue}
          {isChanged && side === "counterfactual" && implausible && (
            <span className="ml-1.5 inline-block text-[9px] uppercase tracking-wide px-1 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              ⚠ implausible
            </span>
          )}
        </span>
      </div>
      {detail && (
        <p className="text-[10px] text-muted-foreground/80 leading-snug mt-0.5 pl-3 border-l border-border/40">
          {detail}
        </p>
      )}
    </div>
  )
}

function CardSection({
  title,
  entries,
  pairs,
  side,
  changedMap,
  modelType,
}: {
  title: string
  entries: CardEntry[]
  pairs: EntryPair[]
  side: "original" | "counterfactual"
  changedMap: Map<string, ChangedFeature>
  modelType: ModelType
}) {
  if (entries.length === 0) return null

  return (
    <div>
      <p className="px-3 py-1 text-[10px] uppercase tracking-wide text-muted-foreground/70 bg-muted/40 border-y border-border/40">
        {title}
      </p>
      <div className="divide-y divide-border/30">
        {entries.map((entry) => {
          const pair = pairs.find((p) => p[side].rawKey === entry.rawKey)!
          const other =
            side === "original" ? pair.counterfactual : pair.original
          const change = changedMap.get(entry.rawKey)
          return (
            <CardRow
              key={entry.rawKey}
              entry={entry}
              counterpart={other}
              side={side}
              implausible={!!change?.implausible}
              implausibleReason={change?.implausibleReason}
              modelType={modelType}
            />
          )
        })}
      </div>
    </div>
  )
}

export function ProfileCard({
  title,
  badge,
  badgeColor,
  pairs,
  side,
  changedMap,
  filterIncludes,
  showOnlyChanged,
  modelType,
}: {
  title: string
  badge: string
  badgeColor: string
  pairs: EntryPair[]
  side: "original" | "counterfactual"
  changedMap: Map<string, ChangedFeature>
  filterIncludes: Set<Actionability>
  showOnlyChanged: boolean
  modelType: ModelType
}) {
  // Pick the right side's entries, then filter by actionability and (optionally)
  // by whether the feature actually differs.
  const entries = pairs
    .map((p) => p[side])
    .filter((e) => filterIncludes.has(e.actionability))
    .filter((e) => !showOnlyChanged || changedMap.has(e.rawKey))

  const bySection = new Map<string, CardEntry[]>()
  for (const section of CARD_SECTIONS) {
    bySection.set(
      section.id,
      entries.filter((e) => section.cats.includes(e.actionability)),
    )
  }

  return (
    <div className="rounded-md border border-border/60 bg-card overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b border-border/40">
        <span className="text-xs font-medium">{title}</span>
        <span
          className={`text-[9px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded ${badgeColor}`}
        >
          {badge}
        </span>
      </div>
      <div className="overflow-y-auto max-h-[600px]">
        {CARD_SECTIONS.map((section) => (
          <CardSection
            key={section.id}
            title={section.label}
            entries={bySection.get(section.id) ?? []}
            pairs={pairs}
            side={side}
            changedMap={changedMap}
            modelType={modelType}
          />
        ))}
        {entries.length === 0 && (
          <p className="px-3 py-6 text-xs text-muted-foreground italic text-center">
            No features in this filter.
          </p>
        )}
      </div>
    </div>
  )
}