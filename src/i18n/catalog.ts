import { utilityEnglish } from './utilityEnglish.js';
import { screenEnglish } from './screenEnglish.js';
import { appsEnglish } from './appsEnglish.js';
/** English is the shipped language. Hosts own additional catalogs and locale choice. */
export const simulatorEnglish = {
    ...utilityEnglish,
    ...appsEnglish,
    'a11y.back.to.list': 'Back to list',
    'a11y.back': 'Back',
    'a11y.search.contacts': 'Search contacts',
    'a11y.incoming.call': 'Incoming call',
    'a11y.voicemail': 'Voicemail',
    'a11y.search.store': 'Search store',
    'a11y.back.to.home': 'Back to Home',
    'a11y.search.settings': 'Search settings',
    'a11y.search.threads': 'Search threads',
    'screen.smsSimulatorView.attachment.unavailable': 'Attachment unavailable: {label}',
    'screen.smsSimulatorView.open.attachment': 'Open attachment: {label}',
    'screen.messagesThreadListView.load.more': 'Load more conversations',
    'list.loadingMore': 'Loading…',
    'messages.loadEarlier': 'Load earlier messages',
    'messages.loadingEarlier': 'Loading earlier messages…',
    'messages.retryEarlier': 'Retry earlier messages',

    'app.photos.captureInvalid': '{when} ({zone}; ambiguous or invalid local time)',
    'app.mail.scenario.source': 'Scenario email',
    'app.mail.scenario.emptyFolder': 'No scenario messages in this folder.',
    'app.mail.scenario.previewOnly':
        'Only the scenario preview text is available for this message.',
    'app.mail.scenario.reply': 'Reply in simulated mailbox',
    'app.mail.scenario.forward': 'Forward in simulated mailbox',
    'app.mail.scenario.readOnly':
        'Scenario content is read-only. Replies and forwards create separate simulated drafts.',

    'email.backToFolder': 'Back to {folder}',
    'fallback.unsupported_screen_hint':
        'Use the tabs above to switch app, or check template configuration.',
    'fallback.unsupported_screen_empty_placeholder': '(empty)',
    'fallback.unsupported_screen_title': 'Unsupported screen',
    'fallback.learner_unsupported_screen_message':
        'Try another section of the simulation or ask your trainer for help.',
    'fallback.learner_unsupported_screen_title':
        'This part of the simulation could not be displayed.',
    'fallback.learner_simulator_error_message':
        'The simulation encountered a problem. Please continue or ask your trainer.',
    'fallback.learner_simulator_error_title': 'This part of the simulation could not be displayed.',
    'fallback.error': 'Simulator error',
    'messages.newMessage': 'New message',

    'nav.phone': 'Phone',
    'nav.email': 'Email',
    'nav.internet': 'Internet',
    'nav.messages': 'Messages',
    'nav.home': 'Home',
    'nav.history': 'History',
    'nav.contacts': 'Contacts',
    'nav.dial': 'Dial',
    'nav.back': 'Back',
    'nav.inbox': 'Inbox',
    'nav.outbox': 'Outbox',
    'nav.trash': 'Trash',
    'nav.send': 'Send',
    'nav.reply': 'Reply',
    'nav.forward': 'Forward',
    'nav.dispose': 'Dispose',
    'settings.regional.label': 'Regional settings',
    'settings.regional.heading': 'Region and formats',
    'settings.regional.country': 'Country',
    'settings.regional.language': 'Language for formatting',
    'settings.regional.languageHint': 'This changes formatting, not the interface language.',
    'settings.regional.currency': 'Currency',
    'settings.regional.dateFormat': 'Date format',
    'settings.regional.dateLocale': 'Regional default',
    'settings.regional.timeFormat': 'Time format',
    'settings.regional.time12': '12-hour (AM/PM)',
    'settings.regional.time24': '24-hour',
    'settings.regional.timeZone': 'Time zone',
    'settings.regional.preview': 'Preview: {date} · {currency}',
    'settings.regional.save': 'Save regional settings',
    'settings.regional.saving': 'Saving regional settings…',
    'settings.regional.saved': 'Regional settings saved.',
    'settings.regional.failed':
        'Could not save regional settings. Your changes are preserved. Please try again.',
    'settings.regional.invalid':
        'Some regional settings are invalid. Restore valid preferences and try again.',
    'app.backup.title': 'Simulated device data',
    'app.backup.notice':
        'Vault, gallery and simulated email belong to this device. Backups include secret values and image/attachment bytes; keep them private. Screen passwords are excluded.',
    'app.backup.identity': 'Simulated email address',
    'app.backup.identityInvalid': 'Enter a valid email address.',
    'app.backup.identitySaved': 'Email identity saved.',
    'app.backup.saveIdentity': 'Save email identity',
    'app.backup.download': 'Download simulator backup',
    'app.backup.preview': 'Preview simulator restore',
    'app.backup.reading': 'Reading simulator backup…',
    'app.backup.cancelPreview': 'Cancel backup preview',
    'app.backup.invalid': 'Invalid or oversized simulator backup.',
    'app.backup.summary':
        'Replace local data with {secrets} secrets, {photos} photos and {messages} messages? The current screen password is retained.',
    'app.backup.restoreConfirm': 'Replace all simulated records with this backup?',
    'app.backup.restore': 'Restore simulator data',
    'app.backup.cancelRestore': 'Cancel restore',
    'app.backup.resetConfirm':
        'Delete all Vault records, photos and simulated email in this device? Other host data and the screen password are retained.',
    'app.backup.reset': 'Reset simulated records',
    'app.backup.resetDone': 'Simulated records reset.',
    'app.backup.operationFailed':
        'The simulator data operation failed. Your changes have not been confirmed. Try again.',
    'settings.appearance.sage': 'Sage',
    'settings.appearance.ocean': 'Ocean',
    'settings.appearance.sand': 'Sand',
    'settings.appearance.night': 'Night',
    'nav.settings': 'Settings',
    'nav.exit': 'Exit',
    'nav.simulatorChannels': 'Simulator channels',
    'nav.appTertiaryMenu': 'App tertiary menu',
    'nav.appSecondaryMenu': 'App secondary menu',

    'phone.enterNumberReason': 'Enter a phone number before calling.',
    'messages.enterRecipientAndBody': 'Enter a recipient and a message before sending.',
    'messages.enterBody': 'Enter a message before sending.',
    'email.enterRecipient': 'Enter a recipient before sending.',

    'list.search': 'Search',
    'list.empty': 'No items.',
    'list.loading': 'Loading items…',

    ...screenEnglish,
    'contact.phones': 'Phone numbers',
    'contact.emails': 'Email addresses',
    'contact.addresses': 'Postal addresses',
    'contact.phone': 'Phone',
    'contact.email': 'Email',
    'contact.address': 'Address',
    'contact.mobile': 'Mobile',
    'contact.home': 'Home',
    'contact.work': 'Work',
    'contact.addValue': 'Add {kind}',
    'contact.removeValue': 'Remove {kind} {index}',
    'contact.valueLabel': 'Label for {kind} {index}',
    'contact.unlabeled': 'Unlabeled',
    'contact.preferred': 'Preferred {kind}',
    'contact.name': 'Name',
    'contact.identity': 'Name and image',
    'contact.save': 'Save contact',
    'contact.saving': 'Saving…',
    'contact.photo': 'Contact image',
    'contact.changePhoto': 'Change image',
    'contact.removePhoto': 'Remove image',
    'contact.restorePhoto': 'Restore original image',
    'contact.selectedPhoto': 'Selected replacement',
    'contact.noPhoto': 'No contact image',
    'contact.firstName': 'First name',
    'contact.lastName': 'Last name',
    'contact.company': 'Company',
    'contact.nameTooLong': 'The combined first and last name must be 100 characters or fewer.',
    'contact.add': 'Add contact',
    'contact.edit': 'Edit contact',
    'contact.delete': 'Delete contact',
    'contact.address.line1': 'Street address',
    'contact.address.line2': 'Apartment, suite, etc.',
    'contact.address.city': 'City',
    'contact.address.region': 'State / province / region',
    'contact.address.postalCode': 'Postal code',
    'contact.address.country': 'Country',
    'messages.newThread': 'New Thread',
    'messages.unconfigured': 'Message sending is not configured for this scenario.',
    'messages.sendFailed': 'Message could not be sent. Your draft is preserved.',
    'messages.sending': 'Sending…',
    'messages.message': 'Message',
    'messages.body': 'Message body',
    'messages.placeholder': 'I will send you a message',
    'email.compose': 'Compose Email',
    'email.unconfigured': 'Email sending is not configured for this scenario.',
    'email.recipient': 'Recipient',
    'phone.number': 'Phone number',
    'phone.enterNumber': 'Enter number',
    'phone.backspace': 'Backspace',
    'phone.call': 'Call',
    'email.bcc': 'Bcc',
    'email.sending': 'Sending…',
    'email.sendFailed': 'Email could not be sent. Your draft is preserved.',
    'email.subject': 'Subject',
    'email.body': 'Body',
    'action.send': 'Send',
    'action.cancel': 'Cancel',
    'home.appUnavailable': 'Unavailable in this scenario.',
    'calls.search': 'Search calls',
    'calls.history': 'Call History',
    'calls.details': 'Call Details',
    'calls.with': 'Calls with {caller}',
    'calls.fromNumber.one': '{count} call from this number',
    'calls.fromNumber.other': '{count} calls from this number',
    'calls.dateUnknown': 'Date unknown',
    'calls.simulated': 'Simulated call · no audio',
    'calls.empty': 'No recent calls.',
    'search.empty': 'No results for "{query}".',
    'calls.incoming': 'Incoming',
    'calls.outgoing': 'Outbound',
    'calls.missed': 'Missed',
    'calls.voicemail': 'Voicemail',
    'calls.unknown': 'Call',
    'value.unknown': 'Unknown',
    'calls.duration': '{minutes}m {seconds}s',
} satisfies Record<string, string>;

