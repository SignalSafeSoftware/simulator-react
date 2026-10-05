/** Top-level payload section names used as labels by lint, realism and diff reports. */
export const PayloadSection = Object.freeze({
    EntryPoint: 'entry_point',
    Device: 'device',
    Phone: 'phone',
    Email: 'email',
    Messages: 'messages',
    Internet: 'internet',
    Home: 'home',
    Contacts: 'contacts',
    Directory: 'directory',
} as const);

export type PayloadSection = (typeof PayloadSection)[keyof typeof PayloadSection];
