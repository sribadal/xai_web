import { horizonLabel } from "./horizons"

export function HorizonChips({
  horizons,
  active,
  onSelect,
}: {
  horizons: string[]
  active: string
  onSelect: (h: string) => void
}) {
  if (horizons.length <= 1) return null

  return (
    <div className="flex flex-col gap-1">
      {horizons.map((h) => {
        const isActive = h === active
        return (
          <button
            key={h}
            onClick={() => onSelect(h)}
            className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[11px] transition-all text-left ${
              isActive
                ? "border-foreground/50 bg-foreground/10 text-foreground font-medium"
                : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
            }`}
            title={`Show the ${horizonLabel(h).toLowerCase()} counterfactual`}
          >
            <span
              className="inline-block w-2 h-2 rounded-full shrink-0"
              style={{
                background: isActive
                  ? "currentColor"
                  : "hsl(var(--muted-foreground))",
                opacity: isActive ? 1 : 0.5,
              }}
            />
            {horizonLabel(h)}
          </button>
        )
      })}
    </div>
  )
}