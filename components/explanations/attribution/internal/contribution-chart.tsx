"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { GlossaryEntry } from "@/app/admin/patients/actions";
import { useChartSize } from "../../shared/chart-size-context";
import { pickContributionColor, type GoodSign } from "../../shared/colors";
import { ContributionTooltip } from "./contribution-tooltip";
import { horizonLabel } from "./horizons";
import type { AttributionRow } from "./types";

type Props = {
  rows: AttributionRow[];
  plottedHorizons: string[];
  activeHorizon: string;
  isOverlay: boolean;
  goodSign: GoodSign;
  glossary?: Record<string, GlossaryEntry>;
  featureValues?: Record<string, number | string | null>;
  locale: string;
};

const MIN_CHART_HEIGHT = 260;
const DEFAULT_MAX_CHART_HEIGHT = 720;
const LARGE_MAX_CHART_HEIGHT = 1200;
const Y_AXIS_WIDTH = 200;

function computeChartHeight(
  numRows: number,
  barsPerRow: number,
  isLarge: boolean,
): number {
  const rowHeight = isLarge
    ? barsPerRow === 1
      ? 56
      : 28 * barsPerRow + 24
    : barsPerRow === 1
      ? 36
      : 18 * barsPerRow + 18;
  const maxH = isLarge ? LARGE_MAX_CHART_HEIGHT : DEFAULT_MAX_CHART_HEIGHT;
  return Math.max(MIN_CHART_HEIGHT, Math.min(maxH, numRows * rowHeight + 60));
}

export function ContributionChart({
  rows,
  plottedHorizons,
  activeHorizon,
  isOverlay,
  goodSign,
  glossary,
  featureValues,
  locale,
}: Props) {
  const size = useChartSize();
  const isLarge = size === "large";
  const barsPerRow = plottedHorizons.length;
  const chartHeight = computeChartHeight(rows.length, barsPerRow, isLarge);
  const barMaxSize = isLarge
    ? barsPerRow === 1
      ? 44
      : 26
    : barsPerRow === 1
      ? 28
      : 18;

  const hasNegative = isOverlay
    ? rows.some((r) => Object.values(r.byHorizon).some((v) => v < 0))
    : rows.some((r) => r.value < 0);

  const maxAbsDisplay = isOverlay
    ? rows.reduce(
        (m, r) =>
          Math.max(m, ...Object.values(r.byHorizon).map((v) => Math.abs(v))),
        0,
      )
    : rows.reduce((m, r) => Math.max(m, Math.abs(r.value)), 0);

  const colorFor = (v: number) =>
    pickContributionColor(v, hasNegative, goodSign);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={rows}
        layout="vertical"
        margin={{ top: 8, right: 24, bottom: 8, left: 8 }}
        barCategoryGap="12%"
        barGap={isOverlay ? 1 : 4}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.25} />

        <XAxis
          type="number"
          tick={false}
          domain={
            hasNegative
              ? [-maxAbsDisplay * 1.08, maxAbsDisplay * 1.08]
              : [0, "auto"]
          }
        />
        <YAxis
          type="category"
          dataKey="shortLabel"
          tick={<GlossaryYTick glossary={glossary} />}
          width={Y_AXIS_WIDTH}
          interval={0}
        />

        <Tooltip
          content={
            <ContributionTooltip
              glossary={glossary}
              featureValues={featureValues}
              locale={locale}
            />
          }
          cursor={{ fill: "rgba(0, 0, 0, 0.04)" }}
        />

        {hasNegative && (
          <ReferenceLine x={0} stroke="hsl(var(--border))" strokeWidth={1.5} />
        )}

        {isOverlay ? (
          plottedHorizons.map((h) => (
            <HorizonBar
              key={h}
              horizon={h}
              isActive={h === activeHorizon}
              rows={rows}
              colorFor={colorFor}
              barMaxSize={barMaxSize}
            />
          ))
        ) : (
          <Bar dataKey="value" radius={[3, 3, 3, 3]} maxBarSize={barMaxSize}>
            {rows.map((row, i) => (
              <Cell key={i} fill={colorFor(row.value)} />
            ))}
          </Bar>
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}

function HorizonBar({
  horizon,
  isActive,
  rows,
  colorFor,
  barMaxSize,
}: {
  horizon: string;
  isActive: boolean;
  rows: AttributionRow[];
  colorFor: (v: number) => string;
  barMaxSize: number;
}) {
  const accessor = (row: AttributionRow) => row.byHorizon[horizon] ?? 0;

  return (
    <Bar
      dataKey={accessor}
      name={horizonLabel(horizon)}
      radius={[3, 3, 3, 3]}
      maxBarSize={barMaxSize}
      isAnimationActive={false}
      fillOpacity={isActive ? 1 : 0.32}
    >
      {rows.map((row, i) => (
        <Cell key={i} fill={colorFor(accessor(row))} />
      ))}
    </Bar>
  );
}

const CONDOR_LABELS: Record<string, string> = {
  ts_surg: "Time since surgery",
  ts_syst: "Time since systemic therapy",
  had_surg: "Received surgery",
  had_syst: "Received systemic therapy",
  impulse_surg: "Ongoing surgery effect",
  impulse_syst: "Ongoing systemic therapy effect",
  seizoen: "Diagnosis season",
  cci: "Comorbidity score",
}

function GlossaryYTick({
  x,
  y,
  payload,
  glossary,
}: {
  x?: number
  y?: number
  payload?: { value: string }
  glossary?: Record<string, GlossaryEntry>
}) {
  const raw = payload?.value ?? ""

  // Split "impulse_surg (≤ 0)" into feature="impulse_surg" + suffix="(≤ 0)"
  const parenIdx = raw.indexOf(" (")
  const feature = parenIdx > -1 ? raw.slice(0, parenIdx) : raw
  const suffix = parenIdx > -1 ? raw.slice(parenIdx) : ""

  const friendlyName =
    glossary?.[feature]?.label ??
    CONDOR_LABELS[feature] ??
    feature

  // Only append suffix if the friendly name doesn't already have parens
  const label =
    suffix && !friendlyName.includes("(")
      ? `${friendlyName} ${suffix.trim()}`
      : friendlyName

  return (
    <text
      x={x}
      y={y}
      textAnchor="end"
      fontSize={11}
      fill="currentColor"
      dy={4}
    >
      {label}
    </text>
  )
}