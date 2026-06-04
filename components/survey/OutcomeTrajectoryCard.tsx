"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { generateModelOutputSummary } from "@/lib/survey/patient-narrative";

const DAYS_PER_MONTH = 30.4375;

const RSF_COLOR = "#D85A30";
const RSF_COLOR_ACCENT = "#993C1D";
const RSF_ACCENT_BG = "#FAECE7";

const CONDOR_COLOR = "#1D9E75";
const CONDOR_COLOR_ACCENT = "#0F6E56";
const CONDOR_ACCENT_BG = "#E1F5EE";

const GRID_STROKE = "rgba(127,127,127,0.15)";
const TICK_FILL = "#888780";

const RSF_HORIZONS: { value: string; label: string; days: number }[] = [
  { value: "3_months", label: "3 mo", days: 90 },
  { value: "6_months", label: "6 mo", days: 180 },
  { value: "12_months", label: "12 mo", days: 365 },
];

const CONDOR_HORIZONS: { value: string; label: string; month: number }[] = [
  { value: "1_month", label: "1 mo", month: 1 },
  { value: "3_months", label: "3 mo", month: 3 },
  { value: "6_months", label: "6 mo", month: 6 },
  { value: "9_months", label: "9 mo", month: 9 },
  { value: "12_months", label: "12 mo", month: 12 },
];

// ---------------------------------------------------------------------------
// Compressed x-axis: year 1 gets the most space, years 2–3 are compressed,
// and the long-term endpoint sits in a tiny break zone at the right edge.
// ---------------------------------------------------------------------------

const AXIS_SEGMENTS = [
  { endDay: 365, scale: 1.0 }, // 0–12m: full scale
  { endDay: 730, scale: 0.5 }, // 12–24m: half scale
  { endDay: 1095, scale: 0.3 }, // 24–36m: 30% scale
];

const BREAK_GAP = 25; // chart-space gap for the axis break

function daysToPos(days: number): number {
  let pos = 0;
  let prev = 0;
  for (const seg of AXIS_SEGMENTS) {
    if (days <= seg.endDay) {
      return pos + (days - prev) * seg.scale;
    }
    pos += (seg.endDay - prev) * seg.scale;
    prev = seg.endDay;
  }
  // Beyond 36m — in the break zone
  return pos + BREAK_GAP;
}

// Pre-compute key positions
const POS_3M = daysToPos(90);
const POS_6M = daysToPos(180);
const POS_12M = daysToPos(365);
const POS_18M = daysToPos(548);
const POS_24M = daysToPos(730);
const POS_36M = daysToPos(1095);
const POS_ENDPOINT = POS_36M + BREAK_GAP;
const POS_BREAK_START = POS_36M + 5;
const POS_CHART_MAX = POS_ENDPOINT + 15;

// Tick definitions: position → label
const RSF_TICKS_BASE = [
  { pos: 0, label: "0" },
  { pos: POS_3M, label: "3m" },
  { pos: POS_6M, label: "6m" },
  { pos: POS_12M, label: "12m" },
  { pos: POS_18M, label: "18m" },
  { pos: POS_24M, label: "24m" },
  { pos: POS_36M, label: "36m" },
];

type Props = {
  prediction: unknown;
  modelType: string;
  activeHorizon?: string;
  onHorizonChange?: (h: string) => void;
  locale: string;
};

export function OutcomeTrajectoryCard({
  prediction,
  modelType,
  activeHorizon,
  onHorizonChange,
  locale,
}: Props) {
  const summary = generateModelOutputSummary(
    prediction,
    modelType,
    activeHorizon,
    locale,
  );

  return (
    <>
      {modelType === "rsf" ? (
        <RsfSurvivalTrajectory
          prediction={prediction}
          activeHorizon={activeHorizon}
          onHorizonChange={onHorizonChange}
        />
      ) : modelType === "condor" ? (
        <CondorQolTrajectory
          prediction={prediction}
          activeHorizon={activeHorizon}
          onHorizonChange={onHorizonChange}
        />
      ) : null}

      <p
        className="survey-prose"
        style={{
          marginTop: "var(--survey-space-3)",
          fontSize: "0.85rem",
          color: "var(--survey-muted, #555)",
        }}
      >
        {summary}
      </p>
    </>
  );
}

