"use client";

import { RuleBasedView } from "./internal/rule-based-view";
import type { RuleBasedViewProps } from "./internal/types";

export function RuleFitView(props: Omit<RuleBasedViewProps, "method">) {
  return <RuleBasedView {...props} method="rulefit" />;
}