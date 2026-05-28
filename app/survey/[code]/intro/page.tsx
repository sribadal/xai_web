import { notFound } from "next/navigation";
import { getSessionByCode } from "@/lib/survey/data.server";
import { StaticStep } from "@/components/survey/StaticStep";
import { redirectIfCompleted } from "@/lib/survey/guards";

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  await redirectIfCompleted(code);
  
  const loaded = await getSessionByCode(code);
  if (!loaded) notFound();

  return (
    <StaticStep
      code={code}
      sessionId={loaded.session.id}
      currentStep={{ kind: "intro" }}
      eyebrow="Study"
      title="Explanations for prediction tools in pancreatic cancer"
    >
      <ul>
        <li>You will see prototype explanation screens for a clinical prediction tool.</li>
        <li>We are evaluating the explanations, not your medical knowledge.</li>
        <li>Please think aloud as you go — describe what you are looking at, what you understand, and what confuses you.</li>
      </ul>
    </StaticStep>
  );
}