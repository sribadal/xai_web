import { horizonLabel } from "./horizons"
import type { HorizonLens } from "./horizon-chips"

const T = {
  en: {
    cumulativeTitle: "Cumulative hazard",
    comparingTitle: "Comparing horizons",
    cumulativeBody:
      "Showing cumulative-hazard attributions on their own scale. The 3/6/12-month horizons live on a different (probability) scale and would be invisible if overlaid here — click a month chip to switch to that view.",
    comparingBody: (h: string) =>
      `All probability horizons share the same percentage-point scale, so they can be overlaid. The active horizon (${h}) is at full opacity; the others are faded. Click a chip to bring a different horizon forward and re-sort.`,
  },
  nl: {
    cumulativeTitle: "Cumulatief risico",
    comparingTitle: "Horizonten vergelijken",
    cumulativeBody:
      "Toont cumulatief-risico-attributies op hun eigen schaal. De 3/6/12-maanden horizonten gebruiken een andere (kans)schaal en zouden onzichtbaar zijn bij overlay — klik op een maandchip om naar die weergave te schakelen.",
    comparingBody: (h: string) =>
      `Alle kans-horizonten delen dezelfde procentpuntschaal en kunnen over elkaar worden gelegd. De actieve horizon (${h}) heeft volledige dekking; de andere zijn vervaagd. Klik op een chip om een andere horizon naar voren te brengen en opnieuw te sorteren.`,
  },
} as const;

type Props = {
  lens: HorizonLens
  highlightedHorizon: string
  locale?: string
}

export function HorizonLensNote({ lens, highlightedHorizon, locale = "en" }: Props) {
  const t = T[locale as keyof typeof T] ?? T.en;

  return (
    <>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
        {lens === "cumulative" ? t.cumulativeTitle : t.comparingTitle}
      </p>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        {lens === "cumulative"
          ? t.cumulativeBody
          : t.comparingBody(horizonLabel(highlightedHorizon))}
      </p>
    </>
  );
}