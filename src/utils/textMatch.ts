/** True when the trimmed query is empty or is a case-insensitive substring of any field. */
export function matchesAnyField(
    query: string,
    fields: ReadonlyArray<string | null | undefined>,
): boolean {
    const lower = query.trim().toLowerCase();
    if (!lower) return true;
    return fields.some((field) => (field ?? '').toLowerCase().includes(lower));
}
