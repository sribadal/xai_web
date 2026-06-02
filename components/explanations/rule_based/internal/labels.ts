import { parseFeatureKey } from "@/lib/parse-feature-key";
import type { GlossaryEntry } from "@/app/admin/patients/actions";

export function buildLabel(
  rawKey: string,
  glossary?: Record<string, GlossaryEntry>,
): {
  label: string;
  definition?: string;
  valueMap?: Record<string, string>;
  raw: string;
} {
  const parsed = parseFeatureKey(rawKey);
  const entry = glossary?.[parsed.feature];
  const baseName = entry?.label ?? parsed.feature;
  const label = parsed.condition
    ? `${baseName} (${parsed.condition})`
    : baseName;
  return {
    label,
    definition: entry?.definition,
    valueMap: entry?.valueMap,
    raw: rawKey,
  };
}