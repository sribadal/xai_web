"use client";

type Props = {
  current: string;
};

export function LocaleToggle({ current }: Props) {
  const setLocale = (locale: string) => {
    if (locale === current) return;
    document.cookie = `locale=${locale};path=/;max-age=31536000;SameSite=Lax`;
    window.location.reload();
  };

  return (
    <div
      role="radiogroup"
      aria-label="Language"
      style={{
        display: "inline-flex",
        borderRadius: 999,
        border: "1px solid var(--survey-border, #d4d4d4)",
        overflow: "hidden",
        background: "var(--survey-card-bg, #fff)",
      }}
    >
      {(["en", "nl"] as const).map((locale) => {
        const active = current === locale;
        return (
          <button
            key={locale}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setLocale(locale)}
            style={{
              fontSize: 11,
              padding: "3px 12px",
              border: "none",
              background: active
                ? "var(--survey-accent, #1f1f1f)"
                : "transparent",
              color: active
                ? "var(--survey-accent-fg, #fff)"
                : "var(--survey-muted, #6b6b6b)",
              cursor: active ? "default" : "pointer",
              fontWeight: 500,
              letterSpacing: "0.03em",
              fontFamily: "inherit",
              transition: "background 120ms ease, color 120ms ease",
            }}
          >
            {locale.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}