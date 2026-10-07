/** The only module that touches browser dialog, clipboard, clock and document globals; tests and hosts stub it. */
export function confirmInBrowser(message: string): boolean {
    return window.confirm(message);
}

export function canCopyToClipboard(): boolean {
    return typeof navigator?.clipboard?.writeText === 'function';
}

export function copyToClipboard(text: string): Promise<void> {
    return navigator.clipboard.writeText(text);
}

export function currentIsoTime(): string {
    return new Date().toISOString();
}

export function currentTimeMs(): number {
    return Date.now();
}

export function listenForDocumentKeydown(handler: (event: KeyboardEvent) => void): () => void {
    document.addEventListener('keydown', handler, true);
    return () => document.removeEventListener('keydown', handler, true);
}

export function dispatchDocumentEvent(event: Event): void {
    if (typeof document === 'undefined') return;
    document.dispatchEvent(event);
}

export function focusDocumentElement(selector: string): void {
    document.querySelector<HTMLElement>(selector)?.focus();
}

/** Trigger a user-requested JSON backup download and release its temporary URL. */
export function downloadJsonFile(contents: string, filename: string): void {
    const url = URL.createObjectURL(new Blob([contents], { type: 'application/json' }));
    try {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
    } finally {
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
}
