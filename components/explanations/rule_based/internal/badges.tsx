"use client";

import type { RuleBasedMessages } from "@/lib/rule-based-i18n";

export function BinaryBadge({
  isPresent,
  m,
}: {
  isPresent: boolean;
  m: RuleBasedMessages;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
        isPresent
          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {isPresent ? `\u25cf ${m.condition.isPresent}` : `\u25cb ${m.condition.isAbsent}`}
    </span>
  );
}

export function CategoricalBadge({ valueLabel }: { valueLabel: string }) {
  return (
    <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
      {valueLabel}
    </span>
  );
}

export function MissingBadge({ m }: { m: RuleBasedMessages }) {
  return (
    <span className="inline-flex items-center text-[10px] italic px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
      {m.condition.notRecorded}
    </span>
  );
}

export function ScaledBadge({
  direction,
  m,
}: {
  direction: "below" | "above" | "near";
  m: RuleBasedMessages;
}) {
  const text =
    direction === "below"
      ? m.condition.belowTypical
      : direction === "above"
        ? m.condition.aboveTypical
        : m.condition.nearTypical;
  const arrow = direction === "below" ? "\u2193" : direction === "above" ? "\u2191" : "\u2248";
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
      title={m.ui.scaledValueCaveat}
    >
      {arrow} {text}
    </span>
  );
}