import type { CrisisResource, LocaleHint } from "../../../shared/protocol";

/**
 * Crisis resources, keyed by region.
 *
 * These numbers were previously hardcoded into JSX in src/pages/Chat.tsx, which
 * meant every user worldwide was shown US-only numbers. A US shortcode dialled
 * from India connects to nothing, so this is the one defect in this codebase
 * with consequences beyond a broken demo.
 *
 * Every entry carries its official source URL. Re-verify against that URL
 * before each release; helpline numbers do change, and a stale one here is
 * worse than no number at all.
 *
 * Last verified: 2026-09-12.
 */

const IN: CrisisResource[] = [
  {
    name: "Tele-MANAS",
    contact: "14416",
    method: "call",
    detail: "24/7, free, 20 languages. Also reachable on 1-800-891-4416.",
    url: "https://telemanas.mohfw.gov.in/",
  },
];

const US: CrisisResource[] = [
  {
    name: "988 Suicide & Crisis Lifeline",
    contact: "988",
    method: "call",
    detail: "24/7, free. Call or text 988.",
    url: "https://988lifeline.org/",
  },
  {
    name: "Crisis Text Line",
    contact: "741741",
    method: "text",
    detail: "Text HOME to 741741 (AYUDA for Spanish).",
    url: "https://www.crisistextline.org/",
  },
];

/**
 * Fallback for regions with no curated entry. Deliberately does NOT invent a
 * number: pointing at a maintained international directory is honest, a
 * fabricated helpline is dangerous.
 */
const INTERNATIONAL: CrisisResource[] = [
  {
    name: "Find a Helpline",
    contact: "https://findahelpline.com",
    method: "chat",
    detail: "Free, verified crisis lines in over 130 countries.",
    url: "https://findahelpline.com",
  },
];

const BY_REGION: Record<string, CrisisResource[]> = { IN, US };

/**
 * IANA time zone -> country, for the regions we actually cover.
 *
 * Time zone beats language for this decision. navigator.language reports the
 * browser's UI language, not where the user is: a machine in India very
 * commonly reports "en-US", which would otherwise show US-only numbers to an
 * Indian user - the exact bug this module exists to fix.
 *
 * Note both "Asia/Kolkata" and the legacy "Asia/Calcutta" alias: Chrome on
 * Windows still reports the latter, so omitting it would silently miss India.
 *
 * Extend this map whenever a region is added to BY_REGION.
 */
const TIMEZONE_TO_REGION: Record<string, string> = {
  "Asia/Kolkata": "IN",
  "Asia/Calcutta": "IN",

  "America/New_York": "US",
  "America/Detroit": "US",
  "America/Chicago": "US",
  "America/Menominee": "US",
  "America/Denver": "US",
  "America/Boise": "US",
  "America/Phoenix": "US",
  "America/Los_Angeles": "US",
  "America/Anchorage": "US",
  "America/Juneau": "US",
  "America/Sitka": "US",
  "America/Metlakatla": "US",
  "America/Yakutat": "US",
  "America/Nome": "US",
  "America/Adak": "US",
  "America/Indiana/Indianapolis": "US",
  "America/Indiana/Vincennes": "US",
  "America/Indiana/Winamac": "US",
  "America/Indiana/Marengo": "US",
  "America/Indiana/Petersburg": "US",
  "America/Indiana/Vevay": "US",
  "America/Indiana/Tell_City": "US",
  "America/Indiana/Knox": "US",
  "America/Kentucky/Louisville": "US",
  "America/Kentucky/Monticello": "US",
  "America/North_Dakota/Center": "US",
  "America/North_Dakota/New_Salem": "US",
  "America/North_Dakota/Beulah": "US",
  "Pacific/Honolulu": "US",
};

/** First region subtag found across the accept-language style list. */
function regionFromLanguages(languages?: string[]): string | null {
  if (!languages) return null;

  for (const tag of languages) {
    const region = tag.split("-")[1];
    if (region && BY_REGION[region.toUpperCase()]) {
      return region.toUpperCase();
    }
  }
  return null;
}

/**
 * Resolve crisis resources for a viewer.
 *
 * Precedence is deliberate: physical location (time zone) first, stated
 * language second, international directory last. We never guess a number for
 * a region we have not verified.
 */
export function resourcesFor(hint: LocaleHint): CrisisResource[] {
  const byZone = hint.timeZone ? TIMEZONE_TO_REGION[hint.timeZone] : undefined;
  if (byZone && BY_REGION[byZone]) return BY_REGION[byZone];

  const byLang = regionFromLanguages(hint.languages);
  if (byLang) return BY_REGION[byLang];

  return INTERNATIONAL;
}

/** Which region a hint resolved to, for logging and tests. */
export function regionFor(hint: LocaleHint): string {
  const byZone = hint.timeZone ? TIMEZONE_TO_REGION[hint.timeZone] : undefined;
  if (byZone && BY_REGION[byZone]) return byZone;
  return regionFromLanguages(hint.languages) ?? "INTL";
}

export { INTERNATIONAL as internationalResources };
