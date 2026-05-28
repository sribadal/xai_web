import type { RuleBasedMessages } from "@/lib/rule-based-i18n";

export function operatorToWords(op: string, m: RuleBasedMessages): string {
  switch (op) {
    case "<=": return m.operators.lte;
    case ">=": return m.operators.gte;
    case "<":  return m.operators.lt;
    case ">":  return m.operators.gt;
    case "=":
    case "==": return m.operators.eq;
    case "!=": return m.operators.neq;
    default:   return op;
  }
}