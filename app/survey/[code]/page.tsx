import { notFound, redirect } from "next/navigation";
import { startOrResumeSession } from "./actions";
import { getSessionByCode } from "@/lib/survey/data.server";
import { stepToPath, deserializeStep } from "@/lib/survey/steps";
import { redirectIfCompleted } from "@/lib/survey/guards";

export default async function SurveyEntryPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  await redirectIfCompleted(code); 

  const sessionId = await startOrResumeSession(code);
  if (!sessionId) notFound();

  const loaded = await getSessionByCode(code);
  if (!loaded) notFound();

  const step = deserializeStep(loaded.session.currentStepKey);
  redirect(stepToPath(code, step));
}