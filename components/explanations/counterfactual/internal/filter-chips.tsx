import { FILTER_MODES } from "./card-sections"
import type { FilterMode } from "./types"

export function FilterChips({
  mode,
  setMode,
  counts,
}: {
  mode: FilterMode
  setMode: (m: FilterMode) => void
  counts: Record<FilterMode, number>
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-muted-foreground">Filter:</span>
      <div className="flex rounded-md border border-border overflow-hidden">
        {FILTER_MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`px-2 py-0.5 text-[10px] font-mono transition-colors ${
              mode === m.id
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground"
            }`}
            title={m.description}
          >
            {m.label} <span className="opacity-60">({counts[m.id]})</span>
          </button>
        ))}
      </div>
    </div>
  )
}