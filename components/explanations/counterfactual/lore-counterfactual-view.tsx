import { CounterfactualView } from "./internal/counterfactual-view"
import type { CounterfactualViewProps } from "./internal/types"

export function LoreCounterfactualView(
  props: Omit<CounterfactualViewProps, "method">,
) {
  return <CounterfactualView {...props} method="lore_counterfactual" />
}