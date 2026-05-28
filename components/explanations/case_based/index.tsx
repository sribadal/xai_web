import { CaseBasedView as CaseBasedViewImpl } from "./internal/case-based-view"
import type { CaseBasedViewProps } from "./internal/types"
import { EmbeddingView } from "./embedding-view"
import { KnnView } from "./knn-view"
import { PrototypeView } from "./prototype-view"

export function CaseBasedView(props: CaseBasedViewProps) {
  switch (props.method) {
    case "knn":
      return <KnnView {...props} />
    case "embedding":
      return <EmbeddingView {...props} />
    case "prototype":
      return <PrototypeView {...props} />
    default:
      return <CaseBasedViewImpl {...props} />
  }
}

export { EmbeddingView, KnnView, PrototypeView }
export type { CaseBasedViewProps }