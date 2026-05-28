import { CounterfactualView } from "./internal/counterfactual-view"
import type { CounterfactualViewProps } from "./internal/types"

export function WachterView(props: Omit<CounterfactualViewProps, "method">) {
  return <CounterfactualView {...props} method="wachter" />
}