import { cookies } from "next/headers";

export const SUPPORTED_LOCALES = ["en", "nl"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export async function getLocale(): Promise<SupportedLocale> {
  const c = await cookies();
  const raw = c.get("locale")?.value;
  if (raw && SUPPORTED_LOCALES.includes(raw as SupportedLocale)) {
    return raw as SupportedLocale;
  }
  return "en";
}