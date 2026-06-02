"use client"
import {
  LegendSwatch,
  MethodSidebar,
  MethodSidebarSection,
} from "@/components/explanations/shared/method-sidebar"
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
        <LegendSwatch color="#10b981" label="Values matching the current patient" />
        <LegendSwatch color="#f59e0b" label="Values differing from the current patient" />
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