export type ParsedFeature = {
  feature: string
  condition: string | null
  raw: string
}

const DOUBLE_BOUND = /^(-?[\d.]+)\s*<\s*(\w+)\s*<=\s*(-?[\d.]+)$/
const UPPER_BOUND_LT = /^(\w+)\s*<=?\s*(-?[\d.]+)$/
const UPPER_BOUND_GT = /^(\w+)\s*>=?\s*(-?[\d.]+)$/
const LOWER_BOUND_LT = /^(-?[\d.]+)\s*<=?\s*(\w+)$/
const LOWER_BOUND_GT = /^(-?[\d.]+)\s*>=?\s*(\w+)$/

function formatNum(s: string): string {
  const n = parseFloat(s)
  if (Number.isInteger(n)) return n.toString()
  return n.toFixed(1)
}

export function parseFeatureKey(key: string): ParsedFeature {
  let match: RegExpMatchArray | null

  match = key.match(DOUBLE_BOUND)
  if (match) {
    return {
      feature: match[2],
      condition: `${formatNum(match[1])}–${formatNum(match[3])}`,
      raw: key,
    }
  }

  match = key.match(/^(\w+)\s*(<)(=?)\s*(-?[\d.]+)$/)
  if (match) {
    const op = match[3] ? "≤" : "<"
    return {
      feature: match[1],
      condition: `${op} ${formatNum(match[4])}`,
      raw: key,
    }
  }

  match = key.match(/^(\w+)\s*(>)(=?)\s*(-?[\d.]+)$/)
  if (match) {
    const op = match[3] ? "≥" : ">"
    return {
      feature: match[1],
      condition: `${op} ${formatNum(match[4])}`,
      raw: key,
    }
  }

  match = key.match(/^(-?[\d.]+)\s*(<)(=?)\s*(\w+)$/)
  if (match) {
    const op = match[3] ? "≥" : ">"
    return {
      feature: match[4],
      condition: `${op} ${formatNum(match[1])}`,
      raw: key,
    }
  }

  match = key.match(/^(-?[\d.]+)\s*(>)(=?)\s*(\w+)$/)
  if (match) {
    const op = match[3] ? "≤" : "<"
    return {
      feature: match[4],
      condition: `${op} ${formatNum(match[1])}`,
      raw: key,
    }
  }

  return {
    feature: key,
    condition: null,
    raw: key,
  }
}