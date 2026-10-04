import type { SimulatorStore } from '@signalsafe/simulator-core/apps/contracts';
const ITERATIONS = 100000;
const hex = (bytes: ArrayBuffer) =>
    Array.from(new Uint8Array(bytes), (value) => value.toString(16).padStart(2, '0')).join('');
async function digest(password: string, salt: string) {
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveBits'],
    );
    return hex(
        await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                hash: 'SHA-256',
                iterations: ITERATIONS,
                salt: new TextEncoder().encode(salt),
            },
            key,
            256,
        ),
    );
}
export async function createLock(password: string): Promise<NonNullable<SimulatorStore['lock']>> {
    if (password.length < 4 || password.length > 128)
        throw new Error('Use a screen password between 4 and 128 characters.');
    const salt = hex(crypto.getRandomValues(new Uint8Array(16)).buffer);
    return { salt, digest: await digest(password, salt) };
}
export async function checkLock(password: string, lock: SimulatorStore['lock']): Promise<boolean> {
    return !lock || (await digest(password, lock.salt)) === lock.digest;
}
