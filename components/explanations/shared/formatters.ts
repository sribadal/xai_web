function pickDigits(maxAbs: number): number {
  if (maxAbs === 0) return 2
  if (maxAbs >= 100) return 0
  if (maxAbs >= 10) return 1
  if (maxAbs >= 1) return 2
  if (maxAbs >= 0.01) return 3
  return -1
}

export function makeTickFormatter(
  maxAbs: number,
  hasNegative: boolean,
  unit: string = "",
): (v: number) => string {
  const digits = pickDigits(maxAbs)

  return (v: number) => {
    const body = digits >= 0 ? v.toFixed(digits) : v.toExponential(1)
    const formatted = `${body}${unit}`
    if (!hasNegative) return formatted
    return v >= 0 ? `+${formatted}` : formatted
  }
}

export function formatTooltipValue(
  v: number,
  maxAbs: number,
  unit: string = "",
): string {
  const sign = v >= 0 ? "+" : ""
  if (maxAbs >= 100) return `${sign}${v.toFixed(1)}${unit}`
  if (maxAbs >= 10) return `${sign}${v.toFixed(2)}${unit}`
  if (maxAbs >= 1) return `${sign}${v.toFixed(3)}${unit}`
  if (maxAbs >= 0.01) return `${sign}${v.toFixed(4)}${unit}`
  return `${sign}${v.toExponential(2)}${unit}`
}

/**
 * Compact label for the end of a bar. Returns "" for zero/non-finite
 * values so callers can skip rendering.
 */
export function formatBarLabel(
  v: number,
  maxAbs: number,
  unit: string,
): string {
  if (!isFinite(v) || v === 0) return ""

  const sign = v > 0 ? "+" : "−"
  const absValue = Math.abs(v)

  let body: string
  if (maxAbs >= 100) body = absValue.toFixed(0)
  else if (maxAbs >= 10) body = absValue.toFixed(1)
  else if (maxAbs >= 1) body = absValue.toFixed(2)
  else if (maxAbs >= 0.01) body = absValue.toFixed(3)
  else body = absValue.toExponential(1)

  return `${sign}${body}${unit}`
}