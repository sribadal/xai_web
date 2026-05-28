"use client"

import { ImportanceView } from "./internal/importance-view"
import type { AttributionBaseProps } from "./internal/types"

export function MinimalDepthView(props: AttributionBaseProps) {
  return <ImportanceView {...props} method="minimal_depth" />
}