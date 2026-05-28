"use client";

import { AnchorsView } from "./anchors-view";
import { LoreRuleView } from "./lore-rule-view";
import { RuleFitView } from "./rulefit-view";
import { SurrogateTreeView } from "./surrogate-tree-view";
import { RuleBasedView as RuleBasedViewInternal } from "./internal/rule-based-view";
import type { RuleBasedViewProps } from "./internal/types";

export function RuleBasedView(props: RuleBasedViewProps) {
  const key = props.method.toLowerCase().replace(/[^a-z]/g, "");

  if (key.includes("lore")) {
    return <LoreRuleView {...props} />;
  }
  if (key.includes("rulefit")) {
    return <RuleFitView {...props} />;
  }
  if (key.includes("anchor")) {
    return <AnchorsView {...props} />;
  }
  if (key.includes("surrogate") || key.includes("tree")) {
    return <SurrogateTreeView {...props} />;
  }

  return <RuleBasedViewInternal {...props} />;
}

export { AnchorsView, LoreRuleView, RuleFitView, SurrogateTreeView };
export type { RuleBasedViewProps };