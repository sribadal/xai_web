"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  createQuestion,
  deleteQuestion,
  createAnswer,
  deleteAnswer,
  updateSurvey,
  updateQuestion,
  updateAnswer,
  retireAndReplaceQuestion,
  unpublishSurvey,
  reopenSurvey,
  getMethodsByModality,
  createParticipant,
  deleteParticipant,
} from "../../actions";

const QUESTION_TYPES = [
  { value: "LIKERT", label: "Likert scale" },
  { value: "RADIO", label: "Multiple choice (single)" },
  { value: "CHECKBOX", label: "Checkbox (multiple)" },
  { value: "OPEN", label: "Open text" },
  { value: "RANKING", label: "Ranking" },
] as const;

const MODALITIES = [
  { value: "ATTRIBUTION", label: "Attribution" },
  { value: "COUNTERFACTUAL", label: "Counterfactual" },
  { value: "CASE_BASED", label: "Case-based" },
  { value: "RULE_BASED", label: "Rule-based" },
] as const;

type ModalityValue = (typeof MODALITIES)[number]["value"];

type QuestionType = (typeof QUESTION_TYPES)[number]["value"];

type Locale = { id: string; name: string };
type TagGroup = {
  id: string;
  name: string;
  tags: { id: string; name: string }[];
};

type Patient = {
  id: string;
  externalId: string;
  notes: string | null;
  prediction: unknown;
};

type AnswerTranslation = { localeId: string; label: string };
type AnswerData = {
  id: string;
  value: number;
  displayOrder: number;
  translations: AnswerTranslation[];
};

type QuestionTranslation = {
  localeId: string;
  text: string;
  description: string | null;
  helperText: string | null;
};

type QuestionData = {
  id: string;
  type: string;
  isRequired: boolean;
  displayOrder: number;
  translations: QuestionTranslation[];
  answers: AnswerData[];
  tags: { tag: { id: string; name: string; group: { name: string } } }[];
  _count?: { responses: number };
};

type SurveyMethodRow = {
  id: string;
  modelType: string;
  modality: string;
  method: string;
};

type SurveyData = {
  id: string;
  status: string;
  rsfVignettePatientIds: string[];
  condorVignettePatientIds: string[];
  methods: SurveyMethodRow[];
  participants: ParticipantRow[];
  translations: {
    localeId: string;
    title: string;
    description: string | null;
  }[];
  questions: QuestionData[];
};

type PatientLists = { rsf: Patient[]; condor: Patient[] };

export function SurveyEditor({
  survey,
  locales,
  tagGroups,
  patients,
}: {
  survey: SurveyData;
  locales: Locale[];
  tagGroups: TagGroup[];
  patients: PatientLists;
}) {
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState(false);
  const isDraft = survey.status === "DRAFT";

  const title =
    survey.translations.find((t) => t.localeId === "en")?.title ??
    survey.translations[0]?.title ??
    "Untitled";

  const configSummary: string[] = [];
  configSummary.push(
    `Vignettes: ${survey.rsfVignettePatientIds.length}/4 RSF, ` +
      `${survey.condorVignettePatientIds.length}/4 ConDOR`,
  );
  configSummary.push(`Methods: ${survey.methods.length}/8 configured`);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-1">
            {survey.questions.length} question
            {survey.questions.length !== 1 ? "s" : ""}
            {" · "}
            {configSummary.join(" · ")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={survey.status === "DRAFT" ? "secondary" : "default"}>
            {survey.status.toLowerCase()}
          </Badge>

          {survey.status === "PUBLISHED" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">Unpublish</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Unpublish this survey?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will set the survey back to draft. Existing responses
                    are preserved. Questions with responses can only be
                    replaced, not edited directly.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => unpublishSurvey(survey.id)}>
                    Unpublish
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {survey.status === "CLOSED" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">Reopen survey</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reopen this survey?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will set the survey back to published. Participants
                    will be able to submit new responses.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => reopenSurvey(survey.id)}>
                    Reopen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {isDraft && (
            <>
              <Dialog open={editingSurvey} onOpenChange={setEditingSurvey}>
                <DialogTrigger asChild>
                  <Button variant="outline">Edit survey</Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit survey</DialogTitle>
                  </DialogHeader>
                  <SurveyForm
                    survey={survey}
                    locales={locales}
                    patients={patients}
                    onDone={() => setEditingSurvey(false)}
                  />
                </DialogContent>
              </Dialog>
              <Dialog open={addingQuestion} onOpenChange={setAddingQuestion}>
                <DialogTrigger asChild>
                  <Button>Add question</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add question</DialogTitle>
                  </DialogHeader>
                  <QuestionForm
                    surveyId={survey.id}
                    locales={locales}
                    tagGroups={tagGroups}
                    nextOrder={
                      survey.questions.length > 0
                        ? Math.max(
                            ...survey.questions.map((q) => q.displayOrder),
                          ) + 1
                        : 1
                    }
                    onDone={() => setAddingQuestion(false)}
                  />
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {survey.questions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No questions yet. Add your first one.
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {survey.questions.map((q, i) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={i}
              locales={locales}
              tagGroups={tagGroups}
              isDraft={isDraft}
              surveyId={survey.id}
            />
          ))}
        </Accordion>
      )}
    </div>
  );
}