function RsfSurvivalTrajectory({
  prediction,
  activeHorizon,
  onHorizonChange,
}: {
  prediction: unknown;
  activeHorizon?: string;
  onHorizonChange?: (h: string) => void;
}) {
  const p = prediction as Record<string, unknown> | null;
  const curveArr = p?.survival_curve as
    | Array<{ times?: number[]; values?: number[] }>
    | undefined;
  const curve = curveArr?.[0];
  const times = curve?.times ?? [];
  const values = curve?.values ?? [];

  const { data, endpointYears, hasEndpoint, chartMax, ticks, tickMap } =
    useMemo(() => {
      if (times.length === 0) {
        return {
          data: [],
          endpointYears: 0,
          hasEndpoint: false,
          chartMax: POS_36M,
          ticks: RSF_TICKS_BASE.map((t) => t.pos),
          tickMap: new Map(RSF_TICKS_BASE.map((t) => [t.pos, t.label])),
        };
      }

      // Build main data up to 3 years, mapped to compressed positions
      const pts: { pos: number; survival: number }[] = [];
      for (let i = 0; i < times.length; i++) {
        if (times[i] > 1095) break;
        pts.push({
          pos: daysToPos(times[i]),
          survival: values[i] * 100,
        });
      }

      // Check if curve extends beyond 3 years
      const lastDay = times[times.length - 1];
      const lastVal = values[values.length - 1] * 100;
      const hasLongTerm = lastDay > 1095;
      const years = Math.round(lastDay / 365);

      if (hasLongTerm) {
        // Extend the 36m value to the break start, then add endpoint
        if (pts.length > 0) {
          const val36 = pts[pts.length - 1].survival;
          pts.push({ pos: POS_BREAK_START, survival: val36 });
        }
        pts.push({ pos: POS_ENDPOINT, survival: lastVal });
      }

      const allTicks = [...RSF_TICKS_BASE];
      if (hasLongTerm) {
        allTicks.push({ pos: POS_ENDPOINT, label: `⋯ ${years}y` });
      }

      return {
        data: pts,
        endpointYears: years,
        hasEndpoint: hasLongTerm,
        chartMax: hasLongTerm ? POS_CHART_MAX : POS_36M + 10,
        ticks: allTicks.map((t) => t.pos),
        tickMap: new Map(allTicks.map((t) => [t.pos, t.label])),
      };
    }, [times, values]);

  if (data.length === 0) {
    return (
      <p className="survey-prose" style={{ fontSize: "0.85rem" }}>
        Survival curve unavailable.
      </p>
    );
  }

  const minSurvival = data.reduce((m, d) => Math.min(m, d.survival), 100);
  const yMin = Math.max(0, Math.floor(minSurvival / 10) * 10 - 10);

  const activeOpt = RSF_HORIZONS.find((h) => h.value === activeHorizon);
  const activePos = activeOpt ? daysToPos(activeOpt.days) : undefined;

  const horizonPills = RSF_HORIZONS.map((h) => {
    const survProb = p?.[`survival_prob_${h.value}`];
    const mortRisk = p?.[`mortality_risk_${h.value}`];
    let pct: number | null = null;
    if (typeof survProb === "number") pct = survProb * 100;
    else if (typeof mortRisk === "number") pct = (1 - mortRisk) * 100;
    return {
      value: h.value,
      label: h.label,
      valueLabel: pct !== null ? `${pct.toFixed(1)}%` : "—",
    };
  });

  return (
    <>
      <div style={{ width: "100%", height: 180, marginTop: 4 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 12, bottom: 4, left: 0 }}
          >
            <CartesianGrid stroke={GRID_STROKE} vertical={false} />
            <XAxis
              type="number"
              dataKey="pos"
              domain={[0, chartMax]}
              ticks={ticks}
              tickFormatter={(pos) => tickMap.get(pos) ?? ""}
              tick={{ fontSize: 10, fill: TICK_FILL }}
              stroke={GRID_STROKE}
            />
            <YAxis
              type="number"
              domain={[yMin, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 10, fill: TICK_FILL }}
              stroke={GRID_STROKE}
              width={36}
            />

            {hasEndpoint && (
              <ReferenceArea
                x1={POS_BREAK_START}
                x2={POS_CHART_MAX}
                fill="var(--survey-card-alt-bg, #f5f5f4)"
                fillOpacity={0.6}
                strokeOpacity={0}
              />
            )}

            <Area
              type="monotone"
              dataKey="survival"
              stroke={RSF_COLOR}
              fill={RSF_COLOR}
              fillOpacity={0.12}
              strokeWidth={1.5}
              isAnimationActive={false}
              dot={false}
              activeDot={false}
            />
            {activePos !== undefined && (
              <ReferenceLine
                x={activePos}
                stroke={RSF_COLOR_ACCENT}
                strokeDasharray="3 4"
                strokeWidth={1}
              />
            )}
            <Tooltip
              cursor={false}
              labelFormatter={(pos) => {
                const num = Number(pos);
                if (num >= POS_ENDPOINT && hasEndpoint)
                  return `~${endpointYears} years`;
                // Reverse-map position to approximate months
                // (not exact, but close enough for a tooltip)
                const label = tickMap.get(num);
                if (label) return label;
                return "";
              }}
              formatter={(v) => [`${Number(v).toFixed(1)}%`, "Survival"]}
              contentStyle={{ fontSize: 11 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <HorizonPills
        horizons={horizonPills}
        activeValue={activeHorizon}
        onChange={onHorizonChange}
        accentColor={RSF_COLOR_ACCENT}
        accentBg={RSF_ACCENT_BG}
      />
    </>
  );
}

function CondorQolTrajectory({
  prediction,
  activeHorizon,
  onHorizonChange,
}: {
  prediction: unknown;
  activeHorizon?: string;
  onHorizonChange?: (h: string) => void;
}) {
  const p = prediction as Record<string, unknown> | null;
  const baseline = p?.qol_baseline;

  const points: { month: number; qol: number }[] = [];
  if (typeof baseline === "number") points.push({ month: 0, qol: baseline });
  for (const h of CONDOR_HORIZONS) {
    const v = p?.[`qol_${h.value}`];
    if (typeof v === "number") points.push({ month: h.month, qol: v });
  }

  if (points.length === 0) {
    return (
      <p className="survey-prose" style={{ fontSize: "0.85rem" }}>
        Quality-of-life trajectory unavailable.
      </p>
    );
  }

  const qols = points.map((pt) => pt.qol);
  const minQ = Math.min(...qols);
  const maxQ = Math.max(...qols);
  const yMin = Math.max(0, Math.floor((minQ - 5) / 5) * 5);
  const yMax = Math.min(100, Math.ceil((maxQ + 5) / 5) * 5);

  const activeOpt = CONDOR_HORIZONS.find((h) => h.value === activeHorizon);
  const activeMonth = activeOpt?.month;

  const horizonPills = CONDOR_HORIZONS.map((h) => {
    const v = p?.[`qol_${h.value}`];
    return {
      value: h.value,
      label: h.label,
      valueLabel: typeof v === "number" ? v.toFixed(1) : "—",
    };
  });

  return (
    <>
      <div style={{ width: "100%", height: 180, marginTop: 4 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={points}
            margin={{ top: 8, right: 12, bottom: 4, left: 0 }}
          >
            <CartesianGrid stroke={GRID_STROKE} vertical={false} />
            <XAxis
              type="number"
              dataKey="month"
              domain={[0, 12]}
              ticks={[0, 1, 3, 6, 9, 12]}
              tickFormatter={(m) => (m === 0 ? "base" : `${m}m`)}
              tick={{ fontSize: 10, fill: TICK_FILL }}
              stroke={GRID_STROKE}
            />
            <YAxis
              type="number"
              domain={[yMin, yMax]}
              tick={{ fontSize: 10, fill: TICK_FILL }}
              stroke={GRID_STROKE}
              width={32}
            />
            <Line
              type="linear"
              dataKey="qol"
              stroke={CONDOR_COLOR}
              strokeWidth={1.5}
              dot={{ r: 3, fill: CONDOR_COLOR, stroke: CONDOR_COLOR }}
              activeDot={{
                r: 5,
                fill: CONDOR_COLOR_ACCENT,
                stroke: CONDOR_COLOR_ACCENT,
              }}
              isAnimationActive={false}
            />
            {activeMonth !== undefined && (
              <ReferenceLine
                x={activeMonth}
                stroke={CONDOR_COLOR_ACCENT}
                strokeDasharray="3 4"
                strokeWidth={1}
              />
            )}
            <Tooltip
              cursor={false}
              labelFormatter={(m) =>
                m === 0 ? "Baseline" : `${m} month${m === 1 ? "" : "s"}`
              }
              formatter={(v) => [Number(v).toFixed(1), "QoL"]}
              contentStyle={{ fontSize: 11 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <HorizonPills
        horizons={horizonPills}
        activeValue={activeHorizon}
        onChange={onHorizonChange}
        accentColor={CONDOR_COLOR_ACCENT}
        accentBg={CONDOR_ACCENT_BG}
      />
    </>
  );
}

function HorizonPills({
  horizons,
  activeValue,
  onChange,
  accentColor,
  accentBg,
}: {
  horizons: { value: string; label: string; valueLabel: string }[];
  activeValue?: string;
  onChange?: (h: string) => void;
  accentColor: string;
  accentBg: string;
}) {
  return (
    <div
      role="tablist"
      aria-label="Time horizon"
      style={{
        display: "flex",
        gap: 6,
        marginTop: 10,
        justifyContent: "center",
        flexWrap: "wrap",
      }}
    >
      {horizons.map((h) => {
        const active = h.value === activeValue;
        return (
          <button
            key={h.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(h.value)}
            style={{
              padding: "3px 10px",
              fontSize: 11,
              borderRadius: 999,
              border: "none",
              cursor: onChange ? "pointer" : "default",
              background: active
                ? accentBg
                : "var(--survey-card-alt-bg, #f1f1f0)",
              color: active ? accentColor : "var(--survey-muted, #6b6b6b)",
              fontWeight: active ? 500 : 400,
              transition: "background 120ms ease",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {h.label} · {h.valueLabel}
          </button>
        );
      })}
    </div>
  );
}
