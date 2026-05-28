"use client";

import {
  classifyFeature,
  resolveCategoricalValue,
  isThresholdInScaledSpace,
  scaledDirection,
  OUTCOME_FEATURES,
} from "@/lib/feature-classification";
import { parseFeatureKey } from "@/lib/parse-feature-key";
import type { GlossaryEntry } from "@/app/admin/patients/actions";
import type { RuleBasedMessages } from "@/lib/rule-based-i18n";
import {
  BinaryBadge,
  CategoricalBadge,
  MissingBadge,
  ScaledBadge,
} from "./badges";
import { buildLabel } from "./labels";
import { CoefBar } from "./coef-bar";
import { conditionToSentence } from "./narrative";
import { operatorToWords } from "./operators";
import { parseCondition } from "./parse-condition";
import { RangeBar } from "./range-bar";
import type { FiringRule } from "./types";

export function ReadableConditionRow({
  condition,
  index,
  glossary,
  featuresRaw,
  m,
}: {
  condition: string;
  index: number;
  glossary?: Record<string, GlossaryEntry>;
  featuresRaw?: Record<string, unknown> | null;
  m: RuleBasedMessages;
}) {
  const { feature, operator, value } = parseCondition(condition);
  const info = buildLabel(feature, glossary);
  const kind = classifyFeature(feature, glossary);
  const rawValue = featuresRaw?.[feature];
  const threshold = parseFloat(value);

  const isOutcome = OUTCOME_FEATURES.has(parseFeatureKey(feature).feature);

  const Header = () => (
    <div className="flex items-start gap-2 flex-wrap">
      <span className="text-xs font-medium text-foreground">{info.label}</span>
      {isOutcome && (
        <span
          className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/40"
          title="This feature is an outcome variable; its presence in the model suggests possible label leakage."
        >
          {m.condition.outcomeWarning}
        </span>
      )}
    </div>
  );

  if (kind === "categorical" && operator) {
    const resolution = resolveCategoricalValue(feature, rawValue, glossary);

    return (
      <div className="rounded-md bg-muted/40 px-3 py-2.5 border border-border/30 space-y-1">
        <div className="flex items-start gap-2">
          <span className="text-[10px] text-muted-foreground font-mono shrink-0 mt-0.5 w-4 text-right">
            {index + 1}
          </span>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Header />
              {resolution.kind === "resolved" && (
                <CategoricalBadge valueLabel={resolution.valueLabel} />
              )}
              {resolution.kind === "missing" && <MissingBadge m={m} />}
            </div>
          </div>
        </div>
        {info.definition && (
          <p className="text-[10px] text-muted-foreground/70 pl-6 leading-relaxed">
            {info.definition}
          </p>
        )}
      </div>
    );
  }

  if (kind === "binary" && operator) {
    const presentFromRaw = rawValue != null ? Number(rawValue) >= 1 : null;
    const presentByRule =
      (operator === ">" && threshold < 1) ||
      (operator === ">=" && threshold <= 1) ||
      (operator === "==" && threshold >= 1) ||
      (operator === "!=" && threshold === 0);
    const isPresent = presentFromRaw ?? presentByRule;

    return (
      <div className="rounded-md bg-muted/40 px-3 py-2 border border-border/30 space-y-1">
        <div className="flex items-start gap-2">
          <span className="text-[10px] text-muted-foreground font-mono shrink-0 mt-0.5 w-4 text-right">
            {index + 1}
          </span>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Header />
              <BinaryBadge isPresent={isPresent} m={m} />
            </div>
          </div>
        </div>
        {info.definition && (
          <p className="text-[10px] text-muted-foreground/70 pl-6 leading-relaxed">
            {info.definition}
          </p>
        )}
      </div>
    );
  }

  if (kind === "continuous" && operator && isThresholdInScaledSpace(rawValue, threshold)) {
    const direction = scaledDirection(operator, threshold);

    return (
      <div className="rounded-md bg-muted/40 px-3 py-2.5 border border-border/30 space-y-1">
        <div className="flex items-start gap-2">
          <span className="text-[10px] text-muted-foreground font-mono shrink-0 mt-0.5 w-4 text-right">
            {index + 1}
          </span>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Header />
              <ScaledBadge direction={direction} m={m} />
            </div>
          </div>
        </div>
        {info.definition && (
          <p className="text-[10px] text-muted-foreground/70 pl-6 leading-relaxed">
            {info.definition}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-md bg-muted/40 px-3 py-2.5 border border-border/30 space-y-1">
      <div className="flex items-start gap-2">
        <span className="text-[10px] text-muted-foreground font-mono shrink-0 mt-0.5 w-4 text-right">
          {index + 1}
        </span>
        {operator ? (
          <div className="flex-1 min-w-0 space-y-1">
            <Header />
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-xs text-muted-foreground">
                {operatorToWords(operator, m)}
              </span>
              <span className="text-xs font-mono text-blue-600 dark:text-blue-400">
                {value}
              </span>
            </div>
            <RangeBar operator={operator} value={value} feature={feature} />
          </div>
        ) : (
          <span className="text-xs">{condition}</span>
        )}
      </div>
      {info.definition && (
        <p className="text-[10px] text-muted-foreground/70 pl-6 leading-relaxed">
          {info.definition}
        </p>
      )}
    </div>
  );
}

export function ReadableFiringRuleRow({
  rule,
  glossary,
  featuresRaw,
  m,
  maxAbsCoef,
}: {
  rule: FiringRule;
  rank: number;
  glossary?: Record<string, GlossaryEntry>;
  featuresRaw?: Record<string, unknown> | null;
  m: RuleBasedMessages;
  maxAbsCoef?: number;
}) {
  const isNegative = rule.coef < 0;
  const readable = rule.rule
    .split(/\s+and\s+/i)
    .map((p) => conditionToSentence(p.trim(), glossary, featuresRaw, m))
    .join(m.narrative.and);

  return (
    <div className="rounded-md border border-border/40 px-3 py-2.5 space-y-1.5">
      <div className="flex items-start gap-2">
        <span
          className={`shrink-0 mt-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded ${
            isNegative
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {isNegative ? "\u2193" : "\u2191"}
        </span>
        <div className="flex-1 min-w-0 space-y-0.5">
          <p className="text-xs text-foreground leading-relaxed">
            {readable} {"\u2014"}{" "}
            <span
              className={`font-medium ${
                isNegative
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {isNegative ? m.ui.lowersRisk.toLowerCase() : m.ui.raisesRisk.toLowerCase()}
            </span>
          </p>
          {rule.support !== undefined && (
            <p className="text-[10px] text-muted-foreground">
              {m.ui.seenInPercent(rule.support * 100)}
            </p>
          )}
        </div>
      </div>
      {maxAbsCoef != null && maxAbsCoef > 0 && (
        <div className="pl-7 pr-1">
          <CoefBar coef={rule.coef} maxAbsCoef={maxAbsCoef} />
        </div>
      )}
    </div>
  );
}