/** The only module that touches browser dialog and clipboard globals; hosts override via the apps host. */
export function confirmInBrowser(message: string): boolean {
    return window.confirm(message);
}

export function canCopyToClipboard(): boolean {
    return typeof navigator?.clipboard?.writeText === 'function';
}

export function copyToClipboard(text: string): Promise<void> {
    return navigator.clipboard.writeText(text);
}
