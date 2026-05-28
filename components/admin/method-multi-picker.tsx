"use client";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

export function MethodMultiPicker({
  label,
  available,
  selected,
  onChange,
  max = 2,
  emptyText,
}: {
  label: string;
  available: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  max?: number;
  emptyText?: string;
}) {
  const isFull = selected.length >= max;

  function toggle(method: string) {
    if (selected.includes(method)) {
      onChange(selected.filter((m) => m !== method));
    } else if (!isFull) {
      onChange([...selected, method]);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-xs text-muted-foreground">
          {selected.length}/{max} selected
        </span>
      </div>

      {available.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          {emptyText ?? "No methods seeded for this modality yet."}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {available.map((method) => {
            const isSelected = selected.includes(method);
            const disabled = !isSelected && isFull;
            return (
              <Badge
                key={method}
                variant={isSelected ? "default" : "outline"}
                className={
                  disabled
                    ? "cursor-not-allowed opacity-40"
                    : "cursor-pointer"
                }
                onClick={() => !disabled && toggle(method)}
              >
                {method}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}