import { CounterfactualView } from "./internal/counterfactual-view"
import type { CounterfactualViewProps } from "./internal/types"

export function DiceView(props: Omit<CounterfactualViewProps, "method">) {
  return <CounterfactualView {...props} method="dice" />
}