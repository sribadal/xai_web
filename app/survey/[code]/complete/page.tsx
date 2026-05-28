import { notFound } from "next/navigation";
import { loadSummary, type SummaryAnswer } from "@/lib/survey/guards";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const MODALITY_LABEL: Record<string, string> = {
  ATTRIBUTION: "Attribution",
  COUNTERFACTUAL: "Counterfactual",
  CASE_BASED: "Case-based",
  RULE_BASED: "Rule-based",
};
const MODEL_LABEL: Record<string, string> = {
  rsf: "RSF survival",
  condor: "ConDOR quality of life",
};
const FLOW_LABEL: Record<string, string> = {
  background: "Background",
  "per-vignette": "Per vignette",
  "modality-summary": "Modality reflection",
  final: "Overall comparison",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const summary = await loadSummary(code);
  if (!summary) notFound();

  // Group answers by flow tag for the recap.
  const sections: { key: string; label: string; answers: SummaryAnswer[] }[] = [
    { key: "background", label: FLOW_LABEL.background, answers: [] },
    { key: "per-vignette", label: FLOW_LABEL["per-vignette"], answers: [] },
    {
      key: "modality-summary",
      label: FLOW_LABEL["modality-summary"],
      answers: [],
    },
    { key: "final", label: FLOW_LABEL.final, answers: [] },
  ];
  const orphans: SummaryAnswer[] = [];
  for (const a of summary.answers) {
    const sec = sections.find((s) => s.key === a.flowTag);
    if (sec) sec.answers.push(a);
    else orphans.push(a);
  }
  if (orphans.length > 0) {
    sections.push({ key: "other", label: "Other", answers: orphans });
  }

  const completedDate = summary.completedAt
    ? new Date(summary.completedAt)
    : null;
  const dateStr = completedDate
    ? completedDate.toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="mx-auto max-w-3xl py-12 px-6 space-y-12">
      <Hero
        title={summary.surveyTitle}
        description={summary.surveyDescription}
        accessCode={summary.accessCode}
        dateStr={dateStr}
        vignetteCount={summary.vignetteCount}
        totalAnswers={summary.totalAnswers}
      />

      <ClosingNote />

      {sections
        .filter((s) => s.answers.length > 0)
        .map((s) => (
          <Section key={s.key} label={s.label} answers={s.answers} />
        ))}

      <Footer />
    </div>
  );
}

// ─── Hero ───────────────────────────────────────────────────────────────────

