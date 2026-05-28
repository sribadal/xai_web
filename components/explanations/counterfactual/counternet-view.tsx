import { CounterfactualView } from "./internal/counterfactual-view"
import type { CounterfactualViewProps } from "./internal/types"

export function CounterNetView(props: Omit<CounterfactualViewProps, "method">) {
  return <CounterfactualView {...props} method="counternet" />
}