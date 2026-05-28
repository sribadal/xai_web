"use client";

import type { RuleBasedMessages } from "@/lib/rule-based-i18n";

export function TreePathThumbnail({
  depth,
  m,
}: {
  depth: number;
  m: RuleBasedMessages;
}) {
  if (depth <= 0) return null;

  const nodeR = 5;
  const gap = 28;
  const padding = 12;
  const width = padding * 2 + (depth + 1) * gap;
  const height = 36;
  const cy = height / 2;

  const nodes = Array.from({ length: depth + 1 }, (_, i) => ({
    cx: padding + i * gap,
    isLeaf: i === depth,
  }));

  return (
    <div className="flex items-center gap-2">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="shrink-0"
        aria-label={m.ui.treePathAria(depth)}
      >
        {nodes.slice(0, -1).map((n, i) => {
          const next = nodes[i + 1];
          return (
            <line
              key={`l-${i}`}
              x1={n.cx + nodeR}
              y1={cy}
              x2={next.cx - nodeR}
              y2={cy}
              className="stroke-border"
              strokeWidth={1.5}
            />
          );
        })}
        {nodes.map((n, i) => (
          <circle
            key={`n-${i}`}
            cx={n.cx}
            cy={cy}
            r={nodeR}
            className={
              n.isLeaf
                ? "fill-blue-500 stroke-blue-600"
                : "fill-muted-foreground/30 stroke-muted-foreground/60"
            }
            strokeWidth={1.5}
          />
        ))}
      </svg>
      <span className="text-[10px] text-muted-foreground">
        {m.ui.treePathDepth(depth)}
      </span>
    </div>
  );
}