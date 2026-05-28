import type { GlossaryEntry } from "@/app/admin/patients/actions"

export type CaseRecord = Record<string, unknown>

export type CaseBasedViewProps = {
  content: unknown
  metadata: Record<string, unknown>
  method: string
  features: Record<string, unknown>
  featuresRaw?: Record<string, unknown>
  prediction?: Record<string, unknown>
  glossary?: Record<string, GlossaryEntry>
}

export type PrototypeContent = {
  similar_prototypes: CaseRecord[]
  feature_diffs_to_nearest: Record<string, number>
  shared_features_with_nearest: Record<string, unknown>
}

export type CompareResult =
  | "same"
  | "higher"
  | "lower"
  | "different"
  | "missing"

export type DiffRow = {
  name: string
  fullLabel: string
  rawKey: string
  diff: number
  queryVal: unknown
  caseVal: unknown
}