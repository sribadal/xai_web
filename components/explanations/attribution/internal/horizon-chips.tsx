"use client"

import { horizonLabel, HORIZON_CUMULATIVE } from "./horizons"

export type HorizonLens = "cumulative" | "probability"

type Props = {
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
}: Props) {
  if (horizons.length <= 1) return null

  return (
    <div className="flex items-center gap-2 flex-wrap pb-1">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
        Horizon
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
            />
          </div>
        )
      })}

      <span className="text-[10px] text-muted-foreground/70 ml-1">
        ·{" "}
        {lens === "cumulative"
          ? "click a month to compare on the % scale"
          : "click another month to bring it forward"}
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
}: {
  horizon: string
  lens: HorizonLens
  highlightedHorizon: string
  onClick: () => void
}) {
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
    ? "Show cumulative hazard attributions (separate scale)"
    : `Highlight ${horizonLabel(horizon)} attributions`

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