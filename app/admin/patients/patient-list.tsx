"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type Patient = {
  id: string
  externalId: string
  modelType: string
  prediction: unknown
  notes: string | null
  createdAt: Date
  _count: { explanations: number }
}

function getRiskScore(prediction: unknown): number | null {
  if (
    prediction &&
    typeof prediction === "object" &&
    "risk_score" in prediction
  ) {
    return Number((prediction as Record<string, unknown>).risk_score)
  }
  return null
}

export function PatientList({
  patients,
  currentModel,
}: {
  patients: Patient[]
  currentModel: string | undefined
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleModelChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "all") {
      params.delete("model")
    } else {
      params.set("model", value)
    }
    router.push(`/admin/patients?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Patients</h1>
          <p className="text-muted-foreground mt-1">
            {patients.length} patient{patients.length !== 1 ? "s" : ""} loaded
          </p>
        </div>
        <div className="w-48">
          <Select
            value={currentModel ?? "all"}
            onValueChange={handleModelChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All models</SelectItem>
              <SelectItem value="rsf">RSF (survival)</SelectItem>
              <SelectItem value="condor">ConDOR (QoL)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {patients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No patients found. Run the seed script first.
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient ID</TableHead>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">Risk score</TableHead>
                <TableHead className="text-right">Explanations</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((p) => {
                const risk = getRiskScore(p.prediction)
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link
                        href={`/admin/patients/${p.id}`}
                        className="font-mono text-sm hover:underline"
                      >
                        {p.externalId}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{p.modelType.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {risk !== null ? risk.toFixed(1) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {p._count.explanations}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {p.notes || "—"}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}