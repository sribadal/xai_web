"use client"

import { ContributionView } from "./contribution-view"
import type { ContributionViewProps } from "./internal/types"

export function DeepLiftView(props: ContributionViewProps) {
  return <ContributionView {...props} method="deep_lift" />
}