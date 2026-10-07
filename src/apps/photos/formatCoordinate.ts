/** Display only; saved coordinates keep full precision. */
export function formatCoordinate(value: number | null, unknown: string): string {
    return value === null ? unknown : value.toFixed(4);
}
