import type { GlossaryEntry } from "@/app/admin/patients/actions";
import type { Locale } from "@/lib/rule-based-i18n";

export type FiringRule = {
  rule: string;
  coef: number;
  support?: number;
};

export type RuleBasedViewProps = {
  content: Record<string, unknown>;
  method: string;
  glossary?: Record<string, GlossaryEntry>;
  modelType?: "rsf" | "condor";
  featuresRaw?: Record<string, unknown> | null;
  locale?: Locale;
};

export interface ParsedCondition {
  feature: string;
  operator: string;
  value: string;
  raw: string;
}