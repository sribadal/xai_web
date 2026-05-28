import { ACTIONABILITY_META } from "@/lib/feature-actionability"
import type { ChangedFeature } from "./types"

export function ExactValuesTable({ changed }: { changed: ChangedFeature[] }) {
  if (changed.length === 0) return null
  return (
    <details className="group">
      <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
        Show exact changed values ▸
      </summary>
      <div className="mt-2 rounded-md border overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-1.5 font-medium">Feature</th>
              <th className="text-left p-1.5 font-medium">Category</th>
              <th className="text-right p-1.5 font-medium">Current</th>
              <th className="text-right p-1.5 font-medium">Counterfactual</th>
              <th className="text-left p-1.5 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {changed.map((c) => {
              const meta = ACTIONABILITY_META[c.actionability]
              return (
                <tr key={c.rawKey} className="border-b last:border-0">
                  <td className="p-1.5">{c.label}</td>
                  <td className="p-1.5">
                    <span
                      className="inline-block text-[9px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded"
                      style={{
                        background: `${meta.color}20`,
                        color: meta.color,
                      }}
                    >
                      {meta.label}
                    </span>
                  </td>
                  <td className="p-1.5 text-right font-mono text-muted-foreground">
                    {c.originalDisplay}
                  </td>
                  <td
                    className={`p-1.5 text-right font-mono font-medium ${
                      c.implausible
                        ? "text-amber-700 dark:text-amber-400"
                        : "text-sky-700 dark:text-sky-400"
                    }`}
                  >
                    {c.cfDisplay}
                  </td>
                  <td className="p-1.5 text-[11px] text-muted-foreground italic">
                    {c.implausibleReason ?? ""}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </details>
  )
}