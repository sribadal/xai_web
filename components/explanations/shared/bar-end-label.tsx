import { formatBarLabel } from "./formatters"

type BarEndLabelProps = {
  x?: number
  y?: number
  width?: number
  height?: number
  value?: number | unknown
}

type RendererConfig = {
  maxAbs: number
  unit: string
  colorFor: (value: number) => string
}

const HORIZONTAL_PADDING = 6
const ESTIMATED_CHAR_WIDTH = 6
const FONT_SIZE = 10
const MONO_FAMILY = "ui-monospace, SFMono-Regular, Menlo, monospace"

/**
 * Builds a recharts <LabelList content={...}> renderer that places the
 * value label either inside the bar (in white) or just past the bar end
 * (in the bar's own color) depending on whether it fits.
 *
 * Designed for horizontal bar charts with a centered ReferenceLine at 0
 * (bars can extend either direction).
 */
export function makeBarEndLabelRenderer({
  maxAbs,
  unit,
  colorFor,
}: RendererConfig) {
  return function BarEndLabel(props: BarEndLabelProps) {
    const { x, y, width, height, value } = props
    if (
      typeof x !== "number" ||
      typeof y !== "number" ||
      typeof width !== "number" ||
      typeof height !== "number" ||
      typeof value !== "number"
    ) {
      return null
    }

    const text = formatBarLabel(value, maxAbs, unit)
    if (!text) return null

    const placement = placeLabel({
      x,
      width,
      text,
    })

    return (
      <g style={{ pointerEvents: "none" }}>
        <text
          x={placement.x}
          y={y + height / 2}
          textAnchor={placement.anchor}
          dominantBaseline="middle"
          fontSize={FONT_SIZE}
          fontFamily={MONO_FAMILY}
          style={{
            fill: placement.fitsInside ? "#ffffff" : colorFor(value),
            fontWeight: placement.fitsInside ? 500 : 400,
          }}
        >
          {text}
        </text>
      </g>
    )
  }
}

type LabelPlacement = {
  x: number
  anchor: "start" | "end"
  fitsInside: boolean
}

function placeLabel({
  x,
  width,
  text,
}: {
  x: number
  width: number
  text: string
}): LabelPlacement {
  const outerEnd = x + width
  const isExtendingRight = width >= 0
  const barPixelLength = Math.abs(width)
  const estimatedTextWidth = text.length * ESTIMATED_CHAR_WIDTH
  const fitsInside =
    barPixelLength > estimatedTextWidth + HORIZONTAL_PADDING * 2

  if (fitsInside) {
    return {
      x: isExtendingRight
        ? outerEnd - HORIZONTAL_PADDING
        : outerEnd + HORIZONTAL_PADDING,
      anchor: isExtendingRight ? "end" : "start",
      fitsInside: true,
    }
  }

  return {
    x: isExtendingRight
      ? outerEnd + HORIZONTAL_PADDING
      : outerEnd - HORIZONTAL_PADDING,
    anchor: isExtendingRight ? "start" : "end",
    fitsInside: false,
  }
}