function SurveyForm({
  survey,
  locales,
  patients,
  onDone,
}: {
  survey: SurveyData;
  locales: Locale[];
  patients: PatientLists;
  onDone: () => void;
}) {
  const [titles, setTitles] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const t of survey.translations) map[t.localeId] = t.title;
    return map;
  });
  const [descriptions, setDescriptions] = useState<Record<string, string>>(
    () => {
      const map: Record<string, string> = {};
      for (const t of survey.translations)
        if (t.description) map[t.localeId] = t.description;
      return map;
    },
  );

  // ── Method state: keyed "<model>:<modality>" → method string ──
  const [methodMap, setMethodMap] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const m of survey.methods) {
      map[`${m.modelType}:${m.modality}`] = m.method;
    }
    return map;
  });

  // ── Vignette state: 4 slots per model, one per modality ──
  const [rsfVignettes, setRsfVignettes] = useState<string[]>(() =>
    padArray(survey.rsfVignettePatientIds, 4),
  );
  const [condorVignettes, setCondorVignettes] = useState<string[]>(() =>
    padArray(survey.condorVignettePatientIds, 4),
  );

  // ── Available methods by (modelType, modality) ──
  // Loaded once per model since the source data doesn't change during editing.
  const [rsfAvailable, setRsfAvailable] = useState<Record<string, string[]>>(
    {},
  );
  const [condorAvailable, setCondorAvailable] = useState<
    Record<string, string[]>
  >({});
  const [methodsLoading, setMethodsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setMethodsLoading(true);
    Promise.all([getMethodsByModality("rsf"), getMethodsByModality("condor")])
      .then(([rsf, condor]) => {
        if (cancelled) return;
        setRsfAvailable(rsf);
        setCondorAvailable(condor);
      })
      .finally(() => {
        if (!cancelled) setMethodsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function setMethod(model: string, modality: string, method: string) {
    setMethodMap((prev) => ({ ...prev, [`${model}:${modality}`]: method }));
  }
  function clearMethod(model: string, modality: string) {
    setMethodMap((prev) => {
      const next = { ...prev };
      delete next[`${model}:${modality}`];
      return next;
    });
  }

  function setVignette(
    model: "rsf" | "condor",
    modalityIndex: number,
    patientId: string,
  ) {
    const setter = model === "rsf" ? setRsfVignettes : setCondorVignettes;
    setter((prev) => {
      const next = [...prev];
      next[modalityIndex] = patientId;
      return next;
    });
  }
  function clearVignette(model: "rsf" | "condor", modalityIndex: number) {
    const setter = model === "rsf" ? setRsfVignettes : setCondorVignettes;
    setter((prev) => {
      const next = [...prev];
      next[modalityIndex] = "";
      return next;
    });
  }

  // ── Submission ──
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    const translations = locales
      .filter((l) => titles[l.id]?.trim())
      .map((l) => ({
        localeId: l.id,
        title: titles[l.id].trim(),
        description: descriptions[l.id]?.trim() || undefined,
      }));

    if (translations.length === 0) return;

    const methodsPayload: {
      modelType: "rsf" | "condor";
      modality: ModalityValue;
      method: string;
    }[] = [];
    for (const [key, method] of Object.entries(methodMap)) {
      if (!method) continue;
      const [model, mod] = key.split(":");
      methodsPayload.push({
        modelType: model as "rsf" | "condor",
        modality: mod as ModalityValue,
        method,
      });
    }

    setSaving(true);
    await updateSurvey(survey.id, {
      translations,
      rsfVignettePatientIds: rsfVignettes.filter((id) => id !== ""),
      condorVignettePatientIds: condorVignettes.filter((id) => id !== ""),
      methods: methodsPayload,
    });
    setSaving(false);
    onDone();
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto pr-1">
        {/* ── Translations ── */}
        <Tabs defaultValue={locales[0]?.id ?? "en"}>
          <TabsList>
            {locales.map((l) => (
              <TabsTrigger key={l.id} value={l.id}>
                {l.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {locales.map((l) => (
            <TabsContent key={l.id} value={l.id} className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Title ({l.name})
                </Label>
                <Input
                  value={titles[l.id] ?? ""}
                  onChange={(e) =>
                    setTitles({ ...titles, [l.id]: e.target.value })
                  }
                  placeholder="Survey title..."
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Description ({l.name})
                </Label>
                <Textarea
                  value={descriptions[l.id] ?? ""}
                  onChange={(e) =>
                    setDescriptions({ ...descriptions, [l.id]: e.target.value })
                  }
                  placeholder="Optional description..."
                  rows={3}
                />
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <Separator />

        {/* ── Methods: RSF block then ConDOR block ── */}
        <div className="space-y-4">
          <div>
            <Label>Methods</Label>
            <p className="text-xs text-muted-foreground">
              Pick one method per (model × modality) cell. Each participant sees
              one explanation per cell.
            </p>
          </div>

          <MethodBlock
            model="rsf"
            modelLabel="RSF (survival)"
            methodMap={methodMap}
            available={rsfAvailable}
            loading={methodsLoading}
            setMethod={setMethod}
            clearMethod={clearMethod}
          />

          <MethodBlock
            model="condor"
            modelLabel="ConDOR (quality of life)"
            methodMap={methodMap}
            available={condorAvailable}
            loading={methodsLoading}
            setMethod={setMethod}
            clearMethod={clearMethod}
          />
        </div>

        <Separator />

        {/* ── Vignettes: 2 × 4 grid ── */}
        <div className="space-y-3">
          <div>
            <Label>Vignette patients</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Pick one patient per (model × modality) cell. A participant sees
              this patient when they reach that modality block for that model.
            </p>
          </div>

          <VignetteGrid
            rsfVignettes={rsfVignettes}
            condorVignettes={condorVignettes}
            patients={patients}
            setVignette={setVignette}
            clearVignette={clearVignette}
          />
        </div>

        <Separator />

        <div className="border-t pt-4 mt-4 bg-background sticky bottom-0">
          <Button onClick={handleSubmit} disabled={saving} className="w-full">
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function padArray(arr: string[], length: number): string[] {
  const out = [...arr];
  while (out.length < length) out.push("");
  return out.slice(0, length);
}

function MethodBlock({
  model,
  modelLabel,
  methodMap,
  available,
  loading,
  setMethod,
  clearMethod,
}: {
  model: "rsf" | "condor";
  modelLabel: string;
  methodMap: Record<string, string>;
  available: Record<string, string[]>;
  loading: boolean;
  setMethod: (model: string, modality: string, method: string) => void;
  clearMethod: (model: string, modality: string) => void;
}) {
  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <p className="text-sm font-medium">{modelLabel}</p>
        <div className="grid grid-cols-2 gap-4">
          {MODALITIES.map((mod) => {
            const key = `${model}:${mod.value}`;
            const current = methodMap[key] ?? "";
            const opts = available[mod.value] ?? [];
            return (
              <div key={mod.value} className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  {mod.label}
                </Label>
                {loading ? (
                  <p className="text-xs text-muted-foreground italic">
                    Loading…
                  </p>
                ) : opts.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No methods seeded.
                  </p>
                ) : (
                  <div className="flex items-center gap-1">
                    <Select
                      value={current || "__none"}
                      onValueChange={(v) => {
                        if (v === "__none") clearMethod(model, mod.value);
                        else setMethod(model, mod.value, v);
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select method..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">— none —</SelectItem>
                        {opts.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Vignette grid (2 rows × 4 columns) ──────────────────────────────────────

function VignetteGrid({
  rsfVignettes,
  condorVignettes,
  patients,
  setVignette,
  clearVignette,
}: {
  rsfVignettes: string[];
  condorVignettes: string[];
  patients: PatientLists;
  setVignette: (
    model: "rsf" | "condor",
    modalityIndex: number,
    patientId: string,
  ) => void;
  clearVignette: (model: "rsf" | "condor", modalityIndex: number) => void;
}) {
  return (
    <Card>
      <CardContent className="pt-4 space-y-4">
        <VignetteRow
          model="rsf"
          modelLabel="RSF (survival)"
          values={rsfVignettes}
          available={patients.rsf}
          setVignette={setVignette}
          clearVignette={clearVignette}
        />
        <Separator />
        <VignetteRow
          model="condor"
          modelLabel="ConDOR (quality of life)"
          values={condorVignettes}
          available={patients.condor}
          setVignette={setVignette}
          clearVignette={clearVignette}
        />
      </CardContent>
    </Card>
  );
}

function VignetteRow({
  model,
  modelLabel,
  values,
  available,
  setVignette,
  clearVignette,
}: {
  model: "rsf" | "condor";
  modelLabel: string;
  values: string[];
  available: Patient[];
  setVignette: (
    model: "rsf" | "condor",
    modalityIndex: number,
    patientId: string,
  ) => void;
  clearVignette: (model: "rsf" | "condor", modalityIndex: number) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{modelLabel}</p>
      <div className="grid grid-cols-2 gap-4">
        {MODALITIES.map((mod, idx) => {
          const current = values[idx] ?? "";
          return (
            <div key={mod.value} className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                {mod.label}
              </Label>
              {available.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  No {model} patients seeded.
                </p>
              ) : (
                <Select
                  value={current || "__none"}
                  onValueChange={(v) => {
                    if (v === "__none") clearVignette(model, idx);
                    else setVignette(model, idx, v);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pick a patient..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">— none —</SelectItem>
                    {available.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {patientLabel(p)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function patientLabel(p: Patient): string {
  const risk =
    p.prediction &&
    typeof p.prediction === "object" &&
    "risk_score" in p.prediction
      ? Number((p.prediction as { risk_score: unknown }).risk_score).toFixed(2)
      : "—";
  return `${p.externalId} · risk ${risk}${p.notes ? ` · ${p.notes.slice(0, 30)}` : ""}`;
}

function QuestionCard({
  question,
  index,
  locales,
  tagGroups,
  isDraft,
  surveyId,
}: {
  question: QuestionData;
  index: number;
  locales: Locale[];
  tagGroups: TagGroup[];
  isDraft: boolean;
  surveyId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [addingAnswer, setAddingAnswer] = useState(false);
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);

  const responseCount = question._count?.responses ?? 0;
  const hasResponses = responseCount > 0;

  const text =
    question.translations.find((t) => t.localeId === "en")?.text ??
    question.translations[0]?.text ??
    "Untitled question";

  const typeLabel =
    QUESTION_TYPES.find((t) => t.value === question.type)?.label ??
    question.type;

  return (
    <AccordionItem value={question.id} className="border rounded-lg px-4">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-3 text-left">
          <span className="text-muted-foreground text-sm font-mono w-6">
            {index + 1}
          </span>
          <div>
            <p className="font-medium">{text}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {typeLabel}
              </Badge>
              {question.isRequired && (
                <Badge variant="secondary" className="text-xs">
                  Required
                </Badge>
              )}
              {hasResponses && (
                <Badge variant="secondary" className="text-xs">
                  {responseCount} response{responseCount !== 1 ? "s" : ""}
                </Badge>
              )}
              {question.tags.map((t) => (
                <Badge key={t.tag.id} variant="secondary" className="text-xs">
                  {t.tag.group.name}: {t.tag.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-4 space-y-4">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            Translations
          </p>
          {question.translations.map((t) => {
            const localeName =
              locales.find((l) => l.id === t.localeId)?.name ?? t.localeId;
            return (
              <div key={t.localeId} className="pl-4 border-l-2 space-y-1">
                <p className="text-xs text-muted-foreground">{localeName}</p>
                <p className="text-sm">{t.text}</p>
                {t.description && (
                  <p className="text-xs text-muted-foreground">
                    {t.description}
                  </p>
                )}
                {t.helperText && (
                  <p className="text-xs italic text-muted-foreground">
                    {t.helperText}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {question.answers.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Answer options
              </p>
              {question.answers.map((a) => {
                const label =
                  a.translations.find((t) => t.localeId === "en")?.label ??
                  a.translations[0]?.label ??
                  "—";

                if (editingAnswerId === a.id) {
                  return (
                    <AnswerEditForm
                      key={a.id}
                      answer={a}
                      locales={locales}
                      onDone={() => setEditingAnswerId(null)}
                    />
                  );
                }

                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between pl-4 border-l-2"
                  >
                    <div>
                      <p className="text-sm">{label}</p>
                      <p className="text-xs text-muted-foreground">
                        Value: {a.value}
                      </p>
                      {a.translations.length > 1 && (
                        <div className="flex gap-2 mt-1">
                          {a.translations
                            .filter((t) => t.localeId !== "en")
                            .map((t) => (
                              <span
                                key={t.localeId}
                                className="text-xs text-muted-foreground"
                              >
                                {t.localeId}: {t.label}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>
                    {isDraft && !hasResponses && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingAnswerId(a.id)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => deleteAnswer(a.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {isDraft && !hasResponses && question.type !== "OPEN" && (
          <>
            {!addingAnswer ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAddingAnswer(true)}
              >
                Add answer option
              </Button>
            ) : (
              <AddAnswerForm
                questionId={question.id}
                locales={locales}
                nextOrder={question.answers.length + 1}
                nextValue={
                  question.answers.length > 0
                    ? Math.max(...question.answers.map((a) => a.value)) + 1
                    : 1
                }
                onDone={() => setAddingAnswer(false)}
              />
            )}
          </>
        )}

        {isDraft && (
          <>
            <Separator />

            {hasResponses ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  This question has {responseCount} response
                  {responseCount !== 1 ? "s" : ""} and cannot be edited
                  directly. You can replace it with a new version — the original
                  and its responses will be preserved for analytics.
                </p>
                <div className="flex items-center gap-2">
                  <Dialog open={replacing} onOpenChange={setReplacing}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        Replace question
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Replace question</DialogTitle>
                      </DialogHeader>
                      <QuestionReplaceForm
                        oldQuestion={question}
                        surveyId={surveyId}
                        locales={locales}
                        tagGroups={tagGroups}
                        onDone={() => setReplacing(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Dialog open={editing} onOpenChange={setEditing}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      Edit question
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl h-[90vh] flex flex-col">
                    <DialogHeader>
                      <DialogTitle>Edit question</DialogTitle>
                    </DialogHeader>
                    <QuestionEditForm
                      question={question}
                      locales={locales}
                      tagGroups={tagGroups}
                      onDone={() => setEditing(false)}
                    />
                  </DialogContent>
                </Dialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      Delete question
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this question?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will also delete all answer options. This cannot be
                        undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteQuestion(question.id)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

function QuestionEditForm({
  question,
  locales,
  tagGroups,
  onDone,
}: {
  question: QuestionData;
  locales: Locale[];
  tagGroups: TagGroup[];
  onDone: () => void;
}) {
  const [type, setType] = useState<QuestionType>(question.type as QuestionType);
  const [isRequired, setIsRequired] = useState(question.isRequired);
  const [texts, setTexts] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const t of question.translations) map[t.localeId] = t.text;
    return map;
  });
  const [descs, setDescs] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const t of question.translations)
      if (t.description) map[t.localeId] = t.description;
    return map;
  });
  const [helpers, setHelpers] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const t of question.translations)
      if (t.helperText) map[t.localeId] = t.helperText;
    return map;
  });
  const [selectedTags, setSelectedTags] = useState<string[]>(
    question.tags.map((t) => t.tag.id),
  );
  const [saving, setSaving] = useState(false);

  function toggleTag(tagId: string) {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  }

  async function handleSubmit() {
    const translations = locales
      .filter((l) => texts[l.id]?.trim())
      .map((l) => ({
        localeId: l.id,
        text: texts[l.id].trim(),
        description: descs[l.id]?.trim() || undefined,
        helperText: helpers[l.id]?.trim() || undefined,
      }));

    if (translations.length === 0) return;

    setSaving(true);
    await updateQuestion(question.id, {
      type,
      isRequired,
      translations,
      tagIds: selectedTags,
    });
    setSaving(false);
    onDone();
  }

  return (
    <QuestionFieldsForm
      type={type}
      setType={setType}
      isRequired={isRequired}
      setIsRequired={setIsRequired}
      texts={texts}
      setTexts={setTexts}
      descs={descs}
      setDescs={setDescs}
      helpers={helpers}
      setHelpers={setHelpers}
      selectedTags={selectedTags}
      toggleTag={toggleTag}
      locales={locales}
      tagGroups={tagGroups}
      saving={saving}
      onSubmit={handleSubmit}
      submitLabel="Save changes"
    />
  );
}

function QuestionReplaceForm({
  oldQuestion,
  surveyId,
  locales,
  tagGroups,
  onDone,
}: {
  oldQuestion: QuestionData;
  surveyId: string;
  locales: Locale[];
  tagGroups: TagGroup[];
  onDone: () => void;
}) {
  const [type, setType] = useState<QuestionType>(
    oldQuestion.type as QuestionType,
  );
  const [isRequired, setIsRequired] = useState(oldQuestion.isRequired);
  const [texts, setTexts] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const t of oldQuestion.translations) map[t.localeId] = t.text;
    return map;
  });
  const [descs, setDescs] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const t of oldQuestion.translations)
      if (t.description) map[t.localeId] = t.description;
    return map;
  });
  const [helpers, setHelpers] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const t of oldQuestion.translations)
      if (t.helperText) map[t.localeId] = t.helperText;
    return map;
  });
  const [answers, setAnswers] = useState<
    { labels: Record<string, string>; value: number }[]
  >(() => {
    if (oldQuestion.type === "OPEN") return [];
    return oldQuestion.answers.map((a) => ({
      value: a.value,
      labels: Object.fromEntries(
        a.translations.map((t) => [t.localeId, t.label]),
      ),
    }));
  });
  const [selectedTags, setSelectedTags] = useState<string[]>(
    oldQuestion.tags.map((t) => t.tag.id),
  );
  const [saving, setSaving] = useState(false);

  const needsAnswers = type !== "OPEN";

  function addAnswer() {
    setAnswers([...answers, { labels: {}, value: answers.length + 1 }]);
  }
  function removeAnswer(index: number) {
    setAnswers(answers.filter((_, i) => i !== index));
  }
  function updateAnswerLabel(index: number, localeId: string, label: string) {
    const updated = [...answers];
    updated[index] = {
      ...updated[index],
      labels: { ...updated[index].labels, [localeId]: label },
    };
    setAnswers(updated);
  }
  function addLikertDefaults() {
    const defaults = [
      { en: "Strongly disagree", nl: "Helemaal mee oneens" },
      { en: "Disagree", nl: "Mee oneens" },
      { en: "Neutral", nl: "Neutraal" },
      { en: "Agree", nl: "Mee eens" },
      { en: "Strongly agree", nl: "Helemaal mee eens" },
    ];
    setAnswers(defaults.map((d, i) => ({ labels: d, value: i + 1 })));
  }
  function toggleTag(tagId: string) {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  }

  async function handleSubmit() {
    const translations = locales
      .filter((l) => texts[l.id]?.trim())
      .map((l) => ({
        localeId: l.id,
        text: texts[l.id].trim(),
        description: descs[l.id]?.trim() || undefined,
        helperText: helpers[l.id]?.trim() || undefined,
      }));

    if (translations.length === 0) return;

    const answerData = needsAnswers
      ? answers
          .filter((a) => Object.values(a.labels).some((l) => l.trim()))
          .map((a, i) => ({
            value: a.value,
            displayOrder: i + 1,
            translations: locales
              .filter((l) => a.labels[l.id]?.trim())
              .map((l) => ({ localeId: l.id, label: a.labels[l.id].trim() })),
          }))
      : undefined;

    setSaving(true);
    await retireAndReplaceQuestion(oldQuestion.id, {
      surveyId,
      type,
      isRequired,
      displayOrder: oldQuestion.displayOrder,
      translations,
      answers: answerData,
      tagIds: selectedTags.length > 0 ? selectedTags : undefined,
    });
    setSaving(false);
    onDone();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-md bg-muted p-3">
        <p className="text-sm text-muted-foreground">
          This will retire the current question (preserving it and its{" "}
          {oldQuestion._count?.responses ?? 0} response
          {(oldQuestion._count?.responses ?? 0) !== 1 ? "s" : ""} for analytics)
          and create a new replacement at the same position.
        </p>
      </div>

      <QuestionFieldsForm
        type={type}
        setType={setType}
        isRequired={isRequired}
        setIsRequired={setIsRequired}
        texts={texts}
        setTexts={setTexts}
        descs={descs}
        setDescs={setDescs}
        helpers={helpers}
        setHelpers={setHelpers}
        selectedTags={selectedTags}
        toggleTag={toggleTag}
        locales={locales}
        tagGroups={tagGroups}
        saving={saving}
        onSubmit={handleSubmit}
        submitLabel="Retire old & create replacement"
        answers={answers}
        needsAnswers={needsAnswers}
        answerType={type}
        onAddAnswer={addAnswer}
        onRemoveAnswer={removeAnswer}
        onUpdateAnswerLabel={updateAnswerLabel}
        onAddLikertDefaults={addLikertDefaults}
      />
    </div>
  );
}

function QuestionFieldsForm({
  type,
  setType,
  isRequired,
  setIsRequired,
  texts,
  setTexts,
  descs,
  setDescs,
  helpers,
  setHelpers,
  selectedTags,
  toggleTag,
  locales,
  tagGroups,
  saving,
  onSubmit,
  submitLabel,
  answers,
  needsAnswers,
  answerType,
  onAddAnswer,
  onRemoveAnswer,
  onUpdateAnswerLabel,
  onAddLikertDefaults,
}: {
  type: QuestionType;
  setType: (t: QuestionType) => void;
  isRequired: boolean;
  setIsRequired: (v: boolean) => void;
  texts: Record<string, string>;
  setTexts: (v: Record<string, string>) => void;
  descs: Record<string, string>;
  setDescs: (v: Record<string, string>) => void;
  helpers: Record<string, string>;
  setHelpers: (v: Record<string, string>) => void;
  selectedTags: string[];
  toggleTag: (id: string) => void;
  locales: Locale[];
  tagGroups: TagGroup[];
  saving: boolean;
  onSubmit: () => void;
  submitLabel: string;
  answers?: { labels: Record<string, string>; value: number }[];
  needsAnswers?: boolean;
  answerType?: QuestionType;
  onAddAnswer?: () => void;
  onRemoveAnswer?: (index: number) => void;
  onUpdateAnswerLabel?: (
    index: number,
    localeId: string,
    label: string,
  ) => void;
  onAddLikertDefaults?: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Question type</Label>
          <Select
            value={type}
            onValueChange={(v) => setType(v as QuestionType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUESTION_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Required</Label>
          <div className="flex items-center gap-2 pt-2">
            <Switch checked={isRequired} onCheckedChange={setIsRequired} />
            <span className="text-sm text-muted-foreground">
              {isRequired ? "Yes" : "No"}
            </span>
          </div>
        </div>
      </div>

      <Separator />
      <div className="space-y-2">
        <Label>Question text</Label>
        <Tabs defaultValue={locales[0]?.id ?? "en"}>
          <TabsList>
            {locales.map((l) => (
              <TabsTrigger key={l.id} value={l.id}>
                {l.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {locales.map((l) => (
            <TabsContent key={l.id} value={l.id} className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Text ({l.name})
                </Label>
                <Input
                  value={texts[l.id] ?? ""}
                  onChange={(e) =>
                    setTexts({ ...texts, [l.id]: e.target.value })
                  }
                  placeholder="Question text..."
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Description ({l.name})
                </Label>
                <Textarea
                  value={descs[l.id] ?? ""}
                  onChange={(e) =>
                    setDescs({ ...descs, [l.id]: e.target.value })
                  }
                  placeholder="Optional description... use [[term]] for glossary tooltips"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Helper text ({l.name})
                </Label>
                <Input
                  value={helpers[l.id] ?? ""}
                  onChange={(e) =>
                    setHelpers({ ...helpers, [l.id]: e.target.value })
                  }
                  placeholder="Optional hint shown below the question..."
                />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {answers &&
        needsAnswers &&
        onAddAnswer &&
        onRemoveAnswer &&
        onUpdateAnswerLabel && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Answer options</Label>
                <div className="flex gap-2">
                  {answerType === "LIKERT" &&
                    answers.length === 0 &&
                    onAddLikertDefaults && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={onAddLikertDefaults}
                      >
                        Add Likert defaults
                      </Button>
                    )}
                  <Button size="sm" variant="outline" onClick={onAddAnswer}>
                    Add option
                  </Button>
                </div>
              </div>
              {answers.map((answer, i) => (
                <Card key={i}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        Option {i + 1} (value: {answer.value})
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => onRemoveAnswer(i)}
                      >
                        Remove
                      </Button>
                    </div>
                    {locales.map((l) => (
                      <div key={l.id} className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          {l.name}
                        </Label>
                        <Input
                          value={answer.labels[l.id] ?? ""}
                          onChange={(e) =>
                            onUpdateAnswerLabel(i, l.id, e.target.value)
                          }
                          placeholder={`Label in ${l.name}...`}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

      {tagGroups.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <Label>Tags</Label>
            {tagGroups.map((group) => (
              <div key={group.id} className="space-y-2">
                <p className="text-xs text-muted-foreground">{group.name}</p>
                <div className="flex flex-wrap gap-2">
                  {group.tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={
                        selectedTags.includes(tag.id) ? "default" : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Separator />
      <Button onClick={onSubmit} disabled={saving} className="w-full">
        {saving ? "Saving..." : submitLabel}
      </Button>
    </div>
  );
}

function AnswerEditForm({
  answer,
  locales,
  onDone,
}: {
  answer: AnswerData;
  locales: Locale[];
  onDone: () => void;
}) {
  const [labels, setLabels] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const t of answer.translations) map[t.localeId] = t.label;
    return map;
  });
  const [value, setValue] = useState(answer.value);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const translations = locales
      .filter((l) => labels[l.id]?.trim())
      .map((l) => ({ localeId: l.id, label: labels[l.id].trim() }));

    if (translations.length === 0) return;

    setSaving(true);
    await updateAnswer(answer.id, { value, translations });
    setSaving(false);
    onDone();
  }

  return (
    <Card className="border-dashed">
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Editing answer</p>
          <Button size="sm" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Numeric value</Label>
          <Input
            type="number"
            value={value}
            onChange={(e) => setValue(parseInt(e.target.value) || 0)}
            className="w-24"
          />
        </div>
        {locales.map((l) => (
          <div key={l.id} className="space-y-1">
            <Label className="text-xs text-muted-foreground">{l.name}</Label>
            <Input
              value={labels[l.id] ?? ""}
              onChange={(e) => setLabels({ ...labels, [l.id]: e.target.value })}
              placeholder={`Label in ${l.name}...`}
            />
          </div>
        ))}
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </CardContent>
    </Card>
  );
}

function AddAnswerForm({
  questionId,
  locales,
  nextOrder,
  nextValue,
  onDone,
}: {
  questionId: string;
  locales: Locale[];
  nextOrder: number;
  nextValue: number;
  onDone: () => void;
}) {
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [value, setValue] = useState(nextValue);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const translations = locales
      .filter((l) => labels[l.id]?.trim())
      .map((l) => ({ localeId: l.id, label: labels[l.id].trim() }));

    if (translations.length === 0) return;

    setSaving(true);
    await createAnswer({
      questionId,
      value,
      displayOrder: nextOrder,
      translations,
    });
    setSaving(false);
    onDone();
  }

  return (
    <Card className="border-dashed">
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">New answer option</p>
          <Button size="sm" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Numeric value</Label>
          <Input
            type="number"
            value={value}
            onChange={(e) => setValue(parseInt(e.target.value) || 0)}
            className="w-24"
          />
        </div>
        {locales.map((l) => (
          <div key={l.id} className="space-y-1">
            <Label className="text-xs text-muted-foreground">{l.name}</Label>
            <Input
              value={labels[l.id] ?? ""}
              onChange={(e) => setLabels({ ...labels, [l.id]: e.target.value })}
              placeholder={`Label in ${l.name}...`}
            />
          </div>
        ))}
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Add"}
        </Button>
      </CardContent>
    </Card>
  );
}

function QuestionForm({
  surveyId,
  locales,
  tagGroups,
  nextOrder,
  onDone,
}: {
  surveyId: string;
  locales: Locale[];
  tagGroups: TagGroup[];
  nextOrder: number;
  onDone: () => void;
}) {
  const [type, setType] = useState<QuestionType>("LIKERT");
  const [isRequired, setIsRequired] = useState(true);
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [descs, setDescs] = useState<Record<string, string>>({});
  const [helpers, setHelpers] = useState<Record<string, string>>({});
  const [answers, setAnswers] = useState<
    { labels: Record<string, string>; value: number }[]
  >([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const needsAnswers = type !== "OPEN";

  function addAnswer() {
    setAnswers([...answers, { labels: {}, value: answers.length + 1 }]);
  }
  function removeAnswer(index: number) {
    setAnswers(answers.filter((_, i) => i !== index));
  }
  function updateAnswerLabel(index: number, localeId: string, label: string) {
    const updated = [...answers];
    updated[index] = {
      ...updated[index],
      labels: { ...updated[index].labels, [localeId]: label },
    };
    setAnswers(updated);
  }
  function addLikertDefaults() {
    const defaults = [
      { en: "Strongly disagree", nl: "Helemaal mee oneens" },
      { en: "Disagree", nl: "Mee oneens" },
      { en: "Neutral", nl: "Neutraal" },
      { en: "Agree", nl: "Mee eens" },
      { en: "Strongly agree", nl: "Helemaal mee eens" },
    ];
    setAnswers(defaults.map((d, i) => ({ labels: d, value: i + 1 })));
  }
  function toggleTag(tagId: string) {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  }

  async function handleSubmit() {
    const translations = locales
      .filter((l) => texts[l.id]?.trim())
      .map((l) => ({
        localeId: l.id,
        text: texts[l.id].trim(),
        description: descs[l.id]?.trim() || undefined,
        helperText: helpers[l.id]?.trim() || undefined,
      }));

    if (translations.length === 0) return;

    const answerData = needsAnswers
      ? answers
          .filter((a) => Object.values(a.labels).some((l) => l.trim()))
          .map((a, i) => ({
            value: a.value,
            displayOrder: i + 1,
            translations: locales
              .filter((l) => a.labels[l.id]?.trim())
              .map((l) => ({ localeId: l.id, label: a.labels[l.id].trim() })),
          }))
      : undefined;

    setSaving(true);
    await createQuestion({
      surveyId,
      type,
      isRequired,
      displayOrder: nextOrder,
      translations,
      answers: answerData,
      tagIds: selectedTags.length > 0 ? selectedTags : undefined,
    });
    setSaving(false);
    onDone();
  }

  return (
    <QuestionFieldsForm
      type={type}
      setType={setType}
      isRequired={isRequired}
      setIsRequired={setIsRequired}
      texts={texts}
      setTexts={setTexts}
      descs={descs}
      setDescs={setDescs}
      helpers={helpers}
      setHelpers={setHelpers}
      selectedTags={selectedTags}
      toggleTag={toggleTag}
      locales={locales}
      tagGroups={tagGroups}
      saving={saving}
      onSubmit={handleSubmit}
      submitLabel="Add question"
      answers={answers}
      needsAnswers={needsAnswers}
      answerType={type}
      onAddAnswer={addAnswer}
      onRemoveAnswer={removeAnswer}
      onUpdateAnswerLabel={updateAnswerLabel}
      onAddLikertDefaults={addLikertDefaults}
    />
  );
}

type ParticipantRow = {
  id: string;
  accessCode: string;
  createdAt: Date | string;
  sessions: { id: string; status: string }[];
};

export function ParticipantsSection({
  surveyId,
  participants,
}: {
  surveyId: string;
  participants: ParticipantRow[];
}) {
  const [adding, setAdding] = useState(false);
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    const trimmed = code.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await createParticipant({ accessCode: trimmed, surveyId });
      setCode("");
      setAdding(false);
    } finally {
      setSaving(false);
    }
  }

  function generateCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let out = "";
    for (let i = 0; i < 6; i++) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    setCode(out);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Participants</h2>
          <p className="text-sm text-muted-foreground">
            Access codes bound to this survey. Each code starts at most one
            session.
          </p>
        </div>
        {!adding ? (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
            Add participant
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Access code"
              className="w-40"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={generateCode}
              type="button"
            >
              Generate
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={saving || !code.trim()}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAdding(false);
                setCode("");
              }}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      {participants.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            No participants yet.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-4 space-y-2">
            {participants.map((p) => {
              const session = p.sessions[0];
              const status = session
                ? session.status.toLowerCase()
                : "no session";
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between border-b last:border-b-0 pb-2 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm">{p.accessCode}</span>
                    <Badge variant="outline" className="text-xs">
                      {status}
                    </Badge>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                      >
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete participant?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Removes the access code and any session attached to
                          it. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteParticipant(p.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
