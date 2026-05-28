"use client"

import { DeepLiftView } from "./deep-lift-view"
import { IntegratedGradientsView } from "./integrated-gradients-view"
import { LimeView } from "./lime-view"
import { MinimalDepthView } from "./minimal-depth-view"
import { PermutationView } from "./permutation-view"
import type {
  AttributionBaseProps,
  ContributionViewProps,
} from "./internal/types"

export type AttributionViewProps = ContributionViewProps & {
  method: string
}

export function AttributionView({ method, ...rest }: AttributionViewProps) {
  switch (method) {
    case "lime":
      return <LimeView {...rest} />
    case "integrated_gradients":
      return <IntegratedGradientsView {...rest} />
    case "deep_lift":
      return <DeepLiftView {...rest} />
    case "permutation":
      return <PermutationView {...(rest as AttributionBaseProps)} />
    case "minimal_depth":
      return <MinimalDepthView {...(rest as AttributionBaseProps)} />
    default:
      return <LimeView {...rest} />
  }
}