function Hero({
  title,
  description,
  accessCode,
  dateStr,
  vignetteCount,
  totalAnswers,
}: {
  title: string;
  description: string | null;
  accessCode: string;
  dateStr: string | null;
  vignetteCount: number;
  totalAnswers: number;
}) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Session complete
        </p>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="space-y-3 text-center">
        <h1 className="font-heading text-4xl sm:text-5xl font-medium leading-tight tracking-tight">
          Thank you.
        </h1>
        <p className="text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
          You worked through {vignetteCount} patient vignette
          {vignetteCount !== 1 ? "s" : ""} and gave {totalAnswers} thoughtful
          response{totalAnswers !== 1 ? "s" : ""}. Below is a record of what
          you said, kept here for your reference.
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="py-5 px-6 flex flex-wrap items-center justify-between gap-4 text-sm">
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Study
            </p>
            <p className="font-medium">{title}</p>
            {description && (
              <p className="text-xs text-muted-foreground max-w-md">
                {description}
              </p>
            )}
          </div>
          <Separator orientation="vertical" className="h-12 hidden sm:block" />
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Participant
            </p>
            <p className="font-mono">{accessCode}</p>
          </div>
          {dateStr && (
            <>
              <Separator
                orientation="vertical"
                className="h-12 hidden sm:block"
              />
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Completed
                </p>
                <p>{dateStr}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

// ─── Closing note ───────────────────────────────────────────────────────────

function ClosingNote() {
  return (
    <section className="space-y-3 text-center">
      <p className="text-sm text-muted-foreground italic max-w-xl mx-auto leading-relaxed">
        Your feedback will help shape how explanations are designed for
        clinical prediction tools in oncology. You may close this window
        whenever you're ready, or stay and review what you said.
      </p>
    </section>
  );
}

// ─── Section (one per flow tag) ─────────────────────────────────────────────

function Section({
  label,
  answers,
}: {
  label: string;
  answers: SummaryAnswer[];
}) {
  // Group by questionId so per-vignette questions are grouped, with their
  // 8 (or fewer) answers underneath. Preserves the order they were sorted in.
  const groups: { questionId: string; questionText: string; items: SummaryAnswer[] }[] =
    [];
  for (const a of answers) {
    const last = groups[groups.length - 1];
    if (last && last.questionId === a.questionId) {
      last.items.push(a);
    } else {
      groups.push({
        questionId: a.questionId,
        questionText: a.questionText,
        items: [a],
      });
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex items-baseline gap-3">
        <h2 className="font-heading text-xl font-medium">{label}</h2>
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground tabular-nums">
          {answers.length} answer{answers.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-5">
        {groups.map((g) => (
          <QuestionGroup key={g.questionId + g.items[0].answeredAt} group={g} />
        ))}
      </div>
    </section>
  );
}

function QuestionGroup({
  group,
}: {
  group: { questionId: string; questionText: string; items: SummaryAnswer[] };
}) {
  // Single answer → simple layout. Multiple → indented per-cell list.
  if (group.items.length === 1) {
    const a = group.items[0];
    return (
      <div className="space-y-2">
        <QuestionText
          text={group.questionText}
          model={a.model}
          modality={a.modality}
        />
        <AnswerLine a={a} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <QuestionText text={group.questionText} />
      <div className="space-y-2 pl-4 border-l-2 border-border">
        {group.items.map((a, i) => (
          <div key={i} className="space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {a.model && (
                <Badge variant="secondary" className="text-[10px] font-normal">
                  {MODEL_LABEL[a.model] ?? a.model}
                </Badge>
              )}
              {a.modality && (
                <Badge variant="outline" className="text-[10px] font-normal">
                  {MODALITY_LABEL[a.modality] ?? a.modality}
                </Badge>
              )}
            </div>
            <AnswerLine a={a} />
          </div>
        ))}
      </div>
    </div>
  );
}

function QuestionText({
  text,
  model,
  modality,
}: {
  text: string;
  model?: "rsf" | "condor" | null;
  modality?: string | null;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium leading-snug">{text}</p>
      {(model || modality) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {model && (
            <Badge variant="secondary" className="text-[10px] font-normal">
              {MODEL_LABEL[model] ?? model}
            </Badge>
          )}
          {modality && (
            <Badge variant="outline" className="text-[10px] font-normal">
              {MODALITY_LABEL[modality] ?? modality}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

function AnswerLine({ a }: { a: SummaryAnswer }) {
  if (a.openText) {
    return (
      <blockquote className="text-sm leading-relaxed text-foreground/90 border-l-2 border-[color:var(--chart-2)] pl-3 italic">
        &ldquo;{a.openText}&rdquo;
      </blockquote>
    );
  }
  if (a.rankingLabels && a.rankingLabels.length > 0) {
    return (
      <ol className="text-sm text-foreground/90 space-y-0.5">
        {a.rankingLabels.map((l, i) => (
          <li key={i} className="flex items-baseline gap-2">
            <span className="text-xs tabular-nums text-muted-foreground w-4">
              {i + 1}.
            </span>
            <span>{l}</span>
          </li>
        ))}
      </ol>
    );
  }
  if (a.answerLabels.length > 0) {
    return (
      <p className="text-sm text-foreground/90">
        {a.answerLabels.join(", ")}
      </p>
    );
  }
  return (
    <p className="text-xs italic text-muted-foreground">
      (no answer recorded)
    </p>
  );
}

// ─── Footer ─────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="pt-8 border-t border-border space-y-2 text-center">
      <p className="text-xs text-muted-foreground">
        This is your session record. Your answers cannot be changed from here.
      </p>
      <p className="text-xs text-muted-foreground">
        Questions? Contact the study team.
      </p>
    </footer>
  );
}