import { horizonLabel } from "./horizons"
import type { HorizonLens } from "./horizon-chips"

type Props = {
  lens: HorizonLens
  highlightedHorizon: string
}

export function HorizonLensNote({ lens, highlightedHorizon }: Props) {
  return (
    <>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
        {lens === "cumulative" ? "Cumulative hazard" : "Comparing horizons"}
      </p>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        {lens === "cumulative"
          ? "Showing cumulative-hazard attributions on their own scale. The 3/6/12-month horizons live on a different (probability) scale and would be invisible if overlaid here — click a month chip to switch to that view."
          : `All probability horizons share the same percentage-point scale, so they can be overlaid. The active horizon (${horizonLabel(highlightedHorizon)}) is at full opacity; the others are faded. Click a chip to bring a different horizon forward and re-sort.`}
      </p>
    </>
  )
}