"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import type { GlossaryEntry } from "@/app/admin/patients/actions"
import { COLOR_NEUTRAL } from "../../shared/colors"
import { FeatureMetaFooter } from "../../shared/feature-meta-footer"
import { formatTooltipValue, makeTickFormatter } from "../../shared/formatters"
import type { AttributionRow } from "./types"

type Props = {
  rows: AttributionRow[]
  glossary?: Record<string, GlossaryEntry>
  featureValues?: Record<string, number | string | null>
}

const CHART_HEIGHT = 320
const Y_AXIS_WIDTH = 70
const X_AXIS_HEIGHT = 60

export function ImportanceChart({ rows, glossary, featureValues }: Props) {
  const maxAbs = rows.reduce((m, r) => Math.max(m, Math.abs(r.value)), 0)
  const tickFormatter = makeTickFormatter(maxAbs, false)

  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <BarChart
        data={rows}
        layout="horizontal"
        margin={{ top: 10, right: 10, bottom: 50, left: 10 }}
        barCategoryGap="10%"
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.25} />

        <XAxis
          dataKey="shortLabel"
          tick={{ fontSize: 10 }}
          angle={-45}
          textAnchor="end"
          interval={0}
          height={X_AXIS_HEIGHT}
        />
        <YAxis
          tick={{ fontSize: 10 }}
          tickFormatter={tickFormatter}
          width={Y_AXIS_WIDTH}
        />

        <Tooltip
          content={
            <ImportanceTooltip
              glossary={glossary}
              featureValues={featureValues}
              maxAbs={maxAbs}
            />
          }
          cursor={{ fill: "rgba(0, 0, 0, 0.04)" }}
        />

        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {rows.map((_, i) => (
            <Cell key={i} fill={COLOR_NEUTRAL} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function ImportanceTooltip({
  active,
  payload,
  glossary,
  featureValues,
  maxAbs,
}: {
  active?: boolean
  payload?: Array<{ payload: AttributionRow }>
  glossary?: Record<string, GlossaryEntry>
  featureValues?: Record<string, number | string | null>
  maxAbs: number
}) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload

  return (
    <div className="rounded-md border bg-popover px-3 py-2 shadow-md max-w-[300px]">
      <p className="text-xs font-medium">{row.fullLabel}</p>
      <p className="text-sm font-mono mt-0.5">
        {formatTooltipValue(row.value, maxAbs)}
      </p>
      <FeatureMetaFooter
        rawKey={row.rawKey}
        glossary={glossary}
        featureValues={featureValues}
      />
    </div>
  )
}