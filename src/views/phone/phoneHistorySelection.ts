import type { SimulatorCallHistoryEntry, SimulatorSessionContact } from '../../types/session.js';
import { normalizePhoneForMatch } from '../../utils/payload/contactNormalization.js';

/** Historical calls are grouped by a complete dialable number, never a display name or suffix. */
export function relatedPhoneHistoryEntries(
    entries: readonly SimulatorCallHistoryEntry[],
    selected: SimulatorCallHistoryEntry,
): SimulatorCallHistoryEntry[] {
    const number = normalizePhoneForMatch(selected.number);
    return entries.filter((entry) =>
        number ? normalizePhoneForMatch(entry.number) === number : entry.id === selected.id,
    );
}

/** Use contact presentation only when exactly one contact owns the dialable number. */
export function phoneHistoryContact(
    entry: SimulatorCallHistoryEntry,
    contacts: readonly SimulatorSessionContact[],
): { name?: string; numberLabel?: string } {
    const number = normalizePhoneForMatch(entry.number);
    if (!number) return {};
    const matches = contacts.filter((contact) =>
        [
            contact.number ?? '',
            ...(contact.phoneNumbers ?? []).map((value) => value.number || value.value),
        ].some((value) => normalizePhoneForMatch(value) === number),
    );
    const contact = matches.length === 1 ? matches[0] : undefined;
    if (!contact) return {};
    const labels = new Set(
        (contact.phoneNumbers ?? [])
            .filter((value) => normalizePhoneForMatch(value.number || value.value) === number)
            .map((value) => value.label.trim())
            .filter(Boolean),
    );
    return {
        name: contact.displayName || undefined,
        numberLabel: labels.size === 1 ? [...labels][0] : undefined,
    };
}
