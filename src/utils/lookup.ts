/** Table lookup that ignores inherited keys such as `constructor` for untrusted ids. */
export function ownValue<T>(table: Readonly<Record<string, T>>, key: string): T | undefined {
    return Object.hasOwn(table, key) ? table[key] : undefined;
}
