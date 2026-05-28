import { parseFeatureKey } from "@/lib/parse-feature-key"
import type { GlossaryEntry } from "@/app/admin/patients/actions"

export type FeatureLabel = {
  short: string
  full: string
}

const DEFAULT_MAX_LEN = 28

export function buildFeatureLabel(
  rawKey: string,
  glossary?: Record<string, GlossaryEntry>,
  maxLen: number = DEFAULT_MAX_LEN,
): FeatureLabel {
  const parsed = parseFeatureKey(rawKey)
  const entry = glossary?.[parsed.feature]

  const baseName = entry?.label ?? parsed.feature
  const fullName = parsed.condition
    ? `${baseName} (${parsed.condition})`
    : baseName

  if (fullName.length <= maxLen) {
    return { short: fullName, full: fullName }
  }

  const truncated = truncatePreservingSuffix(fullName, maxLen)
  return { short: truncated, full: fullName }
}

function truncatePreservingSuffix(fullName: string, maxLen: number): string {
  const parenMatch = fullName.match(/^(.+?)(\s*\([^()]+\))$/)
  if (parenMatch) {
    let [, base, suffix] = parenMatch

    const innerParen = base.match(/^(.+?)\s*\([^()]+\)\s*$/)
    if (innerParen && base.length + suffix.length > maxLen) {
      base = innerParen[1]
    }

    const available = maxLen - suffix.length - 1
    if (available > 4) {
      const trimmedBase =
        base.length > available ? base.slice(0, available).trimEnd() + "…" : base
      return `${trimmedBase}${suffix}`
    }
  }

  return fullName.slice(0, maxLen - 1) + "…"
}

export function dedupeShortLabels<T extends { shortLabel: string }>(
  rows: T[],
): void {
  const counts = new Map<string, number>()
  for (const row of rows) {
    const count = counts.get(row.shortLabel) ?? 0
    if (count > 0) row.shortLabel = `${row.shortLabel} #${count + 1}`
    counts.set(row.shortLabel, count + 1)
  }
}