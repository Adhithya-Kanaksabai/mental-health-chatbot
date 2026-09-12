import type { CrisisResource } from "../../../shared/protocol";

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

const BY_REGION: Record<string, CrisisResource[]> = {
  IN,
  US,
};

/**
 * Resolve resources for a BCP-47-ish locale ("en-IN" -> IN). Falls back to the
 * international directory rather than defaulting to any single country.
 */
export function resourcesForLocale(locale?: string): CrisisResource[] {
  if (!locale) return INTERNATIONAL;

  const region = locale.split("-")[1]?.toUpperCase();
  if (!region) return INTERNATIONAL;

  return BY_REGION[region] ?? INTERNATIONAL;
}

export { INTERNATIONAL as internationalResources };
