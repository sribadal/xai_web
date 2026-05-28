"use client";

import type { RuleBasedMessages } from "@/lib/rule-based-i18n";

export function AnchorsConfidence({
  precision,
  coverage,
  mode,
  m,
}: {
  precision?: number;
  coverage?: number;
  mode: "readable" | "technical";
  m: RuleBasedMessages;
}) {
  if (precision == null && coverage == null) return null;

  if (mode === "technical") {
    return (
      <div className="rounded-md bg-muted/40 px-3 py-2 border border-border/30 flex items-center gap-4">
        {precision != null && (
          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {m.ui.precisionLabel}
            </span>
            <code className="text-xs font-mono text-foreground">
              {precision.toFixed(3)}
            </code>
          </div>
        )}
        {coverage != null && (
          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {m.ui.coverageLabel}
            </span>
            <code className="text-xs font-mono text-foreground">
              {coverage.toFixed(3)}
            </code>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border/40 bg-muted/20 px-3 py-2.5">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
        {m.ui.anchorsConfidenceHeader}
      </p>
      <p className="text-xs text-foreground leading-relaxed">
        {m.ui.anchorsConfidenceStatement(precision, coverage)}
      </p>
    </div>
  );
}