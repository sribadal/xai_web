import { CaseBasedView } from "./internal/case-based-view"
import type { CaseBasedViewProps } from "./internal/types"

export function EmbeddingView(props: Omit<CaseBasedViewProps, "method">) {
  return <CaseBasedView {...props} method="embedding" />
}