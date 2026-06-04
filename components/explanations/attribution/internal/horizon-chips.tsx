"use client"

import { horizonLabel, HORIZON_CUMULATIVE } from "./horizons"

export type HorizonLens = "cumulative" | "probability"

const T = {
  en: {
    horizon: "Horizon",
    cumulativeHint: "click a month to compare on the % scale",
    probabilityHint: "click another month to bring it forward",
    cumulativeTitle: "Show cumulative hazard attributions (separate scale)",
    highlightTitle: (h: string) => `Highlight ${h} attributions`,
  },
  nl: {
    horizon: "Horizon",
    cumulativeHint: "klik op een maand om op de %-schaal te vergelijken",
    probabilityHint: "klik op een andere maand om deze naar voren te brengen",
    cumulativeTitle: "Toon cumulatief-risico-attributies (aparte schaal)",
    highlightTitle: (h: string) => `Markeer ${h} attributies`,
  },
} as const;

type Props = {
  locale?: string
  horizons: string[]
  lens: HorizonLens
  highlightedHorizon: string
  onChipClick: (horizon: string) => void
}

export function HorizonChips({
  horizons,
  lens,
  highlightedHorizon,
  onChipClick,
  locale = "en",
}: Props) {
  if (horizons.length <= 1) return null
  const t = T[locale as keyof typeof T] ?? T.en;

  return (
    <div className="flex items-center gap-2 flex-wrap pb-1">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
        {t.horizon}
      </span>
      {horizons.map((h, idx) => {
        const showDivider = needsDivider(horizons, idx)
        return (
          <div key={h} className="flex items-center gap-2">
            {showDivider && (
              <span aria-hidden className="h-4 w-px bg-border/80 mx-0.5" />
            )}
            <HorizonChip
              horizon={h}
              lens={lens}
              highlightedHorizon={highlightedHorizon}
              onClick={() => onChipClick(h)}
              locale={locale}
            />
          </div>
        )
      })}
      <span className="text-[10px] text-muted-foreground/70 ml-1">
        ·{" "}
        {lens === "cumulative" ? t.cumulativeHint : t.probabilityHint}
      </span>
    </div>
  )
}

function needsDivider(horizons: string[], idx: number): boolean {
  if (idx === 0) return false
  const current = horizons[idx]
  const previous = horizons[idx - 1]
  const currentIsCumulative = current === HORIZON_CUMULATIVE
  const previousIsCumulative = previous === HORIZON_CUMULATIVE
  return currentIsCumulative !== previousIsCumulative
}

function HorizonChip({
  horizon,
  lens,
  highlightedHorizon,
  onClick,
  locale = "en",
}: {
  horizon: string
  lens: HorizonLens
  highlightedHorizon: string
  onClick: () => void
  locale?: string
}) {
  const t = T[locale as keyof typeof T] ?? T.en;
  const isCumulative = horizon === HORIZON_CUMULATIVE
  const isInLens =
    (isCumulative && lens === "cumulative") ||
    (!isCumulative && lens === "probability")
  const isActive =
    (isCumulative && lens === "cumulative") ||
    (!isCumulative && lens === "probability" && horizon === highlightedHorizon)

  const className = `group flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-all ${
    isActive
      ? "border-foreground/50 bg-foreground/10 text-foreground font-medium"
      : isInLens
        ? "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
        : "border-border/40 text-muted-foreground/70 hover:border-border hover:text-foreground"
  }`

  const title = isCumulative
    ? t.cumulativeTitle
    : t.highlightTitle(horizonLabel(horizon))

  return (
    <button onClick={onClick} className={className} title={title}>
      <span
        className="inline-block w-2 h-2 rounded-full"
        style={{
          background: isActive ? "currentColor" : "hsl(var(--muted-foreground))",
          opacity: isActive ? 1 : isInLens ? 0.5 : 0.3,
        }}
      />
      {horizonLabel(horizon)}
    </button>
  )
}