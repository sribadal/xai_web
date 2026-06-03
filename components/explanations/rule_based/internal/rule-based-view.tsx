"use client";

import { useState, useMemo } from "react";
import {
  filterInternalConditions,
  filterInternalFiringRules,
} from "@/lib/feature-filters";
import { getMessages } from "@/lib/rule-based-i18n";
import { AnchorsConfidence } from "./anchors-confidence";
import { getMethodExplanation } from "./method-copy";
import { MetricRow } from "./metric-row";
import { buildRuleFitNarrative } from "./narrative";
import { ReadableConditionRow, ReadableFiringRuleRow } from "./readable-rows";
import {
  TechnicalConditionRow,
  TechnicalFiringRuleRow,
} from "./technical-rows";
import { TreePathThumbnail } from "./tree-path-thumbnail";
import type { FiringRule, RuleBasedViewProps } from "./types";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function isNegativeOutcome(outcome: string): boolean {
  return /high|poor|bad|adverse/i.test(outcome);
}

function formatOutcome(outcome: string, modelType?: string): string {
  const isGood = !isNegativeOutcome(outcome);
  if (modelType === "rsf") {
    return isGood ? "low mortality risk" : "high mortality risk";
  }
  if (modelType === "condor") {
    return isGood ? "good quality of life" : "poor quality of life";
  }
  return outcome;
}

/* ------------------------------------------------------------------ */
/*  RuleBasedView                                                      */
/* ------------------------------------------------------------------ */

