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
      currentStep={{ kind: "consent" }}
      eyebrow="Consent"
      title="Before we begin"
      requireConsent
    >
      <ul>
        <li>This is a prototype tool used for research purposes only.</li>
        <li>Your responses will be used anonymously to evaluate explanation designs.</li>
        <li>Participation is voluntary; you may stop at any time.</li>
      </ul>
    </StaticStep>
  );
}