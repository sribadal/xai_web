"use client"

import { ContributionView } from "./contribution-view"
import type { ContributionViewProps } from "./internal/types"

export function LimeView(props: ContributionViewProps) {
  return <ContributionView {...props} method="lime" />
}