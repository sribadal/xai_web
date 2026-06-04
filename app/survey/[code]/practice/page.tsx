import { notFound } from "next/navigation";
import { getSessionByCode } from "@/lib/survey/data.server";
import { StaticStep } from "@/components/survey/StaticStep";
import { ThinkAloudHint } from "@/components/survey/ThinkAloudHint";
import { getLocale } from "@/lib/survey/locale";

const T = {
  en: {
    eyebrow: "Practice",
    title: "Thinking aloud",
    body: "For the rest of the study, we will ask you to think aloud as you review each screen. Say what you are looking at, what you understand, and what confuses you. There are no right or wrong answers.",
    videoFallback: "Your browser does not support the video tag.",
    hint: "If you are unsure what to say, describe what you notice first and what you think it means.",
  },
  nl: {
    eyebrow: "Oefening",
    title: "Hardop denken",
    body: "Tijdens de rest van het onderzoek vragen wij u om hardop te denken terwijl u elk scherm bekijkt. Vertel wat u ziet, wat u begrijpt en wat u verwarrend vindt. Er zijn geen goede of foute antwoorden.",
    videoFallback: "Uw browser ondersteunt de videotag niet.",
    hint: "Als u niet weet wat u moet zeggen, beschrijf dan eerst wat u opvalt en wat u denkt dat het betekent.",
  },
} as const;

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const loaded = await getSessionByCode(code);
  if (!loaded) notFound();
  const locale = await getLocale();
  const t = T[locale];

  return (
    <StaticStep
      code={code}
      sessionId={loaded.session.id}
      currentStep={{ kind: "practice" }}
      eyebrow={t.eyebrow}
      title={t.title}
      locale={locale}
    >
      <p>{t.body}</p>

      <video
        controls
        playsInline
        preload="metadata"
        style={{
          width: "100%",
          borderRadius: 8,
          marginTop: "var(--survey-space-4)",
        }}
      >
        <source src="/practice.mp4" type="video/mp4" />
        {t.videoFallback}
      </video>

      <div style={{ marginTop: "var(--survey-space-6)" }}>
        <ThinkAloudHint>{t.hint}</ThinkAloudHint>
      </div>
    </StaticStep>
  );
}