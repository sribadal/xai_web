type Props = {
  value: number
  onChange: (n: number) => void
  options: readonly number[]
  maxAvailable: number
  label?: string
}

export const DEFAULT_TOP_N_OPTIONS = [5, 8, 10, 15, 20] as const

export function TopNSelector({
  value,
  onChange,
  options,
  maxAvailable,
  label = "Show:",
}: Props) {
  const visibleOptions = options.filter((opt) => opt <= maxAvailable)
  if (visibleOptions.length < 2) return null

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <div className="flex rounded-md border border-border overflow-hidden">
        {visibleOptions.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-2 py-0.5 text-[10px] font-mono transition-colors ${
              value === opt
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}