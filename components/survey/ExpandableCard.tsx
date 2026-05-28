"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChartSizeProvider } from "@/components/explanations/shared/chart-size-context";

export function ExpandableCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => {
        setShowContent(true);
        window.dispatchEvent(new Event("resize"));
      }, 200);
      return () => clearTimeout(t);
    } else {
      setShowContent(false);
    }
  }, [open]);

  return (
    <>
      <div className="survey-card" style={{ position: "relative" }}>
        <div className="survey-card-label">{label}</div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Enlarge"
          title="Enlarge"
          style={{
            position: "absolute",
            top: "0.5rem",
            right: "0.5rem",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            borderRadius: 6,
            border: "1px solid var(--border, rgba(0,0,0,0.1))",
            background: "var(--background, white)",
            cursor: "pointer",
            color: "var(--muted-foreground, #666)",
            zIndex: 1,
          }}
        >
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
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        </button>
        {children}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="!max-w-[95vw] w-[95vw] max-h-[90vh] overflow-y-auto sm:!max-w-[95vw]">
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
          </DialogHeader>
          <div style={{ paddingTop: "0.5rem", width: "100%" }}>
            {showContent && (
              <ChartSizeProvider value="large">{children}</ChartSizeProvider>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}