"use client"

import { ContributionView } from "./contribution-view"
import type { ContributionViewProps } from "./internal/types"

export function IntegratedGradientsView(props: ContributionViewProps) {
  return <ContributionView {...props} method="integrated_gradients" />
}