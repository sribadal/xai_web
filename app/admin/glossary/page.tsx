import { getGlossaryTerms, getLocales } from "../actions"
import { GlossaryManager } from "./glossary-manager"

export default async function GlossaryPage() {
  const [terms, locales] = await Promise.all([getGlossaryTerms(), getLocales()])
  return <GlossaryManager terms={terms} locales={locales} />
}