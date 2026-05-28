"use client"

import { ImportanceView } from "./internal/importance-view"
import type { AttributionBaseProps } from "./internal/types"

export function PermutationView(props: AttributionBaseProps) {
  return <ImportanceView {...props} method="permutation" />
}