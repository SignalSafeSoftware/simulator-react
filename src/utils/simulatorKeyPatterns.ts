/**
 * Simulator key naming patterns (advisory). Used by lint to suggest conventions
 * without rejecting existing data. See docs/simulator/simulator-authoring.md (§ Key and identifier naming).
 */

/** Slug-like: lowercase, digits, hyphens; one or more segments. */
export const SLUG_LIKE_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Single numeric string (legacy inbox/thread id, e.g. "0"). */
export const NUMERIC_ID_REGEX = /^\d+$/;

/** Max length for template key (backend SlugField). */
export const TEMPLATE_KEY_MAX_LENGTH = 64;

/** Max length for entity ids (contact, page, directory, message) — advisory. */
export const ENTITY_ID_MAX_LENGTH = 128;

export type KeyFamily = 'template' | 'contact' | 'page' | 'directory' | 'message' | 'thread';

/**
 * Returns true if the value looks like a conventional slug (lowercase, hyphen-separated).
 * Numeric-only strings (e.g. "0") are considered valid for message/thread for backward compatibility.
 */
export function isSlugLike(value: string): boolean {
    if (value.length === 0) return false;
    return NUMERIC_ID_REGEX.test(value) || SLUG_LIKE_REGEX.test(value);
}

/**
 * Advisory checks for key naming. Returns a short message if the key could be improved; null if fine or skipped.
 * Does not reject legacy or numeric ids.
 */
export function keyNamingSuggestion(
    key: string,
    family: KeyFamily
): string | null {
    if (key.length === 0) return 'Key should be non-empty.';
    if (key.length > ENTITY_ID_MAX_LENGTH) return `Key is longer than ${ENTITY_ID_MAX_LENGTH} chars; consider shortening.`;
    if (family === 'template' && key.length > TEMPLATE_KEY_MAX_LENGTH) {
        return `Template key exceeds ${TEMPLATE_KEY_MAX_LENGTH} chars (backend limit).`;
    }
    if (/\s/.test(key)) return 'Key contains spaces; prefer lowercase hyphen-separated (e.g. my-key).';
    if (/(?:^-|-$)/.test(key)) return 'Key has leading or trailing hyphen; remove.';
    if (NUMERIC_ID_REGEX.test(key)) return null; // legacy numeric id: no suggestion
    if (/[A-Z]/.test(key)) return 'Key contains uppercase; prefer lowercase (e.g. my-key).';
    if (/_[a-z]/.test(key) || key.includes('__')) return 'Key contains underscores; prefer hyphens for new keys.';
    return null;
}
