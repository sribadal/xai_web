"use client";

import { createContext, useContext, type ReactNode } from "react";

export type ChartSize = "default" | "large";

const ChartSizeContext = createContext<ChartSize>("default");

export function ChartSizeProvider({
  value,
  children,
}: {
  value: ChartSize;
  children: ReactNode;
}) {
  return (
    <ChartSizeContext.Provider value={value}>
      {children}
    </ChartSizeContext.Provider>
  );
}

export function useChartSize(): ChartSize {
  return useContext(ChartSizeContext);
}