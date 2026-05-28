import { CaseBasedView } from "./internal/case-based-view"
import type { CaseBasedViewProps } from "./internal/types"

export function KnnView(props: Omit<CaseBasedViewProps, "method">) {
  return <CaseBasedView {...props} method="knn" />
}