import Link from "next/link"
import { getSurveys, getGlossaryTerms, getTagGroups, getParticipants } from "./actions"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

export default async function AdminPage() {
  const [surveys, glossary, tagGroups, participants] = await Promise.all([
    getSurveys(),
    getGlossaryTerms(),
    getTagGroups(),
    getParticipants(),
  ])

  const cards = [
    {
      title: "Surveys",
      description: `${surveys.length} survey${surveys.length !== 1 ? "s" : ""}`,
      href: "/admin/surveys",
      count: surveys.length,
    },
    {
      title: "Glossary",
      description: `${glossary.length} term${glossary.length !== 1 ? "s" : ""}`,
      href: "/admin/glossary",
      count: glossary.length,
    },
    {
      title: "Taxonomy",
      description: `${tagGroups.length} group${tagGroups.length !== 1 ? "s" : ""}`,
      href: "/admin/taxonomy",
      count: tagGroups.length,
    },
    {
      title: "Participants",
      description: `${participants.length} participant${participants.length !== 1 ? "s" : ""}`,
      href: "/admin/participants",
      count: participants.length,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="hover:border-foreground/20 transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <CardDescription>{card.title}</CardDescription>
                <CardTitle className="text-3xl tabular-nums">{card.count}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}