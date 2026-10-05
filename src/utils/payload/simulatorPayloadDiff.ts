import { PayloadSection } from './payloadSections.js';
/**
 * Lightweight diff for simulator payloads (simulator_json).
 * Produces a short, meaning-focused summary of changes for authors/admins.
 * Simulator-scoped only; no generic JSON diff.
 */

import type {} from '../../types/shapes.js';
import {
    idsFromNamedSection,
    summarizeDiffItems,
    addEntryPointDiff,
    addDeviceDiff,
    addCollectionDiff,
    addPhoneDiff,
    addEmailDiff,
    addMessagesDiff,
    addInternetDiff,
    addHomeDiff,
} from './payloadDiffSections.js';

export interface SimulatorDiffItem {
    /** Section that changed (e.g. "entry_point", "contacts", "email"). */
    section: string;
    /** One-line summary (e.g. "Entry point: email/list → messages/thread_detail"). */
    change: string;
    /** Optional detail (e.g. ids added/removed). */
    detail?: string;
}
/**
 * Compare two simulator payloads and return a list of meaningful changes.
 * Order: entry_point, device, contacts, directory, phone, email, messages, internet, home.
 */
export function diffSimulatorPayloads(
    left: Record<string, unknown>,
    right: Record<string, unknown>,
): SimulatorDiffItem[] {
    const out: SimulatorDiffItem[] = [];
    addEntryPointDiff(out, left, right);
    addDeviceDiff(out, left, right);

    const leftContacts = idsFromNamedSection(left, PayloadSection.Contacts);
    const rightContacts = idsFromNamedSection(right, PayloadSection.Contacts);
    addCollectionDiff(
        out,
        PayloadSection.Contacts,
        'Contacts',
        leftContacts,
        rightContacts,
        (diff) => {
            const details: string[] = [];
            if (diff.added.length > 0) details.push(summarizeDiffItems(diff.added, '+'));
            if (diff.removed.length > 0) details.push(summarizeDiffItems(diff.removed, '-'));
            return details.join('; ');
        },
    );

    const leftDirectory = idsFromNamedSection(left, PayloadSection.Directory);
    const rightDirectory = idsFromNamedSection(right, PayloadSection.Directory);
    addCollectionDiff(
        out,
        PayloadSection.Directory,
        'Directory',
        leftDirectory,
        rightDirectory,
        (diff) =>
            [...diff.added.map((id) => `+${id}`), ...diff.removed.map((id) => `-${id}`)].join(', '),
    );
    if (out.length > 0) {
        const last = out.at(-1);
        if (
            last?.section === PayloadSection.Directory &&
            last.change === `Directory: ${leftDirectory.length} → ${rightDirectory.length}`
        ) {
            last.change = `Directory: ${leftDirectory.length} → ${rightDirectory.length} entries`;
        }
    }

    addPhoneDiff(out, left, right);
    addEmailDiff(out, left, right);
    addMessagesDiff(out, left, right);
    addInternetDiff(out, left, right);
    addHomeDiff(out, left, right);

    return out;
}
