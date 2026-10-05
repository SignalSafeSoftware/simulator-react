export interface KeyedItem<T> {
    key: string;
    item: T;
    index: number;
}

/** Keys for lists without ids: a content-derived base plus an occurrence counter. */
export function withStableKeys<T>(
    items: readonly T[],
    getBaseKey: (item: T) => string,
): Array<KeyedItem<T>> {
    const counts = new Map<string, number>();
    return items.map((item, index) => {
        const base = getBaseKey(item);
        const nextCount = (counts.get(base) ?? 0) + 1;
        counts.set(base, nextCount);
        return { key: `${base}-${nextCount}`, item, index };
    });
}

export function joinKeyParts(parts: ReadonlyArray<string | null | undefined>): string {
    return parts.map((part) => part ?? '').join('|');
}
