import { SCALE_CONFIG, type Scale } from "./scale";

export function PredictionHeadline({
  scale,
  originalPrediction,
  cfPrediction,
  changeCount,
}: {
  scale: Scale;
  originalPrediction: number | null;
  cfPrediction: number | null;
  changeCount: number;
}) {
  const cfg = SCALE_CONFIG[scale];

  if (originalPrediction === null || cfPrediction === null) {
    return (
      <p className="text-sm text-foreground leading-relaxed">
        If this patient looked like the counterfactual on the right —{" "}
        <span className="font-medium">
          {changeCount} feature{changeCount === 1 ? "" : "s"} different
        </span>{" "}
        — the model would predict a different outcome.
      </p>
    );
  }

  const improved = cfg.lowerIsBetter
    ? cfPrediction < originalPrediction
    : cfPrediction > originalPrediction;
  const directionWord = cfPrediction > originalPrediction ? "rise" : "fall";

  return (
    <p className="text-sm text-foreground leading-relaxed">
      With{" "}
      <span className="font-medium">
        {changeCount} feature{changeCount === 1 ? "" : "s"}
      </span>{" "}
      changed as shown, the predicted {cfg.outcomeNoun} would {directionWord}{" "}
      from{" "}
      <span className="font-mono font-medium">
        {cfg.formatPrediction(originalPrediction)}
      </span>{" "}
      to{" "}
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
