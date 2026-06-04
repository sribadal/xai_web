import { notFound } from "next/navigation";
import { getSessionByCode } from "@/lib/survey/data.server";
import { StaticStep } from "@/components/survey/StaticStep";
import { redirectIfCompleted } from "@/lib/survey/guards";
import { getLocale } from "@/lib/survey/locale";

const T = {
  en: {
    eyebrow: "Consent",
    title: "Before we begin",
    items: [
      "This is a prototype tool used for research purposes only.",
      "Your responses will be used anonymously to evaluate explanation designs.",
      "With your permission, we will record your screen and microphone during the session. No face camera will be used.",
      "Participation is voluntary; you may stop at any time.",
    ],
  },
  nl: {
    eyebrow: "Toestemming",
    title: "Voordat we beginnen",
    items: [
      "Dit is een prototype-tool die uitsluitend voor onderzoeksdoeleinden wordt gebruikt.",
      "Uw antwoorden worden anoniem gebruikt om uitlegontwerpen te evalueren.",
      "Met uw toestemming nemen wij uw scherm en microfoon op tijdens de sessie. Er wordt geen camera gebruikt.",
      "Deelname is vrijwillig; u kunt op elk moment stoppen.",
    ],
  },
} as const;

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  await redirectIfCompleted(code);
  const loaded = await getSessionByCode(code);
  if (!loaded) notFound();
  const locale = await getLocale();

  const t = T[locale];

  return (
    <StaticStep
      code={code}
      sessionId={loaded.session.id}
      currentStep={{ kind: "consent" }}
      eyebrow={t.eyebrow}
      title={t.title}
      requireConsent
      locale={locale}
    >
      <ul>
        {t.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </StaticStep>
  );
}
