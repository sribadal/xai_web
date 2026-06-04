import { SCALE_CONFIG, type Scale } from "./scale";

const PRED_T = {
  en: {
    fallback: (n: number) =>
      `If this patient looked like the counterfactual on the right — ` +
      `${n} feature${n === 1 ? "" : "s"} different — the model would predict a different outcome.`,
    main: (
      n: number,
      outcomeNoun: string,
      dir: string,
      from: string,
      to: string,
    ) =>
      null, // built inline for JSX styling
    features: (n: number) => `${n} feature${n === 1 ? "" : "s"}`,
    changed: "changed as shown, the predicted",
    would: "would",
    from: "from",
    to: "to",
    rise: "rise",
    fall: "fall",
    with: "With",
  },
  nl: {
    fallback: (n: number) =>
      `Als deze patiënt eruitzag als het alternatieve profiel rechts — ` +
      `${n} kenmerk${n === 1 ? "" : "en"} anders — zou het model een andere uitkomst voorspellen.`,
    features: (n: number) => `${n} kenmerk${n === 1 ? "" : "en"}`,
    changed: "gewijzigd zoals getoond, zou de voorspelde",
    would: "zou",
    from: "van",
    to: "naar",
    rise: "stijgen",
    fall: "dalen",
    with: "Met",
  },
} as const;

export function PredictionHeadline({
  scale,
  originalPrediction,
  cfPrediction,
  changeCount,
  locale = "en",
}: {
  scale: Scale;
  originalPrediction: number | null;
  cfPrediction: number | null;
  changeCount: number;
  locale?: string;
}) {
  const t = PRED_T[locale as keyof typeof PRED_T] ?? PRED_T.en;
  const cfg = SCALE_CONFIG[scale];

  if (originalPrediction === null || cfPrediction === null) {
    return (
      <p className="text-sm text-foreground leading-relaxed">
        {t.fallback(changeCount)}
      </p>
    );
  }

  const improved = cfg.lowerIsBetter
    ? cfPrediction < originalPrediction
    : cfPrediction > originalPrediction;
  const directionWord = cfPrediction > originalPrediction ? t.rise : t.fall;

  return (
    <p className="text-sm text-foreground leading-relaxed">
      {t.with}{" "}
      <span className="font-medium">{t.features(changeCount)}</span>{" "}
      {t.changed} {cfg.outcomeNoun} {directionWord}{" "}
      {t.from}{" "}
      <span className="font-mono font-medium">
        {cfg.formatPrediction(originalPrediction)}
      </span>{" "}
      {t.to}{" "}
      <span
        className={`font-mono font-medium ${
          improved
            ? "text-emerald-700 dark:text-emerald-400"
            : "text-amber-700 dark:text-amber-400"
        }`}
      >
        {cfg.formatPrediction(cfPrediction)}
      </span>
      .
    </p>
  );
}