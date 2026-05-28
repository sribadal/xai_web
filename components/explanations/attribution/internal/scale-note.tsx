import type { ScaleMode } from "./scale"

type Props = {
  mode: ScaleMode
  isProbabilityView: boolean
  method: string
}

export function ScaleNote({ mode, isProbabilityView, method }: Props) {
  return (
    <>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
        Reading the values
      </p>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        {describeMethod(method, isProbabilityView)}
      </p>
    </>
  )
}

function describeMethod(method: string, isProbabilityView: boolean): string {
  switch (method) {
    case "lime":
      return "Values are LIME coefficients in the same units as the model's output (quality-of-life score for ConDOR, risk score for RSF). A coefficient of +9 means that in LIME's local linear approximation around this patient, the feature being present adds roughly 9 points to the predicted score. Positive values push the prediction up, negative values push it down. They do not sum to the model's actual prediction — LIME's surrogate includes an unseen intercept that absorbs the rest."
    case "deep_lift":
      return "Values are DeepLIFT contributions in the same units as the model's output (quality-of-life score for ConDOR, risk score for RSF), measured relative to a reference baseline. They show how much each feature pushes the prediction up or down relative to that baseline. Together with the baseline value (not shown), they approximately sum to the model's output."
    case "integrated_gradients":
      return "Values are Integrated Gradients attributions in the same units as the model's output (quality-of-life score for ConDOR, risk score for RSF). They show how much each feature contributes as you move along a path from a zero baseline to this patient's features. Together with the baseline value (not shown), they approximately sum to the model's output."
    case "permutation":
      return "Values are permutation importance scores — how much the model's prediction changes when each feature is randomly shuffled. They show relative importance, not signed contributions. Larger values indicate features the model relies on more heavily, regardless of direction."
    case "minimal_depth":
      return "Values are average tree depths at which each feature is first used to split. Smaller depths mean the feature is used earlier and is more influential overall in the random survival forest. These are importance scores, not signed contributions."
    default:
      return "Values show each feature's direction and relative strength of influence on the model's prediction for this patient."
  }
}