"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { buildFeatureLabel } from "@/components/explanations/shared/labels";
import type { GlossaryEntry } from "@/app/admin/patients/actions";
import { DiffTooltip } from "./diff-tooltip";
import { splitColumns } from "./helpers";
import type { CaseRecord, DiffRow } from "./types";

const COLOR_INCREASE = "#3b82f6";
const COLOR_DECREASE = "#f97316";

type Props = {
  queryFeatures: Record<string, unknown>;
  selectedCase: CaseRecord;
  glossary?: Record<string, GlossaryEntry>;
  caseLabelPrefix: string;
  selectedIdx: number;
  topN?: number;
};

export function DiffChart({
  queryFeatures,
  selectedCase,
  glossary,
  caseLabelPrefix,
  selectedIdx,
  topN = 10,
}: Props) {
  const { featureCols } = splitColumns(selectedCase);

  const diffs = featureCols
    .map((col): DiffRow | null => {
      const qv = queryFeatures[col];
      const cv = selectedCase[col];
      if (typeof qv === "number" && typeof cv === "number") {
        const diff = cv - qv;
        if (Math.abs(diff) > 0.01) {
          const labels = buildFeatureLabel(col, glossary);
          return {
            name: labels.short,
            fullLabel: labels.full,
            rawKey: col,
            diff,
            queryVal: qv,
            caseVal: cv,
          };
        }
      }
      return null;
    })
    .filter((d) => d !== null);

  diffs.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
  const topDiffs = diffs.slice(0, topN);

  if (topDiffs.length === 0) return null;

  return (
    <div className="space-y-1">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
        Top numeric differences — {caseLabelPrefix} {selectedIdx + 1} vs. this
        patient
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={topDiffs}
          margin={{ top: 10, right: 10, bottom: 50, left: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            interval={0}
            height={60}
          />
          <YAxis
            tick={{ fontSize: 10 }}
            tickFormatter={(v: number) =>
              v >= 0 ? `+${v.toFixed(0)}` : v.toFixed(0)
            }
            width={55}
            label={{
              value: "Δ (case − patient)",
              angle: -90,
              position: "insideLeft",
              style: {
                fontSize: 10,
                fill: "hsl(var(--muted-foreground))",
              },
              offset: 0,
            }}
          />
          <Tooltip
            content={<DiffTooltip glossary={glossary} />}
            cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
          />
          <Bar dataKey="diff" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {topDiffs.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.diff >= 0 ? COLOR_INCREASE : COLOR_DECREASE}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export { COLOR_INCREASE, COLOR_DECREASE };
