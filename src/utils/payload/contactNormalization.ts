/**
 * Normalization utilities for simulator contact matching.
 * Used for search (name, number, email) and verification context (name, number).
 * Deterministic, no heavy dependencies; scoped to simulator contact flows.
 */

/** Lowercase, collapse runs of whitespace to single space, trim. */
export function normalizeNameForMatch(name: string): string {
    if (typeof name !== 'string') return '';
    return name.toLowerCase().trim().replaceAll(/\s+/g, ' ');
}

/** Digits only (no country-code stripping). Use for substring search. */
export function phoneDigitsOnly(phone: string): string {
    if (typeof phone !== 'string') return '';
    return Array.from(phone)
        .filter((char) => /\d/.test(char))
        .join('');
}

/**
 * Digits only. For 11-digit strings starting with "1" (US), strip the leading 1
 * so +1-555-123-4567 and 555-123-4567 compare equal. Use for verification/equality.
 */
export function normalizePhoneForMatch(phone: string): string {
    const digits = phoneDigitsOnly(phone);
    if (digits.length === 11 && digits.startsWith('1')) {
        return digits.slice(1);
    }
    return digits;
}

/** Lowercase and trim. No change to local-part dots or plus addressing. */
export function normalizeEmailForMatch(email: string): string {
    if (typeof email !== 'string') return '';
    return email.toLowerCase().trim();
}

/**
 * True if two phone strings match for contact purposes:
 * normalized digits are equal, or one contains the other (length >= 7).
 */
export function phonesMatch(a: string, b: string): boolean {
    const na = normalizePhoneForMatch(a);
    const nb = normalizePhoneForMatch(b);
    if (na === nb) return true;
    if (na.length >= 7 && nb.length >= 7 && (na.includes(nb) || nb.includes(na))) return true;
    return false;
}

/**
 * True if two names match for contact purposes: one normalized name contains the other.
 */
export function namesMatch(contactName: string, contextName: string): boolean {
    const n1 = normalizeNameForMatch(contactName);
    const n2 = normalizeNameForMatch(contextName);
    if (!n1 || !n2) return false;
    return n1.includes(n2) || n2.includes(n1);
}