export function RuleBasedView({
  content,
  method,
  glossary,
  featuresRaw,
  modelType,
  locale = "en",
}: RuleBasedViewProps) {
  const m = useMemo(() => getMessages(locale), [locale]);
  const [showAll, setShowAll] = useState(false);
  const [viewMode, setViewMode] = useState<"readable" | "technical">(
    "readable",
  );

  const methodKey = method.toLowerCase().replace(/[^a-z]/g, "");
  const isAnchors = methodKey.includes("anchor");
  const isLore = methodKey.includes("lore");
  const isSurrogateTree =
    methodKey.includes("surrogate") || methodKey.includes("tree");
  void isLore;

  const conditions = useMemo(
    () => filterInternalConditions((content?.conditions ?? []) as string[]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [content?.conditions],
  );

  const firingRules = useMemo(
    () =>
      filterInternalFiringRules((content?.firing_rules ?? []) as FiringRule[]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [content?.firing_rules],
  );

  if (!content) {
    return <p className="text-sm text-muted-foreground">{m.ui.noData}</p>;
  }

  const outcome = content.outcome as string | undefined;
  const ruleText = content.rule_text as string | undefined;
  const fidelity = content.fidelity as number | undefined;
  const precision = content.precision as number | undefined;
  const coverage = content.coverage as number | undefined;
  const noiseScale = content.noise_scale as number | undefined;
  const nFiring = content.n_firing as number | undefined;

  const explanation = getMethodExplanation(method, m);

  const isRuleFit = firingRules.length > 0;
  const maxPreview = 5;
  const displayedFiringRules = showAll
    ? firingRules
    : firingRules.slice(0, maxPreview);

  const maxAbsCoef = useMemo(() => {
    if (!firingRules.length) return 0;
    return Math.max(...firingRules.map((r) => Math.abs(r.coef ?? 0)));
  }, [firingRules]);

  const sumContributions = useMemo(() => {
    if (!firingRules.length) return 0;
    return firingRules.reduce((s, r) => s + (r.coef ?? 0), 0);
  }, [firingRules]);

  const pathDepth = isSurrogateTree ? conditions.length : 0;

  const formattedOutcome = outcome
    ? formatOutcome(outcome, modelType)
    : undefined;
  const outcomeIsNegative = outcome ? isNegativeOutcome(outcome) : false;

  const hasContent = isRuleFit || conditions.length > 0;

  const ruleFitNarrative = isRuleFit
    ? buildRuleFitNarrative(firingRules, outcome, glossary, featuresRaw, m)
    : null;

  const metrics: { label: string; value: number; description: string }[] = [];
  if (fidelity != null) {
    metrics.push({
      label: m.ui.fidelityLabel,
      value: fidelity,
      description: m.ui.fidelityDesc,
    });
  }
  if (!isAnchors) {
    if (precision != null)
      metrics.push({
        label: m.ui.precisionLabel,
        value: precision,
        description: m.ui.precisionDesc,
      });
    if (coverage != null)
      metrics.push({
        label: m.ui.coverageLabel,
        value: coverage,
        description: m.ui.coverageDesc,
      });
  }

  const conditionsSectionHeader = isSurrogateTree
    ? m.ui.decisionPathHeader(pathDepth)
    : m.ui.keyFactors;

  const conditionsTechnicalHeader = isSurrogateTree
    ? m.ui.decisionPathHeader(pathDepth)
    : m.ui.conditionsHeader;

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {hasContent && (
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {isRuleFit
                ? m.ui.firingRulesCount(firingRules.length)
                : m.ui.conditionsCount(conditions.length)}
            </p>
          )}
          <button
            onClick={() =>
              setViewMode(viewMode === "readable" ? "technical" : "readable")
            }
            className="text-[10px] text-muted-foreground hover:text-foreground border border-border/50 rounded px-2 py-0.5 transition-colors"
          >
            {viewMode === "readable" ? m.ui.showTechnical : m.ui.showClinical}
          </button>
        </div>

        {formattedOutcome && hasContent && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
              {m.ui.prediction}
            </span>
            <span
              className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md border ${
                outcomeIsNegative
                  ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30"
              }`}
            >
              {formattedOutcome}
            </span>
          </div>
        )}

        {isSurrogateTree && pathDepth > 0 && (
          <TreePathThumbnail depth={pathDepth} m={m} />
        )}

        {viewMode === "readable" && (
          <div className="space-y-3">
            {/* ── Narrative: has conditions ─────────────────────────── */}
            {!isRuleFit && formattedOutcome && conditions.length > 0 && (
              <div className="rounded-md border border-border/40 bg-muted/20 p-3">
                <p className="text-sm text-foreground leading-relaxed">
                  The model predicts{" "}
                  <span className="font-semibold">{formattedOutcome}</span>{" "}
                  based on{" "}
                  <span className="font-medium">
                    {conditions.length} clinical factor
                    {conditions.length !== 1 ? "s" : ""}
                  </span>{" "}
                  described below.
                </p>
              </div>
            )}

            {/* ── No conditions: method couldn't produce rules ─────── */}
            {!isRuleFit && conditions.length === 0 && (
              <div className="rounded-md border border-border/40 bg-muted/20 p-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This explanation method could not identify specific factors
                  for this patient. The prediction is shown above.
                </p>
              </div>
            )}

            {/* ── RuleFit narrative ─────────────────────────────────── */}
            {isRuleFit && ruleFitNarrative && (
              <div className="rounded-md border border-border/40 bg-muted/20 p-3">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                  {ruleFitNarrative}
                </p>
              </div>
            )}

            {!isRuleFit && conditions.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  {conditionsSectionHeader}
                </p>
                <div className="space-y-1">
                  {conditions.map((cond, i) => (
                    <ReadableConditionRow
                      key={i}
                      condition={cond}
                      index={i}
                      glossary={glossary}
                      featuresRaw={featuresRaw}
                      m={m}
                    />
                  ))}
                </div>
              </div>
            )}

            {isAnchors && !isRuleFit && (
              <AnchorsConfidence
                precision={precision}
                coverage={coverage}
                mode="readable"
                m={m}
              />
            )}

            {isRuleFit && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  {m.ui.contributingPatterns}
                </p>
                <div className="space-y-1.5">
                  {displayedFiringRules.map((r, i) => (
                    <ReadableFiringRuleRow
                      key={i}
                      rule={r}
                      rank={i + 1}
                      glossary={glossary}
                      featuresRaw={featuresRaw}
                      m={m}
                      maxAbsCoef={maxAbsCoef}
                    />
                  ))}
                </div>
                {firingRules.length > maxPreview && (
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="text-[10px] text-muted-foreground hover:text-foreground underline transition-colors"
                  >
                    {showAll
                      ? m.ui.showFewer
                      : m.ui.showAll(firingRules.length)}
                  </button>
                )}
                <div className="rounded-md bg-muted/30 px-3 py-2 border border-border/30 mt-2">
                  <p className="text-[11px] text-muted-foreground">
                    {m.ui.sumOfContributions(sumContributions, outcome)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {viewMode === "technical" && (
          <div className="space-y-3">
            {!isRuleFit && conditions.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  {conditionsTechnicalHeader}
                </p>
                <div className="space-y-1">
                  {conditions.map((cond, i) => (
                    <TechnicalConditionRow
                      key={i}
                      condition={cond}
                      index={i}
                      glossary={glossary}
                    />
                  ))}
                </div>
                {outcome && (
                  <div className="rounded-md bg-muted/40 px-3 py-2 border border-border/30">
                    <code className="text-xs font-mono">
                      {m.ui.thenLabel} {"\u2192"} {outcome}
                    </code>
                  </div>
                )}
              </div>
            )}

            {!isRuleFit && conditions.length === 0 && outcome && (
              <div className="rounded-md bg-muted/40 px-3 py-2 border border-border/30">
                <code className="text-xs font-mono">
                  {"\u2192"} {outcome} (no distinguishing conditions)
                </code>
              </div>
            )}

            {isAnchors && !isRuleFit && (
              <AnchorsConfidence
                precision={precision}
                coverage={coverage}
                mode="technical"
                m={m}
              />
            )}

            {isRuleFit && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  {m.ui.firingRulesHeader}
                </p>
                <div className="space-y-1.5">
                  {displayedFiringRules.map((r, i) => (
                    <TechnicalFiringRuleRow
                      key={i}
                      rule={r}
                      rank={i + 1}
                      m={m}
                      maxAbsCoef={maxAbsCoef}
                    />
                  ))}
                </div>
                {firingRules.length > maxPreview && (
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="text-[10px] text-muted-foreground hover:text-foreground underline transition-colors"
                  >
                    {showAll
                      ? m.ui.showFewer
                      : m.ui.showAll(firingRules.length)}
                  </button>
                )}
                <div className="rounded-md bg-muted/40 px-3 py-2 border border-border/30">
                  <code className="text-[11px] font-mono text-muted-foreground">
                    {m.ui.sumOfContributionsTechnical(sumContributions)}
                  </code>
                </div>
              </div>
            )}

            {ruleText && (
              <details className="group">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                  {m.ui.rawRuleText}
                </summary>
                <pre className="mt-2 rounded-md bg-muted/50 border border-border/40 p-3 overflow-x-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-muted-foreground">
                  {ruleText}
                </pre>
              </details>
            )}
          </div>
        )}
      </div>

      <div className="w-[240px] shrink-0 hidden md:block">
        <div className="rounded-md border border-border/60 bg-muted/30 p-4 space-y-3 sticky top-4">
          <p className="text-xs font-medium">{explanation.title}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {explanation.description}
          </p>

          <div className="pt-2 border-t border-border/40">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
              {explanation.title}
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {explanation.howToRead}
            </p>
          </div>

          {metrics.length > 0 && (
            <div className="pt-2 border-t border-border/40 space-y-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {m.ui.qualityMetrics}
              </p>
              {metrics.map((mt) => (
                <MetricRow
                  key={mt.label}
                  label={mt.label}
                  value={mt.value}
                  description={mt.description}
                />
              ))}
            </div>
          )}

          {isAnchors && (precision != null || coverage != null) && (
            <div className="pt-2 border-t border-border/40 space-y-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Confidence
              </p>
              {precision != null && (
                <MetricRow
                  label={m.ui.precisionLabel}
                  value={precision}
                  description={m.ui.precisionDesc}
                />
              )}
              {coverage != null && (
                <MetricRow
                  label={m.ui.coverageLabel}
                  value={coverage}
                  description={m.ui.coverageDesc}
                />
              )}
            </div>
          )}

          {(noiseScale != null || nFiring != null) && (
            <div className="pt-2 border-t border-border/40 space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {m.ui.parameters}
              </p>
              {noiseScale != null && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {m.ui.noiseScale}
                  </span>
                  <span className="font-mono">{noiseScale.toFixed(2)}</span>
                </div>
              )}
              {nFiring != null && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {m.ui.activeRules}
                  </span>
                  <span className="font-mono">{nFiring}</span>
                </div>
              )}
            </div>
          )}

          {isRuleFit && (
            <div className="pt-2 border-t border-border/40 space-y-1.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {m.ui.legend}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span className="text-[10px] text-muted-foreground">
                  {m.ui.lowersRisk}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-500" />
                <span className="text-[10px] text-muted-foreground">
                  {m.ui.raisesRisk}
                </span>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-border/40">
            <p className="text-[10px] text-muted-foreground leading-relaxed italic">
              {explanation.caveat}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}