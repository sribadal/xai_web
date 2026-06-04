"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
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

const RSF_HORIZONS: { value: string; label: string; month: number }[] = [
  { value: "3_months", label: "3 mo", month: 3 },
  { value: "6_months", label: "6 mo", month: 6 },
  { value: "12_months", label: "12 mo", month: 12 },
];

const CONDOR_HORIZONS: { value: string; label: string; month: number }[] = [
  { value: "1_month", label: "1 mo", month: 1 },
  { value: "3_months", label: "3 mo", month: 3 },
  { value: "6_months", label: "6 mo", month: 6 },
  { value: "9_months", label: "9 mo", month: 9 },
  { value: "12_months", label: "12 mo", month: 12 },
];

type Props = {
  prediction: unknown;
  modelType: string;
  activeHorizon?: string;
  onHorizonChange?: (h: string) => void;
  locale?: string;
};

export function OutcomeTrajectoryCard({
  prediction,
  modelType,
  activeHorizon,
  onHorizonChange,
  locale = "en",
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
          locale={locale}
        />
      ) : modelType === "condor" ? (
        <CondorQolTrajectory
          prediction={prediction}
          activeHorizon={activeHorizon}
          onHorizonChange={onHorizonChange}
          locale={locale}
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

/* ------------------------------------------------------------------ */
/*  RSF — linear 0–36 month axis                                      */
/* ------------------------------------------------------------------ */

function RsfSurvivalTrajectory({
  prediction,
  activeHorizon,
  onHorizonChange,
  locale = "en",
}: {
  prediction: unknown;
  activeHorizon?: string;
  onHorizonChange?: (h: string) => void;
  locale?: string;
}) {
  const p = prediction as Record<string, unknown> | null;
  const curveArr = p?.survival_curve as
    | Array<{ times?: number[]; values?: number[] }>
    | undefined;
  const curve = curveArr?.[0];
  const times = curve?.times ?? [];
  const values = curve?.values ?? [];

  const data = useMemo(() => {
    if (times.length === 0) return [];

    const pts: { month: number; survival: number }[] = [];
    for (let i = 0; i < times.length; i++) {
      const month = times[i] / DAYS_PER_MONTH;
      if (month > 36) break;
      pts.push({ month, survival: values[i] * 100 });
    }

    // Ensure we have a value at 36 months
    if (pts.length > 0) {
      const lastPt = pts[pts.length - 1];
      if (lastPt.month < 36) {
        // Try to interpolate from data beyond 36m
        for (let i = 0; i < times.length; i++) {
          const month = times[i] / DAYS_PER_MONTH;
          if (month >= 36) {
            pts.push({ month: 36, survival: values[i] * 100 });
            break;
          }
        }
        // If still no 36m point, extend last known value
        if (pts[pts.length - 1].month < 36) {
          pts.push({ month: 36, survival: lastPt.survival });
        }
      }
    }

    return pts;
  }, [times, values]);

  if (data.length === 0) {
    return (
      <p className="survey-prose" style={{ fontSize: "0.85rem" }}>
        {locale === "nl"
          ? "Overlevingscurve niet beschikbaar."
          : "Survival curve unavailable."}
      </p>
    );
  }

  const minSurvival = data.reduce((m, d) => Math.min(m, d.survival), 100);
  const yMin = Math.max(0, Math.floor(minSurvival / 10) * 10 - 10);

  const activeOpt = RSF_HORIZONS.find((h) => h.value === activeHorizon);
  const activeMonth = activeOpt?.month;

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

  const xTicks = [0, 3, 6, 12, 18, 24, 36];
  const yLabel = locale === "nl" ? "Overleving (%)" : "Survival (%)";
  const xLabel =
    locale === "nl" ? "Tijd sinds diagnose" : "Time since diagnosis";

  return (
    <>
      <div style={{ width: "100%", height: 180, marginTop: 4 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 12, bottom: 20, left: 0 }}
          >
            <CartesianGrid stroke={GRID_STROKE} vertical={false} />
            <XAxis
              type="number"
              dataKey="month"
              domain={[0, 36]}
              ticks={xTicks}
              tickFormatter={(m) => (m === 0 ? "0" : `${m}m`)}
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
            {activeMonth !== undefined && (
              <ReferenceLine
                x={activeMonth}
                stroke={RSF_COLOR_ACCENT}
                strokeDasharray="3 4"
                strokeWidth={1}
              />
            )}
            <Tooltip
              cursor={false}
              labelFormatter={(m) => {
                const num = Number(m);
                if (num === 0)
                  return locale === "nl" ? "Diagnose" : "Diagnosis";
                return locale === "nl"
                  ? `${num.toFixed(0)} maanden`
                  : `${num.toFixed(0)} months`;
              }}
              formatter={(v) => [
                `${Number(v).toFixed(1)}%`,
                locale === "nl" ? "Overleving" : "Survival",
              ]}
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

/* ------------------------------------------------------------------ */
/*  ConDOR — 0–12 month axis                                          */
/* ------------------------------------------------------------------ */

function CondorQolTrajectory({
  prediction,
  activeHorizon,
  onHorizonChange,
  locale = "en",
}: {
  prediction: unknown;
  activeHorizon?: string;
  onHorizonChange?: (h: string) => void;
  locale?: string;
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
        {locale === "nl"
          ? "Kwaliteit-van-leventraject niet beschikbaar."
          : "Quality-of-life trajectory unavailable."}
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

  const yLabel = locale === "nl" ? "Kwaliteit van leven" : "Quality of life";
  const xLabel =
    locale === "nl" ? "Tijd sinds diagnose" : "Time since diagnosis";

  return (
    <>
      <div style={{ width: "100%", height: 180, marginTop: 4 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={points}
            margin={{ top: 8, right: 12, bottom: 20, left: 0 }}
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
              label={{
                value: xLabel,
                position: "bottom",
                offset: 4,
                style: { fontSize: 10, fill: TICK_FILL },
              }}
            />
            <YAxis
              type="number"
              domain={[yMin, yMax]}
              tick={{ fontSize: 10, fill: TICK_FILL }}
              stroke={GRID_STROKE}
              width={32}
              label={{
                value: yLabel,
                angle: -90,
                position: "insideLeft",
                offset: 8,
                style: { fontSize: 10, fill: TICK_FILL, textAnchor: "middle" },
              }}
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
              labelFormatter={(m) => {
                const num = Number(m);
                if (num === 0)
                  return locale === "nl" ? "Basislijn" : "Baseline";
                return locale === "nl"
                  ? `${num} maand${num === 1 ? "" : "en"}`
                  : `${num} month${num === 1 ? "" : "s"}`;
              }}
              formatter={(v) => [
                Number(v).toFixed(1),
                locale === "nl" ? "KvL" : "QoL",
              ]}
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

/* ------------------------------------------------------------------ */
/*  Shared horizon pills                                               */
/* ------------------------------------------------------------------ */

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