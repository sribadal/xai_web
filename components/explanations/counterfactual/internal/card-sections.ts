import {
  PRE_TREATMENT_CATEGORIES,
  type Actionability,
} from "@/lib/feature-actionability"
import type { FilterMode } from "./types"

export const CARD_SECTIONS: {
  id: string
  label: string
  cats: Actionability[]
}[] = [
  { id: "treatment", label: "Treatment", cats: ["treatment", "semi"] },
  { id: "demographics", label: "Demographics", cats: ["demographics"] },
  { id: "comorbidity", label: "Comorbidity & status", cats: ["comorbidity"] },
  { id: "labs", label: "Labs", cats: ["lab"] },
  { id: "tumour", label: "Tumour & staging", cats: ["tumour", "staging"] },
  { id: "metastasis", label: "Metastases", cats: ["metastasis"] },
  { id: "outcome", label: "Outcome", cats: ["outcome"] },
]

const TREATMENT_CATS = new Set<Actionability>(["treatment", "semi"])
const PRE_TREATMENT_CATS = new Set<Actionability>(PRE_TREATMENT_CATEGORIES)

export const FILTER_MODES: {
  id: FilterMode
  label: string
  includes: Set<Actionability>
  description: string
}[] = [
  {
    id: "treatment",
    label: "Treatment",
    includes: TREATMENT_CATS,
    description:
      "Only treatment decisions and their observations — what a clinician could actually do differently.",
  },
  {
    id: "clinical",
    label: "+ Pre-treatment",
    includes: new Set([...TREATMENT_CATS, ...PRE_TREATMENT_CATS]),
    description:
      "Treatment plus pre-treatment features: demographics, lab values, comorbidity, tumour characteristics, staging, and metastatic sites.",
  },
  {
    id: "all",
    label: "All",
    includes: new Set([
      "treatment",
      "semi",
      ...PRE_TREATMENT_CATEGORIES,
      "outcome",
    ]),
    description:
      "Every feature the model would change, including outcomes. Useful for diagnostic inspection, not for advice.",
  },
]