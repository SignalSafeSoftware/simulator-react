export function stringOr(value: unknown, fallback = ''): string {
    return typeof value === 'string' ? value : fallback;
}

export function optionalString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
}

export function nullableString(value: unknown): string | null {
    return typeof value === 'string' ? value : null;
}
