import type { ParsedCondition } from "./types";

export function parseCondition(cond: string): ParsedCondition {
  const match = cond.match(
    /^(.+?)\s*(<=|>=|≤|≥|<|>|==|!=|≠|=)\s*(.+)$/,
  );
  if (match) {
    const opMap: Record<string, string> = { "≤": "<=", "≥": ">=", "≠": "!=" };
    const operator = opMap[match[2]] ?? match[2];
    return {
      feature: match[1].trim(),
      operator: operator.trim(),
      value: match[3].trim(),
      raw: cond,
    };
  }

  const colonMatch = cond.match(/^(.+?)\s*:\s*(.+)$/);
  if (colonMatch) {
    return {
      feature: colonMatch[1].trim(),
      operator: "==",
      value: colonMatch[2].trim(),
      raw: cond,
    };
  }

  return { feature: cond, operator: "", value: "", raw: cond };
}