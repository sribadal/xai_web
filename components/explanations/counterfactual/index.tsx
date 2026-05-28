import { CchvaeView } from "./cchvae-view";
import { CounterfactualView as CounterfactualViewImpl } from "./internal/counterfactual-view";
import { DiceView } from "./dice-view";
import { FaceView } from "./face-view";
import { LoreCounterfactualView } from "./lore-counterfactual-view";
import { WachterView } from "./wachter-view";
import type { CounterfactualViewProps } from "./internal/types";
import { CounterNetView } from "./counternet-view";
import { ReviseView } from "./revise-view";

export function CounterfactualView(props: CounterfactualViewProps) {
  switch (props.method) {
    case "dice":
      return <DiceView {...props} />;
    case "wachter":
      return <WachterView {...props} />;
    case "face":
      return <FaceView {...props} />;
    case "lore_counterfactual":
      return <LoreCounterfactualView {...props} />;
    case "cchvae":
      return <CchvaeView {...props} />;
    case "revise":
      return <ReviseView {...props} />;
    case "counternet":
      return <CounterNetView {...props} />;
    default:
      return <CounterfactualViewImpl {...props} />;
  }
}

export { CchvaeView, DiceView, FaceView, LoreCounterfactualView, WachterView };
export type { CounterfactualViewProps };
