"use client"

import {
  LegendSwatch,
  MethodSidebar,
  MethodSidebarSection,
} from "@/components/explanations/shared/method-sidebar"
import { COLOR_DECREASE, COLOR_INCREASE } from "./diff-chart"
import { getMethodCopy } from "./method-copy"

type Props = {
  method: string
  isPrototype: boolean
}

export function Sidebar({ method, isPrototype }: Props) {
  const copy = getMethodCopy(method)

  return (
    <MethodSidebar title={copy.title} description={copy.description}>
      <MethodSidebarSection label="Legend">
        <LegendSwatch color={COLOR_INCREASE} label="Higher in similar case" />
        <LegendSwatch color={COLOR_DECREASE} label="Lower in similar case" />
        <LegendSwatch color="#f59e0b" label="Categorical difference" />
      </MethodSidebarSection>

      <MethodSidebarSection>
        <p className="text-[10px] text-muted-foreground leading-relaxed italic">
          {isPrototype
            ? "Prototypes are real patients selected as cluster representatives. The number of patients each prototype stands for, plus its observed risk, indicate how strong the analogy is."
            : "Similar cases are retrieved using pre-treatment information only. Similarity reflects model-weighted feature proximity, not clinical equivalence."}
        </p>
      </MethodSidebarSection>
    </MethodSidebar>
  )
}