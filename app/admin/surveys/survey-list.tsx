"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  createSurvey,
  deleteSurvey,
  publishSurvey,
  closeSurvey,
} from "../actions";

type Survey = {
  id: string;
  status: string;
  createdAt: Date;
  translations: {
    localeId: string;
    title: string;
    description: string | null;
  }[];
  questions: unknown[];
};

type Locale = {
  id: string;
  name: string;
};

export function SurveyList({
  surveys,
  locales,
}: {
  surveys: Survey[];
  locales: Locale[];
}) {
  const [open, setOpen] = useState(false);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});

  const canSubmit = locales.some((l) => titles[l.id]?.trim());

  async function handleCreate() {
    if (!canSubmit) return;

    const translations = locales
      .filter((l) => titles[l.id]?.trim())
      .map((l) => ({
        localeId: l.id,
        title: titles[l.id].trim(),
        description: descriptions[l.id]?.trim() || undefined,
      }));

    await createSurvey({ translations });

    setTitles({});
    setDescriptions({});
    setOpen(false);
  }

  function statusColor(status: string) {
    switch (status) {
      case "DRAFT":
        return "secondary";
      case "PUBLISHED":
        return "default";
      case "CLOSED":
        return "outline";
      default:
        return "secondary";
    }
  }

  function getTitle(survey: Survey) {
    return (
      survey.translations.find((t) => t.localeId === "en")?.title ??
      survey.translations[0]?.title ??
      "Untitled"
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Surveys</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your surveys
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>New survey</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create survey</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Give the survey a name. You&apos;ll pick the model, methods, and
                vignette patients in the next step.
              </p>
            </DialogHeader>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Title & description
                </Label>
                <Tabs defaultValue={locales[0]?.id ?? "en"}>
                  <TabsList>
                    {locales.map((l) => (
                      <TabsTrigger key={l.id} value={l.id}>
                        {l.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {locales.map((l) => (
                    <TabsContent
                      key={l.id}
                      value={l.id}
                      className="space-y-4 mt-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor={`title-${l.id}`}>
                          Title ({l.name})
                        </Label>
                        <Input
                          id={`title-${l.id}`}
                          value={titles[l.id] ?? ""}
                          onChange={(e) =>
                            setTitles({ ...titles, [l.id]: e.target.value })
                          }
                          placeholder="Survey title..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`desc-${l.id}`}>
                          Description ({l.name})
                        </Label>
                        <Textarea
                          id={`desc-${l.id}`}
                          value={descriptions[l.id] ?? ""}
                          onChange={(e) =>
                            setDescriptions({
                              ...descriptions,
                              [l.id]: e.target.value,
                            })
                          }
                          placeholder="Optional description..."
                          rows={3}
                        />
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!canSubmit}>
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {surveys.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No surveys yet. Create your first one.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {surveys.map((survey) => (
            <Card key={survey.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-lg">
                    <Link
                      href={`/admin/surveys/${survey.id}`}
                      className="hover:underline"
                    >
                      {getTitle(survey)}
                    </Link>
                  </CardTitle>
                  <CardDescription>
                    {survey.questions.length} question
                    {survey.questions.length !== 1 ? "s" : ""}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusColor(survey.status)}>
                    {survey.status.toLowerCase()}
                  </Badge>
                  {survey.status === "DRAFT" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => publishSurvey(survey.id)}
                    >
                      Publish
                    </Button>
                  )}
                  {survey.status === "PUBLISHED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => closeSurvey(survey.id)}
                    >
                      Close
                    </Button>
                  )}
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
                        <AlertDialogTitle>Delete survey?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this survey and all its
                          questions, answers, and responses.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteSurvey(survey.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}