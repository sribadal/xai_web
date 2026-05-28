import { notFound } from "next/navigation";
import { getSessionByCode } from "@/lib/survey/data.server";
import { StaticStep } from "@/components/survey/StaticStep";
import { ThinkAloudHint } from "@/components/survey/ThinkAloudHint";

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const loaded = await getSessionByCode(code);
  if (!loaded) notFound();

  return (
    <StaticStep
      code={code}
      sessionId={loaded.session.id}
      currentStep={{ kind: "practice" }}
      eyebrow="Practice"
      title="Thinking aloud"
    >
      <p>
        For the rest of the study, we will ask you to think aloud as you
        review each screen. Say what you are looking at, what you
        understand, and what confuses you. There are no right or wrong
        answers.
      </p>

      <div
        className="survey-card survey-card--dummy"
        style={{ marginTop: "var(--survey-space-6)", minHeight: 180 }}
      >
        <div className="survey-card-label">Practice example</div>
        <div>
          A neutral example will render here. Try describing what you see
          out loud before continuing.
        </div>
      </div>

      <div style={{ marginTop: "var(--survey-space-6)" }}>
        <ThinkAloudHint>
          If you are unsure what to say, describe what you notice first and
          what you think it means.
        </ThinkAloudHint>
      </div>
    </StaticStep>
  );
}