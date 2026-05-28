import { getTagGroups } from "../actions"
import { TaxonomyManager } from "./taxonomy-manager"

export default async function TaxonomyPage() {
  const tagGroups = await getTagGroups()
  return <TaxonomyManager tagGroups={tagGroups} />
}