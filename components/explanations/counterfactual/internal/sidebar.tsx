import {
  MethodSidebar,
  MethodSidebarSection,
} from "../../shared/method-sidebar"
import { HorizonChips } from "./horizon-chips"
import { getMethodExplanation } from "./method-copy"
import type { ModelType } from "./types"

const SIDE_T = {
  en: {
    horizonLabel: "Time horizon",
    horizonNote: "The counterfactual is generated separately for each horizon, so the suggested changes may differ.",
    howToRead: "How to read this",
    howToReadBody: "The left column is this patient now. The right column is the alternative profile the model would predict differently for. Differences are highlighted; everything else is identical.",
    features: (n: number) => `${n} feature${n === 1 ? "" : "s"} differ between the two profiles.`,
    implausible: (n: number) => `⚠ ${n} implausible value${n === 1 ? "" : "s"}`,
    implausibleBody: "Some counterfactual values fall outside clinical ranges. These are shown for transparency — they reflect what the model would need to see, not what is achievable.",
    condorNote: "Numeric features are shown as standardized scores (z-scores) rather than raw clinical units, because that is the form the CONDOR model operates on.",
    disclaimer: "A counterfactual shows what the model would need to see — not a recommendation. Whether these changes are clinically plausible or achievable is a separate question.",
  },
  nl: {
    horizonLabel: "Tijdshorizon",
    horizonNote: "Het contrafactisch profiel wordt per horizon apart gegenereerd, dus de voorgestelde wijzigingen kunnen verschillen.",
    howToRead: "Hoe dit te lezen",
    howToReadBody: "De linkerkolom toont deze patiënt nu. De rechterkolom toont het alternatieve profiel waarvoor het model een andere uitkomst zou voorspellen. Verschillen zijn gemarkeerd; al het andere is identiek.",
    features: (n: number) => `${n} kenmerk${n === 1 ? "" : "en"} verschil${n === 1 ? "t" : "len"} tussen de twee profielen.`,
    implausible: (n: number) => `⚠ ${n} onwaarschijnlijke waarde${n === 1 ? "" : "n"}`,
    implausibleBody: "Sommige contrafactische waarden vallen buiten klinische bereiken. Deze worden getoond voor transparantie — ze weerspiegelen wat het model nodig zou hebben, niet wat haalbaar is.",
    condorNote: "Numerieke kenmerken worden getoond als gestandaardiseerde scores (z-scores) in plaats van ruwe klinische eenheden, omdat dit de vorm is waarop het CONDOR-model werkt.",
    disclaimer: "Een contrafactisch profiel toont wat het model nodig zou hebben — geen aanbeveling. Of deze wijzigingen klinisch plausibel of haalbaar zijn, is een andere vraag.",
  },
} as const;

export function Sidebar({
  method,
  modelType,
  changedCount,
  implausibleCount,
  horizons,
  activeHorizon,
  onSelectHorizon,
  locale = "en",
}: {
  method: string
  modelType: ModelType
  changedCount: number
  implausibleCount: number
  horizons: string[]
  activeHorizon: string
  onSelectHorizon: (h: string) => void
  locale?: string
}) {
  const t = SIDE_T[locale as keyof typeof SIDE_T] ?? SIDE_T.en;
  const explanation = getMethodExplanation(method, locale)
  const showHorizons = horizons.length > 1

  return (
    <MethodSidebar
      title={explanation.title}
      description={explanation.description}
      locale={locale}
    >
      {showHorizons && (
        <MethodSidebarSection label={t.horizonLabel}>
          <HorizonChips
            horizons={horizons}
            active={activeHorizon}
            onSelect={onSelectHorizon}
          />
          <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
            {t.horizonNote}
          </p>
        </MethodSidebarSection>
      )}

      <MethodSidebarSection label={t.howToRead}>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {t.howToReadBody}
        </p>
        <p className="text-[11px] text-muted-foreground pt-1">
          <span className="font-mono font-medium">{changedCount}</span>{" "}
          {t.features(changedCount)}
        </p>
      </MethodSidebarSection>

      {implausibleCount > 0 && (
        <MethodSidebarSection>
          <p className="text-[10px] uppercase tracking-wide text-amber-700 dark:text-amber-400">
            {t.implausible(implausibleCount)}
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {t.implausibleBody}
          </p>
        </MethodSidebarSection>
      )}

      {modelType === "condor" && (
        <MethodSidebarSection>
          <p className="text-[11px] text-muted-foreground leading-relaxed italic">
            {t.condorNote}
          </p>
        </MethodSidebarSection>
      )}

      <MethodSidebarSection>
        <p className="text-[10px] text-muted-foreground leading-relaxed italic">
          {t.disclaimer}
        </p>
      </MethodSidebarSection>
    </MethodSidebar>
  )
}