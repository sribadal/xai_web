"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createGlossaryTerm,
  updateGlossaryTerm,
  deleteGlossaryTerm,
} from "../actions";

type Locale = { id: string; name: string };
type GlossaryTerm = {
  id: string;
  term: string;
  translations: { localeId: string; label: string; definition: string }[];
};

export function GlossaryManager({
  terms,
  locales,
}: {
  terms: GlossaryTerm[];
  locales: Locale[];
}) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [definitions, setDefinitions] = useState<Record<string, string>>({});
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  function resetForm() {
    setTerm("");
    setDefinitions({});
    setLabels({});
    setEditingId(null);
  }

  function startEdit(t: GlossaryTerm) {
    setEditingId(t.id);
    setTerm(t.term);
    const defs: Record<string, string> = {};
    const labs: Record<string, string> = {};
    t.translations.forEach((tr) => {
      defs[tr.localeId] = tr.definition;
      labs[tr.localeId] = tr.label;
    });
    setDefinitions(defs);
    setLabels(labs);
    setOpen(true);
  }

  async function handleSubmit() {
    if (!term.trim()) return;

    const translations = locales
      .filter((l) => definitions[l.id]?.trim())
      .map((l) => ({
        localeId: l.id,
        label: (labels[l.id] ?? "").trim(),
        definition: definitions[l.id].trim(),
      }));

    if (editingId) {
      await updateGlossaryTerm(editingId, { term: term.trim(), translations });
    } else {
      await createGlossaryTerm({ term: term.trim(), translations });
    }

    resetForm();
    setOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Glossary</h1>
          <p className="text-muted-foreground mt-1">
            Define medical terms for [[tooltip]] hover definitions in questions
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>Add term</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit term" : "Add term"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Term</Label>
                <Input
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="e.g. lymph node involvement"
                />
                <p className="text-xs text-muted-foreground">
                  Use this exact text inside [[double brackets]] in question
                  text
                </p>
              </div>
              <Tabs defaultValue={locales[0]?.id ?? "en"}>
                <TabsList>
                  {locales.map((l) => (
                    <TabsTrigger key={l.id} value={l.id}>
                      {l.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {locales.map((l) => (
                  <TabsContent key={l.id} value={l.id}>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Label ({l.name})</Label>
                        <Input
                          value={labels[l.id] ?? ""}
                          onChange={(e) =>
                            setLabels({ ...labels, [l.id]: e.target.value })
                          }
                          placeholder="e.g. Distant metastasis"
                        />
                        <p className="text-xs text-muted-foreground">
                          Short title shown at the top of the tooltip
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Definition ({l.name})</Label>
                        <Textarea
                          value={definitions[l.id] ?? ""}
                          onChange={(e) =>
                            setDefinitions({
                              ...definitions,
                              [l.id]: e.target.value,
                            })
                          }
                          placeholder={`Plain language definition in ${l.name}...`}
                          rows={3}
                        />
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
              <Button onClick={handleSubmit} className="w-full">
                {editingId ? "Save changes" : "Add term"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {terms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No glossary terms yet. Add your first one.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Term</TableHead>
                {locales.map((l) => (
                  <TableHead key={l.id}>{l.name}</TableHead>
                ))}
                <TableHead className="w-[100px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {terms.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-sm">{t.term}</TableCell>
                  {locales.map((l) => {
                    const def = t.translations.find(
                      (tr) => tr.localeId === l.id,
                    )?.definition;
                    return (
                      <TableCell key={l.id} className="text-sm">
                        {def ?? (
                          <span className="text-muted-foreground italic">
                            —
                          </span>
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit(t)}
                      >
                        Edit
                      </Button>
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
                            <AlertDialogTitle>
                              Delete "{t.term}"?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove the glossary term and its tooltip
                              definitions.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteGlossaryTerm(t.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
