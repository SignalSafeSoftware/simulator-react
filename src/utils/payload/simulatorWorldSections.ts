/**
 * Simulator world sections and merge for partial-world composition.
 * Matches backend semantics: only section keys, recursive dict merge, list replace.
 * No TreeSpec; simulator-scoped only. Used when composing partial payloads (authoring overlays, tests).
 */

import { isRecord } from '@signalsafe/tree-spec';

import type { SimulatorTemplatePayload } from '../../types/session.js';

/** Canonical world section keys (session shape). Same set as backend minus naming (backend uses entry_point, messages). */
export const SIMULATOR_WORLD_SECTION_KEYS = [
    'device',
    'entryPoint',
    'email',
    'sms',
    'browser',
    'phone',
    'contacts',
    'directory',
    'home',
] as const;

export type SimulatorWorldSectionKey = (typeof SIMULATOR_WORLD_SECTION_KEYS)[number];

/** Partial simulator world: any subset of section keys. No template identity (templateKey, name, channel, etc.). */
export type SimulatorWorldPartial = Partial<
    Pick<
        SimulatorTemplatePayload,
        | 'device'
        | 'entryPoint'
        | 'email'
        | 'sms'
        | 'browser'
        | 'phone'
        | 'contacts'
        | 'directory'
        | 'home'
    >
>;

/** Recursive merge: overlay wins; dicts merged recursively; arrays/other replaced. */
function deepMergeValue(baseVal: unknown, overlayVal: unknown): unknown {
    if (isRecord(baseVal) && isRecord(overlayVal)) {
        const result = { ...baseVal };
        for (const key of Object.keys(overlayVal)) {
            result[key] = deepMergeValue(result[key], overlayVal[key]);
        }
        return result;
    }
    return structuredClone(overlayVal);
}

/**
 * Deep-merge overlay into base. Only keys in SIMULATOR_WORLD_SECTION_KEYS are merged.
 * - Dicts: recursive merge; overlay wins for conflicting keys.
 * - Lists: overlay replaces base (no concatenation).
 * - Other: overlay replaces base.
 * Base is not mutated; result is a new object.
 */
export function deepMergeSections(
    base: SimulatorWorldPartial,
    overlay: SimulatorWorldPartial,
): SimulatorWorldPartial {
    const merged: Record<string, unknown> = {};
    for (const key of SIMULATOR_WORLD_SECTION_KEYS) {
        const baseVal = base[key];
        const overlayVal = overlay[key];
        if (overlayVal !== undefined) merged[key] = deepMergeValue(baseVal, overlayVal);
        else if (baseVal !== undefined) merged[key] = structuredClone(baseVal);
    }
    // Only canonical section keys are copied, each as a deep copy of a section value.
    return merged as SimulatorWorldPartial;
}

/**
 * Apply a sequence of partials in order, then an optional overlay.
 * First partial is the base; each subsequent one merges on top; overlay wins last.
 * Returns a single merged partial (no template meta). Combine with template meta and `SimulatorTemplatePayload`
 * fields in your host.
 */
export function applyPartials(
    partials: SimulatorWorldPartial[],
    overlay?: SimulatorWorldPartial,
): SimulatorWorldPartial {
    if (partials.length === 0 && !overlay) return {};
    let merged: SimulatorWorldPartial = partials[0] ?? {};
    for (let i = 1; i < partials.length; i++) {
        merged = deepMergeSections(merged, partials[i] ?? {});
    }
    if (overlay != null && Object.keys(overlay).length > 0) {
        merged = deepMergeSections(merged, overlay);
    }
    return merged;
}
