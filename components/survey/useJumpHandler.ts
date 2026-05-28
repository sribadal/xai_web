"use client";

import { useEffect, useRef } from "react";
import { saveAndJump } from "@/app/survey/[code]/actions";
import type { ResponsePayload } from "@/lib/survey/shared";
import { JUMP_EVENT, type JumpEventDetail } from "./ProgressStepper";

export function useJumpHandler(opts: {
  sessionId: string;
  code: string;
  getPayloads: () => ResponsePayload[];
}) {
  const getPayloadsRef = useRef(opts.getPayloads);
  getPayloadsRef.current = opts.getPayloads;

  useEffect(() => {
    function handler(e: Event) {
      const ce = e as CustomEvent<JumpEventDetail>;
      const target = ce.detail?.targetStepKey;
      if (!target) return;

      ce.detail.handled = true;

      const payloads = getPayloadsRef.current();
      void saveAndJump({
        sessionId: opts.sessionId,
        code: opts.code,
        payloads,
        targetStepKey: target,
      });
    }
    window.addEventListener(JUMP_EVENT, handler);
    return () => window.removeEventListener(JUMP_EVENT, handler);
  }, [opts.sessionId, opts.code]);
}