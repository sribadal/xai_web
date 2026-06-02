import type { GlossaryEntry } from "@/app/admin/patients/actions";

export function resolveOrdinalLabels(
  feature: string,
  operator: string,
  threshold: number,
  glossary?: Record<string, GlossaryEntry>,
): string[] | null {
  const entry = glossary?.[feature];
  if (!entry?.valueMap) return null;
  if (!Number.isFinite(threshold)) return null;

  const vm = entry.valueMap;
  const validKeys = Object.keys(vm)
    .map(Number)
    .filter((k) => Number.isFinite(k))
    .sort((a, b) => a - b);

  if (validKeys.length === 0) return null;

  let matchingKeys: number[];

  switch (operator) {
    case "<=":
      matchingKeys = validKeys.filter((k) => k <= Math.floor(threshold));
      break;

    case "<":
      matchingKeys = validKeys.filter((k) => k < Math.ceil(threshold));
      break;

    case ">=":
      matchingKeys = validKeys.filter((k) => k >= Math.ceil(threshold));
      break;

    case ">":
      matchingKeys = validKeys.filter((k) => k > Math.floor(threshold));
      break;

    case "==":
    case "=": {
      const rounded = Math.round(threshold);
      const label = vm[String(rounded)];
      return label ? [label] : null;
    }

    case "!=": {
      const excluded = Math.round(threshold);
      matchingKeys = validKeys.filter((k) => k !== excluded);
      break;
    }

    default:
      return null;
  }

  if (matchingKeys.length === 0) return null;
  if (matchingKeys.length === validKeys.length) return null;

  return matchingKeys.map((k) => vm[String(k)]);
}

export function formatLabelList(
  labels: string[],
  conjunction: string = "or",
): string {
  if (labels.length === 0) return "";
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} ${conjunction} ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, ${conjunction} ${labels[labels.length - 1]}`;
}