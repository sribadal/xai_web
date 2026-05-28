"use client";

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
const RSF_MAX_DAYS = 365;

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

type Props = {
  prediction: unknown;
  modelType: string;
  activeHorizon?: string;
  onHorizonChange?: (h: string) => void;
};

export function OutcomeTrajectoryCard({
  prediction,
  modelType,
  activeHorizon,
  onHorizonChange,
}: Props) {
  const summary = generateModelOutputSummary(prediction, modelType, activeHorizon);

  return (
    <>
      {modelType === "rsf" ? (
        <RsfMortalityTrajectory
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

function RsfMortalityTrajectory({
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

  if (times.length === 0 || times.length !== values.length) {
    return (
      <p className="survey-prose" style={{ fontSize: "0.85rem" }}>
        Survival curve unavailable.
      </p>
    );
  }

  const data: { days: number; mortality: number }[] = [];
  for (let i = 0; i < times.length; i++) {
    if (times[i] > RSF_MAX_DAYS) break;
    data.push({ days: times[i], mortality: (1 - values[i]) * 100 });
  }
  if (data.length > 0 && data[data.length - 1].days < RSF_MAX_DAYS) {
    data.push({ days: RSF_MAX_DAYS, mortality: data[data.length - 1].mortality });
  }

  const maxMortality = data.reduce((m, d) => Math.max(m, d.mortality), 0);
  const yMax = Math.max(15, Math.ceil(maxMortality / 5) * 5 + 5);

  const activeOpt = RSF_HORIZONS.find((h) => h.value === activeHorizon);
  const activeDays = activeOpt?.days;

  const horizonPills = RSF_HORIZONS.map((h) => {
    const v = p?.[`mortality_risk_${h.value}`];
    return {
      value: h.value,
      label: h.label,
      valueLabel: typeof v === "number" ? `${(v * 100).toFixed(1)}%` : "—",
    };
  });

  return (
    <>
      <div style={{ width: "100%", height: 160, marginTop: 4 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
            <CartesianGrid stroke={GRID_STROKE} vertical={false} />
            <XAxis
              type="number"
              dataKey="days"
              domain={[0, RSF_MAX_DAYS]}
              ticks={[0, 90, 180, 365]}
              tickFormatter={(d) =>
                d === 0 ? "0" : `${Math.round(d / DAYS_PER_MONTH)}m`
              }
              tick={{ fontSize: 10, fill: TICK_FILL }}
              stroke={GRID_STROKE}
            />
            <YAxis
              type="number"
              domain={[0, yMax]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 10, fill: TICK_FILL }}
              stroke={GRID_STROKE}
              width={36}
            />
            <Area
              type="stepAfter"
              dataKey="mortality"
              stroke={RSF_COLOR}
              fill={RSF_COLOR}
              fillOpacity={0.12}
              strokeWidth={1.5}
              isAnimationActive={false}
              dot={false}
              activeDot={false}
            />
            {activeDays !== undefined && (
              <ReferenceLine
                x={activeDays}
                stroke={RSF_COLOR_ACCENT}
                strokeDasharray="3 4"
                strokeWidth={1}
              />
            )}
            <Tooltip
              cursor={false}
              labelFormatter={(d) =>
                `Day ${d} (~${(Number(d) / DAYS_PER_MONTH).toFixed(1)} mo)`
              }
              formatter={(v) => [Number(v).toFixed(1), "Mortality"]}
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
      <div style={{ width: "100%", height: 160, marginTop: 4 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
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
              activeDot={{ r: 5, fill: CONDOR_COLOR_ACCENT, stroke: CONDOR_COLOR_ACCENT }}
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
              background: active ? accentBg : "var(--survey-card-alt-bg, #f1f1f0)",
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