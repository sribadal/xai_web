"use client";

import { useState, useTransition } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type {
  ResultsPayload,
  QuestionResult,
  ClosedResult,
  OpenResult,
  RankingResult,
  ModalityKey,
  ModelKey,
} from "@/app/admin/results-actions";
import {
  exportResponsesCsv,
  exportSessionsCsv,
} from "@/app/admin/results-actions";

const MODALITIES: { key: ModalityKey; label: string }[] = [
  { key: "ATTRIBUTION", label: "Attribution" },
  { key: "COUNTERFACTUAL", label: "Counterfactual" },
  { key: "CASE_BASED", label: "Case-based" },
  { key: "RULE_BASED", label: "Rule-based" },
];

const MODELS: { key: ModelKey; label: string }[] = [
  { key: "rsf", label: "RSF (survival)" },
  { key: "condor", label: "ConDOR (QoL)" },
];

export function SurveyResults({
  surveyId,
  results,
}: {
  surveyId: string;
  results: ResultsPayload;
}) {
  if (results.sessions.total === 0) {
    return (
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-medium">Results</h2>
          <p className="text-sm text-muted-foreground">
            No sessions yet. Once a participant starts the survey, their
            progress and answers will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Results</h2>
        <p className="text-sm text-muted-foreground">
          Live view of sessions and responses for this survey.
        </p>
      </div>

      <OverviewSection surveyId={surveyId} results={results} />
      <PerQuestionSection results={results} />
      <PerSessionSection results={results} />
    </div>
  );
}

function OverviewSection({
  surveyId,
  results,
}: {
  surveyId: string;
  results: ResultsPayload;
}) {
  const { sessions } = results;
  const [pending, startTransition] = useTransition();

  function downloadCsv(content: string, filename: string) {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleExportResponses() {
    startTransition(async () => {
      const csv = await exportResponsesCsv(surveyId);
      downloadCsv(csv, `survey-${surveyId.slice(0, 8)}-responses.csv`);
    });
  }
  function handleExportSessions() {
    startTransition(async () => {
      const csv = await exportSessionsCsv(surveyId);
      downloadCsv(csv, `survey-${surveyId.slice(0, 8)}-sessions.csv`);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Overview</CardTitle>
        <CardDescription>
          {sessions.total} session{sessions.total !== 1 ? "s" : ""} ·{" "}
          {(sessions.completionRate * 100).toFixed(0)}% completed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile label="In progress" value={sessions.inProgress} />
          <StatTile label="Completed" value={sessions.completed} />
          <StatTile label="Abandoned" value={sessions.abandoned} />
          <StatTile label="Total" value={sessions.total} />
        </div>
        <Separator />
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportResponses}
            disabled={pending}
          >
            {pending ? "Preparing…" : "Export responses (CSV)"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportSessions}
            disabled={pending}
          >
            {pending ? "Preparing…" : "Export sessions (CSV)"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-medium tabular-nums">{value}</p>
    </div>
  );
}

function PerQuestionSection({ results }: { results: ResultsPayload }) {
  const ordered = [...results.questions].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );

  if (ordered.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Per-question breakdown</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No questions in this survey.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Per-question breakdown</CardTitle>
        <CardDescription>
          Distributions and aggregates per question. Per-vignette items are
          split by model × modality.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="space-y-2">
          {ordered.map((q, i) => (
            <QuestionResultCard key={q.id} q={q} index={i} />
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}

function QuestionResultCard({ q, index }: { q: QuestionResult; index: number }) {
  const tagLabel = q.flowTag ?? "—";
  return (
    <AccordionItem value={q.id} className="border rounded-lg px-4">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-start gap-3 text-left">
          <span className="text-muted-foreground text-sm font-mono w-6 mt-0.5">
            {index + 1}
          </span>
          <div>
            <p className="font-medium">{q.text}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {q.type}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {tagLabel}
              </Badge>
              {!q.active && (
                <Badge variant="outline" className="text-xs">
                  retired
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs">
                n = {q.totalResponses}
              </Badge>
            </div>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-4">
        {q.shape === "OPEN" ? (
          <OpenResultView q={q} />
        ) : q.shape === "RANKING" ? (
          <RankingResultView q={q} />
        ) : (
          <ClosedResultView q={q} />
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

// ── Closed (Likert / Radio / Checkbox) ──

function ClosedResultView({ q }: { q: ClosedResult }) {
  const isPerVignette = q.flowTag === "per-vignette";

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-muted-foreground mb-2">
          Overall
          {q.overallMean !== null && (
            <span className="ml-2">
              · mean = <span className="tabular-nums">{q.overallMean.toFixed(2)}</span>
            </span>
          )}
        </p>
        <DistributionBars q={q} counts={q.overall} />
      </div>

      {isPerVignette && (
        <>
          <Separator />
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              By model × modality
            </p>
            <Tabs defaultValue="rsf">
              <TabsList>
                {MODELS.map((m) => (
                  <TabsTrigger key={m.key} value={m.key}>
                    {m.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {MODELS.map((m) => (
                <TabsContent key={m.key} value={m.key} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {MODALITIES.map((mod) => {
                      const cellCounts =
                        q.byCell[m.key]?.[mod.key] ?? {};
                      const cellMean = q.cellMeans[m.key]?.[mod.key] ?? null;
                      const total = Object.values(cellCounts).reduce(
                        (a, b) => a + b,
                        0,
                      );
                      return (
                        <div
                          key={mod.key}
                          className="rounded-md border p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{mod.label}</p>
                            <p className="text-xs text-muted-foreground tabular-nums">
                              n = {total}
                              {cellMean !== null && (
                                <span> · μ = {cellMean.toFixed(2)}</span>
                              )}
                            </p>
                          </div>
                          <DistributionBars
                            q={q}
                            counts={cellCounts}
                            compact
                          />
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </>
      )}
    </div>
  );
}

function DistributionBars({
  q,
  counts,
  compact = false,
}: {
  q: ClosedResult;
  counts: Record<string, number>;
  compact?: boolean;
}) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">No responses yet.</p>
    );
  }
  return (
    <div className={compact ? "space-y-1" : "space-y-1.5"}>
      {q.answerOptions.map((opt) => {
        const c = counts[opt.id] ?? 0;
        const pct = total === 0 ? 0 : (c / total) * 100;
        return (
          <div key={opt.id} className="flex items-center gap-2 text-xs">
            <span
              className={
                "shrink-0 text-muted-foreground " +
                (compact ? "w-28" : "w-40")
              }
              title={opt.label}
            >
              {opt.label}
            </span>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-foreground/70"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="shrink-0 w-12 text-right tabular-nums text-muted-foreground">
              {c} ({pct.toFixed(0)}%)
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Ranking ──

function RankingResultView({ q }: { q: RankingResult }) {
  if (q.totalRankings === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">
        No rankings submitted yet.
      </p>
    );
  }
  const sorted = [...q.answerOptions].sort((a, b) => {
    const ra = q.meanRank[a.id];
    const rb = q.meanRank[b.id];
    if (ra === null && rb === null) return 0;
    if (ra === null) return 1;
    if (rb === null) return -1;
    return ra - rb;
  });
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Lower mean rank = preferred. n = {q.totalRankings} ranking
        {q.totalRankings !== 1 ? "s" : ""}.
      </p>
      <div className="space-y-1.5">
        {sorted.map((opt) => {
          const mean = q.meanRank[opt.id];
          const first = q.firstPlace[opt.id] ?? 0;
          const firstPct =
            q.totalRankings === 0 ? 0 : (first / q.totalRankings) * 100;
          return (
            <div
              key={opt.id}
              className="flex items-center gap-3 text-sm border rounded-md p-2"
            >
              <span className="flex-1">{opt.label}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                mean rank ={" "}
                <span className="font-medium text-foreground">
                  {mean === null ? "—" : mean.toFixed(2)}
                </span>
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                1st = {first} ({firstPct.toFixed(0)}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OpenResultView({ q }: { q: OpenResult }) {
  if (q.entries.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">
        No text responses yet.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {q.entries.map((e, i) => (
        <div key={i} className="rounded-md border p-3 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono">
              {e.accessCode}
            </Badge>
            {e.model && (
              <Badge variant="secondary" className="text-xs">
                {e.model}
              </Badge>
            )}
            {e.modality && (
              <Badge variant="secondary" className="text-xs">
                {e.modality.toLowerCase()}
              </Badge>
            )}
          </div>
          <p className="text-sm whitespace-pre-wrap">{e.text}</p>
        </div>
      ))}
    </div>
  );
}

function PerSessionSection({ results }: { results: ResultsPayload }) {
  if (results.perSession.length === 0) {
    return null;
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Per-participant drill-down</CardTitle>
        <CardDescription>
          Expand a session to see every answer in display order.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="space-y-2">
          {results.perSession.map((s) => (
            <SessionDrillCard key={s.sessionId} s={s} />
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}

function SessionDrillCard({
  s,
}: {
  s: ResultsPayload["perSession"][number];
}) {
  return (
    <AccordionItem value={s.sessionId} className="border rounded-lg px-4">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-3 text-left">
          <span className="font-mono text-sm">{s.accessCode}</span>
          <Badge variant="outline" className="text-xs">
            {s.status.toLowerCase()}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {s.answers.length} answer{s.answers.length !== 1 ? "s" : ""}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-2">
        {s.answers.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            No answers recorded.
          </p>
        ) : (
          <div className="space-y-2">
            {s.answers.map((a, i) => (
              <div
                key={`${a.questionId}-${i}`}
                className="border-l-2 pl-3 py-1 space-y-1"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{a.questionText}</p>
                  {a.model && (
                    <Badge variant="secondary" className="text-xs">
                      {a.model}
                    </Badge>
                  )}
                  {a.modality && (
                    <Badge variant="secondary" className="text-xs">
                      {a.modality.toLowerCase()}
                    </Badge>
                  )}
                </div>
                <AnswerDisplay a={a} />
              </div>
            ))}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

function AnswerDisplay({
  a,
}: {
  a: ResultsPayload["perSession"][number]["answers"][number];
}) {
  if (a.openText) {
    return (
      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
        {a.openText}
      </p>
    );
  }
  if (a.rankingLabels && a.rankingLabels.length > 0) {
    return (
      <ol className="text-sm text-muted-foreground list-decimal list-inside">
        {a.rankingLabels.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ol>
    );
  }
  if (a.answerLabels.length > 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {a.answerLabels.join(", ")}
      </p>
    );
  }
  return (
    <p className="text-xs text-muted-foreground italic">No answer recorded.</p>
  );
}