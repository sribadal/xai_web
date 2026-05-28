import {
  MethodSidebar,
  MethodSidebarSection,
} from "../../shared/method-sidebar"
import { FILTER_MODES } from "./card-sections"
import { HorizonChips } from "./horizon-chips"
import { getMethodExplanation } from "./method-copy"
import type { ModelType } from "./types"

export function Sidebar({
  method,
  modelType,
  changedCount,
  implausibleCount,
  currentFilter,
  horizons,
  activeHorizon,
  onSelectHorizon,
}: {
  method: string
  modelType: ModelType
  changedCount: number
  implausibleCount: number
  currentFilter: (typeof FILTER_MODES)[number]
  horizons: string[]
  activeHorizon: string
  onSelectHorizon: (h: string) => void
}) {
  const explanation = getMethodExplanation(method)
  const showHorizons = horizons.length > 1

  return (
    <MethodSidebar
      title={explanation.title}
      description={explanation.description}
    >
      {showHorizons && (
        <MethodSidebarSection label="Time horizon">
          <HorizonChips
            horizons={horizons}
            active={activeHorizon}
            onSelect={onSelectHorizon}
          />
          <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
            The counterfactual is generated separately for each horizon, so the
            suggested changes may differ.
          </p>
        </MethodSidebarSection>
      )}

      <MethodSidebarSection label="How to read this">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          The left card is this patient now. The right card is the alternative
          patient the model would predict differently for. Differences are
          highlighted; everything else is identical between the two.
        </p>
      </MethodSidebarSection>

      <MethodSidebarSection label={`Filter: ${currentFilter.label}`}>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {currentFilter.description}
        </p>
        <p className="text-[11px] text-muted-foreground pt-1">
          <span className="font-mono font-medium">{changedCount}</span> feature
          {changedCount === 1 ? "" : "s"} differ between the two profiles.
        </p>
      </MethodSidebarSection>

      {implausibleCount > 0 && (
        <MethodSidebarSection>
          <p className="text-[10px] uppercase tracking-wide text-amber-700 dark:text-amber-400">
            ⚠ {implausibleCount} implausible value
            {implausibleCount === 1 ? "" : "s"}
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Some counterfactual values fall outside clinical ranges. These are
            shown for transparency — they reflect what the model would need to
            see, not what is achievable.
          </p>
        </MethodSidebarSection>
      )}

      {modelType === "condor" && (
        <MethodSidebarSection>
          <p className="text-[11px] text-muted-foreground leading-relaxed italic">
            Numeric features are shown as standardized scores (z-scores) rather
            than raw clinical units, because that is the form the CONDOR model
            operates on.
          </p>
        </MethodSidebarSection>
      )}

      <MethodSidebarSection>
        <p className="text-[10px] text-muted-foreground leading-relaxed italic">
          A counterfactual shows what the model would need to see — not a
          recommendation. Whether these changes are clinically plausible or
          achievable is a separate question.
        </p>
      </MethodSidebarSection>
    </MethodSidebar>
  )
}