"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function Home() {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) {
      setError("Please enter your access code.")
      return
    }
    setError(null)
    setSubmitting(true)
    router.push(`/survey/${encodeURIComponent(trimmed)}`)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 py-16 font-sans dark:bg-black">
      <main className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="inline-block rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium tracking-wide text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            Research study
          </span>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Explaining AI predictions in Oncology
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-base leading-7 text-zinc-600 dark:text-zinc-400">
            Thank you for taking part. Enter the access code you were given to
            begin the questionnaire.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Enter your access code</CardTitle>
            <CardDescription>
              Your responses are anonymous and linked only to this code.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Access code</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value)
                    if (error) setError(null)
                  }}
                  placeholder="Enter your code"
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                />
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Loading…" : "Begin survey"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-500">
          Don&apos;t have a code? Please contact the study coordinator.
        </p>
      </main>
    </div>
  )
}