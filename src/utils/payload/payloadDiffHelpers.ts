import { isRecord } from '@signalsafe/tree-spec';
import type { AppScreenRef } from '../../types/shapes.js';

export function recordOrUndefined(value: unknown): Record<string, unknown> | undefined {
    return isRecord(value) ? value : undefined;
}

export function getEntryPoint(p: Record<string, unknown>): AppScreenRef | null {
    const ep = p?.entry_point;
    if (!isRecord(ep)) return null;
    const app = typeof ep.app === 'string' ? ep.app : '';
    const screen = typeof ep.screen === 'string' ? ep.screen : '';
    return app ? { app, screen } : null;
}

export function idsFromArray(arr: unknown): string[] {
    if (!Array.isArray(arr)) return [];
    return arr
        .map((item) => (isRecord(item) && typeof item.id === 'string' ? item.id : ''))
        .filter(Boolean);
}

export function arrayLength(value: unknown): number {
    return Array.isArray(value) ? value.length : 0;
}

export function childArrayLength(
    parent: Record<string, unknown> | undefined,
    key: string,
    childKey: string,
): number {
    const child = parent?.[key];
    return isRecord(child) ? arrayLength(child[childKey]) : 0;
}

export function setDiff(left: string[], right: string[]): { added: string[]; removed: string[] } {
    const l = new Set(left);
    const r = new Set(right);
    return {
        added: right.filter((id) => !l.has(id)),
        removed: left.filter((id) => !r.has(id)),
    };
}

export function entryPointLabel(entryPoint: AppScreenRef | null): string {
    return entryPoint ? `${entryPoint.app}/${entryPoint.screen}` : '(none)';
}

export function idsFromNamedSection(payload: Record<string, unknown>, section: string): string[] {
    return idsFromArray(payload[section]);
}

export function summarizeDiffItems(items: string[], prefix: '+' | '-'): string {
    return `${prefix}${items.length} (${items.slice(0, 5).join(', ')}${items.length > 5 ? '…' : ''})`;
}

export function formatUnknownValue(value: unknown): string {
    if (typeof value === 'string') {
        return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
        return `${value}`;
    }
    if (value == null) {
        return '(none)';
    }
    try {
        const json = JSON.stringify(value);
        return json ?? '(none)';
    } catch {
        return '(unserializable)';
    }
}
