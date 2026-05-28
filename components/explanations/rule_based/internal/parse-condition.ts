import type { ParsedCondition } from "./types";

export function parseCondition(cond: string): ParsedCondition {
  const match = cond.match(/^(.+?)\s*(<=|>=|<|>|==|!=|=)\s*(.+)$/);
  if (match) {
    return {
      feature: match[1].trim(),
      operator: match[2].trim(),
      value: match[3].trim(),
      raw: cond,
    };
  }
  return { feature: cond, operator: "", value: "", raw: cond };
}