export type SimulatorMessageKey = keyof typeof simulatorEnglish;
export type Message =
    | string
    | Readonly<Partial<Record<Intl.LDMLPluralRule, string>> & { other: string }>;
export type Catalog<Key extends string> = Readonly<Record<Key, Message>>;

export interface LocaleOptions {
    locale?: string;
    timeZone?: string;
}

/** Interpolation returns plain text; imported content never passes through a catalog. */
export function createTranslator<Key extends string>(
    english: Catalog<Key>,
    overrides: Partial<Catalog<Key>> = {},
    { locale = 'en', timeZone }: LocaleOptions = {},
) {
    const plural = new Intl.PluralRules(locale);
    return {
        locale,
        timeZone,
        t(key: Key, values: Readonly<Record<string, string | number>> = {}): string {
            const message = overrides[key] ?? english[key];
            const count = typeof values.count === 'number' ? values.count : 0;
            const template =
                typeof message === 'string'
                    ? message
                    : (message[plural.select(count)] ?? message.other);
            return template.replace(/\{(\w+)\}/g, (token: string, name: string) =>
                values[name] === undefined ? token : String(values[name]),
            );
        },
        number(value: number, options?: Intl.NumberFormatOptions): string {
            return new Intl.NumberFormat(locale, options).format(value);
        },
        date(value: Date | number, options?: Intl.DateTimeFormatOptions): string {
            return new Intl.DateTimeFormat(locale, { timeZone, ...options }).format(value);
        },
    };
}
