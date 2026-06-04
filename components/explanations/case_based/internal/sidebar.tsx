"use client"

import {
  LegendSwatch,
  MethodSidebar,
  MethodSidebarSection,
} from "@/components/explanations/shared/method-sidebar"
import { getMethodCopy } from "./method-copy"

const SIDE_T = {
  en: {
    legend: "Legend",
    matchLabel: "Values matching the current patient",
    differLabel: "Values differing from the current patient",
    prototypeNote:
      "Prototypes are real patients selected as cluster representatives. The number of patients each prototype stands for, plus its observed risk, indicate how strong the analogy is.",
    similarNote:
      "Similar cases are retrieved using pre-treatment information only. Similarity reflects model-weighted feature proximity, not clinical equivalence.",
  },
  nl: {
    legend: "Legenda",
    matchLabel: "Waarden die overeenkomen met de huidige patiënt",
    differLabel: "Waarden die afwijken van de huidige patiënt",
    prototypeNote:
      "Prototypen zijn echte patiënten geselecteerd als clustervertegenwoordigers. Het aantal patiënten dat elk prototype vertegenwoordigt, plus het waargenomen risico, geven aan hoe sterk de analogie is.",
    similarNote:
      "Vergelijkbare patiënten worden opgehaald op basis van kenmerken vóór behandeling. Gelijkenis weerspiegelt modelgewogen nabijheid van kenmerken, geen klinische equivalentie.",
  },
} as const;

type Props = {
  method: string
  isPrototype: boolean
  locale?: string
}

export function Sidebar({ method, isPrototype, locale = "en" }: Props) {
  const t = SIDE_T[locale as keyof typeof SIDE_T] ?? SIDE_T.en;
  const copy = getMethodCopy(method, locale)

  return (
    <MethodSidebar title={copy.title} description={copy.description} locale={locale}>
      <MethodSidebarSection label={t.legend}>
        <LegendSwatch color="#10b981" label={t.matchLabel} />
        <LegendSwatch color="#f59e0b" label={t.differLabel} />
      </MethodSidebarSection>
      <MethodSidebarSection>
        <p className="text-[10px] text-muted-foreground leading-relaxed italic">
          {isPrototype ? t.prototypeNote : t.similarNote}
        </p>
      </MethodSidebarSection>
    </MethodSidebar>
  )
}