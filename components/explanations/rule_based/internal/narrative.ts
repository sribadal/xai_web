import {
  classifyFeature,
  resolveCategoricalValue,
  isThresholdInScaledSpace,
  scaledDirection,
} from "@/lib/feature-classification";
import type { GlossaryEntry } from "@/app/admin/patients/actions";
import type { RuleBasedMessages } from "@/lib/rule-based-i18n";
import { buildLabel } from "./labels";
import { operatorToWords } from "./operators";
import { parseCondition } from "./parse-condition";
import type { FiringRule } from "./types";

export function conditionToSentence(
  condition: string,
  glossary: Record<string, GlossaryEntry> | undefined,
  featuresRaw: Record<string, unknown> | null | undefined,
  m: RuleBasedMessages,
): string {
  const { feature, operator, value } = parseCondition(condition);
  if (!operator) return condition;

  const info = buildLabel(feature, glossary);
  const labelLower = info.label.toLowerCase();
  const kind = classifyFeature(feature, glossary);
  const rawValue = featuresRaw?.[feature];
  const threshold = parseFloat(value);

  if (kind === "categorical") {
    const resolution = resolveCategoricalValue(feature, rawValue, glossary);
    if (resolution.kind === "resolved") {
      return `${labelLower}: ${resolution.valueLabel.toLowerCase()}`;
    }
    if (resolution.kind === "missing") {
      return `${labelLower} ${m.condition.notRecorded}`;
    }
    return `${labelLower} ${m.condition.applies}`;
  }

  if (kind === "binary") {
    if (rawValue != null) {
      const present = Number(rawValue) >= 1;
      return `${labelLower} ${present ? m.condition.isPresent : m.condition.isAbsent}`;
    }
    const presentByRule =
      (operator === ">" && threshold < 1) ||
      (operator === ">=" && threshold <= 1) ||
      (operator === "==" && threshold >= 1) ||
      (operator === "!=" && threshold === 0);
    return `${labelLower} ${presentByRule ? m.condition.isPresent : m.condition.isAbsent}`;
  }

  if (isThresholdInScaledSpace(rawValue, threshold)) {
    const dir = scaledDirection(operator, threshold);
    const phrase =
      dir === "below" ? m.condition.belowTypical
      : dir === "above" ? m.condition.aboveTypical
      : m.condition.nearTypical;
    return `${labelLower} ${phrase}`;
  }

  return `${labelLower} ${operatorToWords(operator, m)} ${value}`;
}

export function buildNarrative(
  conditions: string[],
  outcome: string | undefined,
  glossary: Record<string, GlossaryEntry> | undefined,
  featuresRaw: Record<string, unknown> | null | undefined,
  m: RuleBasedMessages,
): string {
  if (conditions.length === 0 && !outcome) return "";

  const fragments = conditions.map((c) =>
    conditionToSentence(c, glossary, featuresRaw, m),
  );
  let narrative = m.narrative.leadIn;

  if (fragments.length === 1) {
    narrative += `${fragments[0]}.`;
  } else if (fragments.length === 2) {
    narrative += `${fragments[0]}${m.narrative.and}${fragments[1]}.`;
  } else {
    const allButLast = fragments.slice(0, -1).join(m.narrative.listSeparator);
    narrative += `${allButLast}${m.narrative.finalAnd}${fragments[fragments.length - 1]}.`;
  }

  if (outcome) narrative += m.narrative.outcomeSuffix(outcome);
  return narrative;
}

export function buildRuleFitNarrative(
  firingRules: FiringRule[],
  outcome: string | undefined,
  glossary: Record<string, GlossaryEntry> | undefined,
  featuresRaw: Record<string, unknown> | null | undefined,
  m: RuleBasedMessages,
): string {
  if (firingRules.length === 0) return "";

  const riskLowering = firingRules.filter((r) => r.coef < 0);
  const riskRaising = firingRules.filter((r) => r.coef >= 0);

  const renderClause = (ruleText: string) =>
    ruleText
      .split(/\s+and\s+/i)
      .map((part) => conditionToSentence(part.trim(), glossary, featuresRaw, m))
      .join(m.narrative.and);

  let narrative = m.narrative.rulefitLeadIn + "\n\n";

  if (riskRaising.length > 0) {
    narrative += m.narrative.riskRaisingHeader + "\n";
    riskRaising.forEach((r) => {
      narrative += m.narrative.rulefitWhen(renderClause(r.rule), "raise") + "\n";
    });
    narrative += "\n";
  }

  if (riskLowering.length > 0) {
    narrative += m.narrative.riskLoweringHeader + "\n";
    riskLowering.forEach((r) => {
      narrative += m.narrative.rulefitWhen(renderClause(r.rule), "lower") + "\n";
    });
    narrative += "\n";
  }

  if (outcome) narrative += m.narrative.rulefitOutcomeSuffix(outcome);
  return narrative;
}