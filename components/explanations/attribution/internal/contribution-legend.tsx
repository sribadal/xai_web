import { COLOR_BAD, COLOR_GOOD, COLOR_NEUTRAL } from "../../shared/colors"
import { LegendSwatch } from "../../shared/method-sidebar"
import type { DirectionLabels } from "../../shared/colors"

type Props = {
  hasNegative: boolean
  direction: DirectionLabels
}

export function ContributionLegend({ hasNegative, direction }: Props) {
  if (!hasNegative) {
    return (
      <LegendSwatch
        color={COLOR_NEUTRAL}
        label="Higher = more important"
      />
    )
  }

  const positiveColor = direction.goodSign === 1 ? COLOR_GOOD : COLOR_BAD
  const negativeColor = direction.goodSign === 1 ? COLOR_BAD : COLOR_GOOD

  return (
    <>
      <LegendSwatch color={positiveColor} label={direction.positiveLabel} />
      <LegendSwatch color={negativeColor} label={direction.negativeLabel} />
    </>
  )
}