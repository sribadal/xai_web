import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { loadSummary, type SummaryAnswer } from "@/lib/survey/guards";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

/* ------------------------------------------------------------------ */
/*  Translations                                                       */
/* ------------------------------------------------------------------ */

const T = {
  en: {
    sessionComplete: "Session complete",
    thankYou: "Thank you.",
    heroBody: (vigs: number, ans: number) =>
      `You worked through ${vigs} patient vignette${vigs !== 1 ? "s" : ""} and gave ${ans} thoughtful response${ans !== 1 ? "s" : ""}. Below is a record of what you said, kept here for your reference.`,
    study: "Study",
    participant: "Participant",
    completed: "Completed",
    closingNote:
      "Your feedback will help shape how explanations are designed for clinical prediction tools in oncology. You may close this window whenever you're ready, or stay and review what you said.",
    answers: (n: number) => `${n} answer${n !== 1 ? "s" : ""}`,
    noAnswer: "(no answer recorded)",
    footerRecord: "This is your session record. Your answers cannot be changed from here.",
    footerContact: "Questions? Contact the study team.",
    other: "Other",
  },
  nl: {
    sessionComplete: "Sessie afgerond",
    thankYou: "Dank u wel.",
    heroBody: (vigs: number, ans: number) =>
      `U heeft ${vigs} patiëntscenario${vigs !== 1 ? "'s" : ""} doorgewerkt en ${ans} doordachte antwoord${ans !== 1 ? "en" : ""} gegeven. Hieronder vindt u een overzicht van uw antwoorden, bewaard ter referentie.`,
    study: "Onderzoek",
    participant: "Deelnemer",
    completed: "Afgerond",
    closingNote:
      "Uw feedback draagt bij aan het ontwerp van uitleg bij klinische voorspellingsmodellen in de oncologie. U kunt dit venster sluiten wanneer u wilt, of blijven en uw antwoorden nalezen.",
    answers: (n: number) => `${n} antwoord${n !== 1 ? "en" : ""}`,
    noAnswer: "(geen antwoord vastgelegd)",
    footerRecord: "Dit is uw sessieoverzicht. Uw antwoorden kunnen hier niet worden gewijzigd.",
    footerContact: "Vragen? Neem contact op met het onderzoeksteam.",
    other: "Overig",
  },
} as const;

const MODALITY_LABEL: Record<string, Record<string, string>> = {
  ATTRIBUTION: { en: "Attribution", nl: "Attributie" },
  COUNTERFACTUAL: { en: "Counterfactual", nl: "Contrafactisch" },
  CASE_BASED: { en: "Case-based", nl: "Casus-gebaseerd" },
  RULE_BASED: { en: "Rule-based", nl: "Regelgebaseerd" },
};

const MODEL_LABEL: Record<string, Record<string, string>> = {
  rsf: { en: "RSF survival", nl: "RSF overleving" },
  condor: { en: "ConDOR quality of life", nl: "ConDOR kwaliteit van leven" },
};

const FLOW_LABEL: Record<string, Record<string, string>> = {
  background: { en: "Background", nl: "Achtergrond" },
  "per-vignette": { en: "Per vignette", nl: "Per vignet" },
  "modality-summary": { en: "Modality reflection", nl: "Reflectie op methode" },
  final: { en: "Overall comparison", nl: "Algehele vergelijking" },
};

