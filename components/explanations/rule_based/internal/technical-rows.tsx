"use client";

import type { GlossaryEntry } from "@/app/admin/patients/actions";
import type { RuleBasedMessages } from "@/lib/rule-based-i18n";
import { buildLabel } from "./labels";
import { CoefBar } from "./coef-bar";
import { parseCondition } from "./parse-condition";
import type { FiringRule } from "./types";

export function TechnicalConditionRow({
  condition,
  index,
  glossary,
}: {
  condition: string;
  index: number;
  glossary?: Record<string, GlossaryEntry>;
}) {
  const { feature, operator, value } = parseCondition(condition);
  const info = buildLabel(feature, glossary);
  return (
    <div className="rounded-md bg-muted/40 px-3 py-2 border border-border/30 space-y-1">
      <div className="flex items-start gap-2">
        <span className="text-[10px] text-muted-foreground font-mono shrink-0 mt-0.5 w-4 text-right">
          {index + 1}
        </span>
        {operator ? (
          <code className="text-xs font-mono break-all">
            {info.raw} {operator} {value}
          </code>
        ) : (
          <code className="text-xs font-mono break-all">{condition}</code>
        )}
      </div>
    </div>
  );
}

export function TechnicalFiringRuleRow({
  rule,
  rank,
  m,
  maxAbsCoef,
}: {
  rule: FiringRule;
  rank: number;
  m: RuleBasedMessages;
  maxAbsCoef?: number;
}) {
  const isNegative = rule.coef < 0;
  return (
    <div className="rounded-md border border-border/40 px-3 py-2 space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground font-mono">
          #{rank}
        </span>
        <span
          className={`text-xs font-mono font-medium ${
            isNegative
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {rule.coef >= 0 ? "+" : ""}
          {rule.coef.toFixed(3)}
        </span>
        {rule.support !== undefined && (
          <span className="text-[10px] text-muted-foreground font-mono">
            {m.ui.supportLabel(rule.support * 100)}
          </span>
        )}
      </div>
      {maxAbsCoef != null && maxAbsCoef > 0 && (
        <div className="pl-6 pr-1">
          <CoefBar coef={rule.coef} maxAbsCoef={maxAbsCoef} />
        </div>
      )}
      <code className="text-[11px] font-mono text-muted-foreground block pl-6 break-all">
        IF {rule.rule}
      </code>
    </div>
  );
}