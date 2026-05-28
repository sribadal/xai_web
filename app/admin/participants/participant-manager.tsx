"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { createParticipant, deleteParticipant } from "../actions";

type SurveyOption = {
  id: string;
  translations: { localeId: string; title: string }[];
};

type Participant = {
  id: string;
  accessCode: string;
  createdAt: Date;
  survey: {
    id: string;
    translations: { localeId: string; title: string }[];
  };
  sessions: { id: string; status: string }[];
};

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 3; i++)
    code += chars[Math.floor(Math.random() * chars.length)];
  code += "-";
  for (let i = 0; i < 4; i++)
    code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function surveyTitle(s: { translations: { localeId: string; title: string }[] }) {
  return (
    s.translations.find((t) => t.localeId === "en")?.title ??
    s.translations[0]?.title ??
    "Untitled"
  );
}

export function ParticipantManager({
  participants,
  surveys,
}: {
  participants: Participant[];
  surveys: SurveyOption[];
}) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [bulkCount, setBulkCount] = useState(1);
  const [surveyId, setSurveyId] = useState<string>(surveys[0]?.id ?? "");

  async function handleCreate() {
    if (!code.trim() || !surveyId) return;
    await createParticipant({ accessCode: code.trim(), surveyId });
    setCode("");
    setOpen(false);
  }

  async function handleBulkCreate() {
    if (!surveyId) return;
    for (let i = 0; i < bulkCount; i++) {
      await createParticipant({ accessCode: generateCode(), surveyId });
    }
    setOpen(false);
  }

  const canSubmit = surveyId !== "" && surveys.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Participants</h1>
          <p className="text-muted-foreground mt-1">
            Manage access codes for survey participants
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button disabled={surveys.length === 0}>Add participants</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add participants</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Survey</Label>
                <Select value={surveyId} onValueChange={setSurveyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pick a survey..." />
                  </SelectTrigger>
                  <SelectContent>
                    {surveys.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {surveyTitle(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Each access code is bound to one survey.
                </p>
              </div>

              <div className="space-y-3">
                <Label>Custom access code</Label>
                <div className="flex gap-2">
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. ABC-1234"
                  />
                  <Button variant="outline" onClick={() => setCode(generateCode())}>
                    Generate
                  </Button>
                </div>
                <Button
                  onClick={handleCreate}
                  className="w-full"
                  disabled={!canSubmit || !code.trim()}
                >
                  Add one participant
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Bulk generate</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={bulkCount}
                    onChange={(e) => setBulkCount(parseInt(e.target.value) || 1)}
                  />
                  <Button
                    variant="outline"
                    onClick={handleBulkCreate}
                    disabled={!canSubmit}
                  >
                    Generate {bulkCount} codes
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {participants.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {surveys.length === 0
              ? "Create a survey first, then add participants."
              : "No participants yet. Generate access codes to get started."}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Access code</TableHead>
                <TableHead>Survey</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {participants.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono">{p.accessCode}</TableCell>
                  <TableCell className="text-sm">{surveyTitle(p.survey)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {p.sessions.length === 0 ? (
                      <span className="text-sm text-muted-foreground">None</span>
                    ) : (
                      <div className="flex gap-1">
                        {p.sessions.map((s) => (
                          <Badge
                            key={s.id}
                            variant={s.status === "COMPLETED" ? "default" : "secondary"}
                          >
                            {s.status.toLowerCase()}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {p.sessions.length === 0 && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="text-destructive">
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete participant?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove access code {p.accessCode}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteParticipant(p.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
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