function pick(map: Record<string, Record<string, string>>, key: string, locale: string): string {
  return map[key]?.[locale] ?? map[key]?.en ?? key;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  
  const cookieStore = await cookies();
  const locale = (cookieStore.get("locale")?.value === "nl" ? "nl" : "en") as "en" | "nl";
  const summary = await loadSummary(code, locale);
  if (!summary) notFound();
  const t = T[locale];

  const sections: { key: string; label: string; answers: SummaryAnswer[] }[] = [
    { key: "background", label: pick(FLOW_LABEL, "background", locale), answers: [] },
    { key: "per-vignette", label: pick(FLOW_LABEL, "per-vignette", locale), answers: [] },
    { key: "modality-summary", label: pick(FLOW_LABEL, "modality-summary", locale), answers: [] },
    { key: "final", label: pick(FLOW_LABEL, "final", locale), answers: [] },
  ];
  const orphans: SummaryAnswer[] = [];
  for (const a of summary.answers) {
    const sec = sections.find((s) => s.key === a.flowTag);
    if (sec) sec.answers.push(a);
    else orphans.push(a);
  }
  if (orphans.length > 0) {
    sections.push({ key: "other", label: t.other, answers: orphans });
  }

  const completedDate = summary.completedAt
    ? new Date(summary.completedAt)
    : null;
  const dateStr = completedDate
    ? completedDate.toLocaleDateString(locale === "nl" ? "nl-NL" : "en-GB", {
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
        t={t}
      />

      <ClosingNote t={t} />

      {sections
        .filter((s) => s.answers.length > 0)
        .map((s) => (
          <Section key={s.key} label={s.label} answers={s.answers} locale={locale} t={t} />
        ))}

      <Footer t={t} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */

type TDict = (typeof T)["en"] | (typeof T)["nl"];

function Hero({
  title,
  description,
  accessCode,
  dateStr,
  vignetteCount,
  totalAnswers,
  t,
}: {
  title: string;
  description: string | null;
  accessCode: string;
  dateStr: string | null;
  vignetteCount: number;
  totalAnswers: number;
  t: TDict;
}) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {t.sessionComplete}
        </p>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="space-y-3 text-center">
        <h1 className="font-heading text-4xl sm:text-5xl font-medium leading-tight tracking-tight">
          {t.thankYou}
        </h1>
        <p className="text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
          {t.heroBody(vignetteCount, totalAnswers)}
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="py-5 px-6 flex flex-wrap items-center justify-between gap-4 text-sm">
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              {t.study}
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
              {t.participant}
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
                  {t.completed}
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

/* ------------------------------------------------------------------ */
/*  Closing note                                                       */
/* ------------------------------------------------------------------ */

function ClosingNote({ t }: { t: TDict }) {
  return (
    <section className="space-y-3 text-center">
      <p className="text-sm text-muted-foreground italic max-w-xl mx-auto leading-relaxed">
        {t.closingNote}
      </p>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Section                                                            */
/* ------------------------------------------------------------------ */

function Section({
  label,
  answers,
  locale,
  t,
}: {
  label: string;
  answers: SummaryAnswer[];
  locale: string;
  t: TDict;
}) {
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
          {t.answers(answers.length)}
        </span>
      </div>

      <div className="space-y-5">
        {groups.map((g) => (
          <QuestionGroup
            key={g.questionId + g.items[0].answeredAt}
            group={g}
            locale={locale}
            t={t}
          />
        ))}
      </div>
    </section>
  );
}

function QuestionGroup({
  group,
  locale,
  t,
}: {
  group: { questionId: string; questionText: string; items: SummaryAnswer[] };
  locale: string;
  t: TDict;
}) {
  if (group.items.length === 1) {
    const a = group.items[0];
    return (
      <div className="space-y-2">
        <QuestionText
          text={group.questionText}
          model={a.model}
          modality={a.modality}
          locale={locale}
        />
        <AnswerLine a={a} t={t} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <QuestionText text={group.questionText} locale={locale} />
      <div className="space-y-2 pl-4 border-l-2 border-border">
        {group.items.map((a, i) => (
          <div key={i} className="space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {a.model && (
                <Badge variant="secondary" className="text-[10px] font-normal">
                  {pick(MODEL_LABEL, a.model, locale)}
                </Badge>
              )}
              {a.modality && (
                <Badge variant="outline" className="text-[10px] font-normal">
                  {pick(MODALITY_LABEL, a.modality, locale)}
                </Badge>
              )}
            </div>
            <AnswerLine a={a} t={t} />
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
  locale = "en",
}: {
  text: string;
  model?: "rsf" | "condor" | null;
  modality?: string | null;
  locale?: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium leading-snug">{text}</p>
      {(model || modality) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {model && (
            <Badge variant="secondary" className="text-[10px] font-normal">
              {pick(MODEL_LABEL, model, locale)}
            </Badge>
          )}
          {modality && (
            <Badge variant="outline" className="text-[10px] font-normal">
              {pick(MODALITY_LABEL, modality, locale)}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

function AnswerLine({ a, t }: { a: SummaryAnswer; t: TDict }) {
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
      {t.noAnswer}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer                                                             */
/* ------------------------------------------------------------------ */

function Footer({ t }: { t: TDict }) {
  return (
    <footer className="pt-8 border-t border-border space-y-2 text-center">
      <p className="text-xs text-muted-foreground">
        {t.footerRecord}
      </p>
      <p className="text-xs text-muted-foreground">
        {t.footerContact}
      </p>
    </footer>
  );
}