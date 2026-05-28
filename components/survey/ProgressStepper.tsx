"use client";

import { useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import type {
  ProgressData,
  SectionProgress,
  SectionStatus,
  SectionKey,
} from "@/lib/survey/progress";

export const JUMP_EVENT = "survey:jump";

export type JumpEventDetail = {
  targetStepKey: string;
  handled: boolean;
};

function pathnameToSection(pathname: string, code: string): SectionKey | null {
  const prefix = `/survey/${code}/`;
  if (!pathname.startsWith(prefix)) return null;
  const tail = pathname.slice(prefix.length).split("/").filter(Boolean);
  const [head, ...rest] = tail;
  switch (head) {
    case "consent":
      return "consent";
    case "background":
      return "background";
    case "practice":
      return "practice";
    case "final":
      return "final";
    case "modality": {
      const idx = Number(rest[0]);
      if (idx >= 0 && idx <= 3) return `modality-${idx}` as SectionKey;
      return null;
    }
    default:
      return null;
  }
}

function codeFromPathname(pathname: string): string | null {
  const match = pathname.match(/^\/survey\/([^/]+)/);
  return match ? match[1] : null;
}

function pathnameToSubStep(
  pathname: string,
  code: string,
): "patient-0" | "patient-1" | "summary" | null {
  const prefix = `/survey/${code}/modality/`;
  if (!pathname.startsWith(prefix)) return null;
  const tail = pathname.slice(prefix.length).split("/").filter(Boolean);
  // tail = [modalityIdx, "patient", patientIdx] or [modalityIdx, "summary"]
  if (tail[1] === "summary") return "summary";
  if (tail[1] === "patient") {
    if (tail[2] === "0") return "patient-0";
    if (tail[2] === "1") return "patient-1";
  }
  return null;
}

function targetStepToPath(
  step: SectionProgress["targetStep"],
  code: string,
): string {
  const base = `/survey/${code}`;
  switch (step.kind) {
    case "consent":
      return `${base}/consent`;
    case "background":
      return `${base}/background`;
    case "practice":
      return `${base}/practice`;
    case "patient":
      return `${base}/modality/${step.modalityIndex}/patient/${step.patientIndex}`;
    case "summary":
      return `${base}/modality/${step.modalityIndex}/summary`;
    case "final":
      return `${base}/final`;
    default:
      return base;
  }
}

function stepKeyToSerialized(step: SectionProgress["targetStep"]): string {
  switch (step.kind) {
    case "patient":
      return `patient:${step.modalityIndex}:${step.patientIndex}`;
    case "summary":
      return `summary:${step.modalityIndex}`;
    default:
      return step.kind;
  }
}

type CircleStyle = {
  background: string;
  color: string;
  borderColor: string;
  ring: string | null;
};

function circleStyle(status: SectionStatus): CircleStyle {
  switch (status) {
    case "current":
      return {
        background: "var(--survey-accent)",
        color: "var(--survey-surface)",
        borderColor: "var(--survey-accent)",
        ring: "0 0 0 4px color-mix(in oklab, var(--survey-accent) 18%, transparent)",
      };
    case "done":
      return {
        background: "#3a9d63",
        color: "#ffffff",
        borderColor: "#3a9d63",
        ring: null,
      };
    case "incomplete":
      return {
        background: "#d97706",
        color: "#ffffff",
        borderColor: "#d97706",
        ring: null,
      };
    case "pending":
      return {
        background: "var(--survey-surface)",
        color: "var(--survey-ink-faint)",
        borderColor: "var(--survey-line)",
        ring: null,
      };
  }
}

function labelColor(status: SectionStatus): string {
  switch (status) {
    case "current":
      return "var(--survey-ink)";
    case "done":
    case "incomplete":
      return "var(--survey-ink)";
    case "pending":
      return "var(--survey-ink-faint)";
  }
}

function Item({
  section,
  index,
  isFirst,
  isLast,
  effectiveStatus,
  showSubDots,
  urlSubStepKey,
  onJump,
  pending,
}: {
  section: SectionProgress;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  effectiveStatus: SectionStatus;
  showSubDots: boolean;
  urlSubStepKey: "patient-0" | "patient-1" | "summary" | null;
  onJump: (target: SectionProgress["targetStep"]) => void;
  pending: boolean;
}) {
  const title = [
    section.label,
    section.sublabel && `(${section.sublabel})`,
    effectiveStatus === "incomplete" && "— required fields missing",
    effectiveStatus === "pending" && "— not visited yet",
  ]
    .filter(Boolean)
    .join(" ");

  const s = circleStyle(effectiveStatus);

  return (
    <li
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        flex: "1 1 0",
        minWidth: 0,
        listStyle: "none",
      }}
    >
      {!isFirst && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 0,
            right: "calc(50% + 20px)",
            top: "16px",
            height: "1px",
            background: "var(--survey-line)",
            zIndex: 0,
          }}
        />
      )}
      {/* Right connector segment */}
      {!isLast && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "calc(50% + 20px)",
            right: 0,
            top: "16px",
            height: "1px",
            background: "var(--survey-line)",
            zIndex: 0,
          }}
        />
      )}

      <button
        type="button"
        onClick={() => onJump(section.targetStep)}
        disabled={pending}
        title={title}
        aria-current={effectiveStatus === "current" ? "step" : undefined}
        style={{
          width: "32px",
          height: "32px",
          minWidth: "32px",
          minHeight: "32px",
          borderRadius: "9999px",
          borderWidth: "1px",
          borderStyle: "solid",
          padding: 0,

          background: s.background,
          color: s.color,
          borderColor: s.borderColor,
          boxShadow: s.ring ?? undefined,
          
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          position: "relative",
          zIndex: 1,
          
          fontSize: "12px",
          fontWeight: 500,
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
          fontFamily: "inherit",
          
          cursor: pending ? "wait" : "pointer",
          opacity: pending ? 0.7 : 1,
          transition: "transform 200ms ease, box-shadow 200ms ease",
        }}
        onMouseEnter={(e) => {
          if (!pending) e.currentTarget.style.transform = "scale(1.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        {effectiveStatus === "done" ? (
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
            style={{ width: "14px", height: "14px" }}
          >
            <path
              fillRule="evenodd"
              d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.3 3.3 6.8-6.8a1 1 0 0 1 1.4 0Z"
              clipRule="evenodd"
            />
          </svg>
        ) : effectiveStatus === "incomplete" ? (
          <span aria-label="incomplete">!</span>
        ) : (
          <span>{index + 1}</span>
        )}
      </button>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          width: "100%",
          padding: "0 4px",
        }}
      >
        <p
          style={{
            fontSize: "11px",
            lineHeight: 1.2,
            margin: 0,
            color: labelColor(effectiveStatus),
            fontWeight: effectiveStatus === "current" ? 500 : 400,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {section.label}
        </p>
        {showSubDots && section.subSteps ? (
          <SubDotsRow
            subSteps={section.subSteps}
            urlSubStepKey={urlSubStepKey}
            onJump={onJump}
            pending={pending}
          />
        ) : section.sublabel ? (
          <p
            style={{
              fontSize: "10px",
              lineHeight: 1.2,
              marginTop: "2px",
              marginBottom: 0,
              color: "var(--survey-ink-faint)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {section.sublabel}
          </p>
        ) : null}
      </div>
    </li>
  );
}

function subDotStyle(
  status: "done" | "incomplete" | "pending",
  isActive: boolean,
): {
  background: string;
  borderColor: string;
  color: string;
} {
  if (isActive) {
    return {
      background: "var(--survey-accent)",
      borderColor: "var(--survey-accent)",
      color: "var(--survey-surface)",
    };
  }
  switch (status) {
    case "done":
      return {
        background: "#3a9d63",
        borderColor: "#3a9d63",
        color: "#ffffff",
      };
    case "incomplete":
      return {
        background: "#d97706",
        borderColor: "#d97706",
        color: "#ffffff",
      };
    case "pending":
      return {
        background: "transparent",
        borderColor: "var(--survey-line)",
        color: "var(--survey-ink-faint)",
      };
  }
}

function SubDotsRow({
  subSteps,
  urlSubStepKey,
  onJump,
  pending,
}: {
  subSteps: NonNullable<SectionProgress["subSteps"]>;
  urlSubStepKey: "patient-0" | "patient-1" | "summary" | null;
  onJump: (target: SectionProgress["targetStep"]) => void;
  pending: boolean;
}) {
  return (
    <div
      style={{
        marginTop: "6px",
        display: "flex",
        justifyContent: "center",
        gap: "6px",
      }}
      aria-label="Sub-step progress"
    >
      {subSteps.map((s) => {
        const isActive = s.key === urlSubStepKey;
        const colors = subDotStyle(s.completionStatus, isActive);
        const title = `${s.label} — ${
          isActive
            ? "you are here"
            : s.completionStatus === "done"
              ? "completed"
              : s.completionStatus === "incomplete"
                ? "required fields missing"
                : "not visited yet"
        }`;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => onJump(s.targetStep)}
            disabled={pending}
            title={title}
            aria-label={title}
            style={{
              width: "10px",
              height: "10px",
              minWidth: "10px",
              minHeight: "10px",
              borderRadius: "9999px",
              borderWidth: "1px",
              borderStyle: "solid",
              padding: 0,
              background: colors.background,
              borderColor: colors.borderColor,
              color: colors.color,
              cursor: pending ? "wait" : "pointer",
              opacity: pending ? 0.7 : 1,
              transition: "transform 160ms ease",
              display: "block",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              if (!pending) e.currentTarget.style.transform = "scale(1.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          />
        );
      })}
    </div>
  );
}

export function ProgressStepper({
  progress,
  hidden = false,
  stepCounter = null,
}: {
  progress: ProgressData;
  hidden?: boolean;
  stepCounter?: { current: number; total: number } | null;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [pending, startTransition] = useTransition();

  const code = codeFromPathname(pathname);
  const urlSection = code ? pathnameToSection(pathname, code) : null;
  const urlSubStepKey = code ? pathnameToSubStep(pathname, code) : null;

  function handleJump(target: SectionProgress["targetStep"]) {
    if (!code) return;
    const serialized = stepKeyToSerialized(target);
    const fallbackPath = targetStepToPath(target, code);

    startTransition(() => {
      if (typeof window !== "undefined") {
        const detail: JumpEventDetail = {
          targetStepKey: serialized,
          handled: false,
        };
        const evt = new CustomEvent<JumpEventDetail>(JUMP_EVENT, { detail });
        window.dispatchEvent(evt);
        if (!detail.handled) {
          router.push(fallbackPath);
        }
      }
    });
  }

  if (hidden) return null;

  return (
    <nav
      aria-label="Survey progress"
      style={{
        width: "100%",
        borderBottom: "1px solid var(--survey-line)",
        background:
          "color-mix(in oklab, var(--survey-bg) 92%, transparent)",
        backdropFilter: "blur(8px)",
        position: "sticky",
        top: 0,
        zIndex: 9,
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "20px 48px",
          display: "flex",
          alignItems: "flex-start",
          gap: "24px",
        }}
      >
        <ol
          style={{
            display: "flex",
            alignItems: "flex-start",
            flex: "1 1 0",
            minWidth: 0,
            margin: 0,
            padding: 0,
          }}
        >
          {progress.sections.map((section, i) => {
            const isCurrentByUrl = urlSection === section.key;
            const effectiveStatus: SectionStatus = isCurrentByUrl
              ? "current"
              : section.completionStatus;

            return (
              <Item
                key={section.key}
                section={section}
                index={i}
                isFirst={i === 0}
                isLast={i === progress.sections.length - 1}
                effectiveStatus={effectiveStatus}
                showSubDots={isCurrentByUrl && section.subSteps !== null}
                urlSubStepKey={urlSubStepKey}
                onJump={handleJump}
                pending={pending}
              />
            );
          })}
        </ol>

        {stepCounter && (
          <div
            style={{ flexShrink: 0, textAlign: "right", paddingTop: "2px" }}
            aria-label="Step counter"
          >
            <p
              style={{
                fontSize: "12px",
                fontVariantNumeric: "tabular-nums",
                color: "var(--survey-ink-soft)",
                margin: 0,
                fontFamily: "var(--survey-font-display)",
              }}
            >
              {String(stepCounter.current).padStart(2, "0")}
              <span style={{ margin: "0 4px", opacity: 0.5 }}>/</span>
              {String(stepCounter.total).padStart(2, "0")}
            </p>
            <p
              style={{
                fontSize: "10px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--survey-ink-faint)",
                marginTop: "2px",
                marginBottom: 0,
              }}
            >
              Step
            </p>
          </div>
        )}
      </div>
    </nav>
  );
}