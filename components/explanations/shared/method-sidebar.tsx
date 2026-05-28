"use client";

import { useState, type ReactNode } from "react";
import { useChartSize } from "./chart-size-context";

type Props = {
  title: string;
  description: string;
  children?: ReactNode;
  defaultOpen?: boolean;
};

export function MethodSidebar({
  title,
  description,
  children,
  defaultOpen,
}: Props) {
  const size = useChartSize();
  const initialOpen = defaultOpen ?? size === "large";
  const [open, setOpen] = useState(initialOpen);

  return (
    <div
      className={
        "shrink-0 hidden md:block transition-all duration-200 " +
        (open ? "w-[240px]" : "w-[32px]")
      }
    >
      <div
        className={
          "rounded-md border border-border/60 bg-muted/30 sticky top-4 " +
          (open ? "p-4 space-y-2" : "p-1")
        }
      >
        {/* Toggle */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Collapse method info" : "Expand method info"}
          title={open ? "Collapse method info" : "Expand method info"}
          className={
            "flex items-center justify-center w-6 h-6 rounded " +
            "text-muted-foreground hover:text-foreground hover:bg-muted " +
            "transition-colors " +
            (open ? "ml-auto" : "mx-auto")
          }
        >
          <ChevronIcon direction={open ? "right" : "left"} />
        </button>

        {open && (
          <>
            <p className="text-xs font-medium">{title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
            {children}
          </>
        )}
      </div>
    </div>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  const d =
    direction === "left"
      ? "M15 18l-6-6 6-6"
      : "M9 18l6-6-6-6";
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

export function MethodSidebarSection({
  label,
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  return (
    <div className="pt-2 border-t border-border/40 space-y-1">
      {label && (
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
      )}
      {children}
    </div>
  );
}

export function LegendSwatch({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="inline-block w-2.5 h-2.5 rounded-sm"
        style={{ background: color }}
      />
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}