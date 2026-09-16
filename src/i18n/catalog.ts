import { utilityEnglish } from './utilityEnglish.js';
import { screenEnglish } from './screenEnglish.js';
/** English is the shipped language. Hosts own additional catalogs and locale choice. */
export const simulatorEnglish = {
  ...utilityEnglish,
"a11y.back.to.list": "Back to list",
"a11y.back": "Back",
"a11y.search.contacts": "Search contacts",
"a11y.incoming.call": "Incoming call",
"a11y.voicemail": "Voicemail",
"a11y.search.store": "Search store",
"a11y.back.to.home": "Back to Home",
"a11y.search.settings": "Search settings",
"a11y.search.threads": "Search threads",

    'email.backToFolder': 'Back to {folder}',
    "fallback.unsupported_screen_hint": "Use the tabs above to switch app, or check template configuration.",
    "fallback.unsupported_screen_empty_placeholder": "(empty)",
    "fallback.unsupported_screen_title": "Unsupported screen",
    "fallback.learner_unsupported_screen_message": "Try another section of the simulation or ask your trainer for help.",
    "fallback.learner_unsupported_screen_title": "This part of the simulation could not be displayed.",
    "fallback.learner_simulator_error_message": "The simulation encountered a problem. Please continue or ask your trainer.",
    "fallback.learner_simulator_error_title": "This part of the simulation could not be displayed.",
    "fallback.shell_exit_label": "Exit",
    "fallback.error": "Simulator error",
    "messages.newMessage": "New message",

    "nav.phone": "Phone",
    "nav.email": "Email",
    "nav.internet": "Internet",
    "nav.messages": "Messages",
    "nav.home": "Home",
    "nav.history": "History",
    "nav.contacts": "Contacts",
    "nav.dial": "Dial",
    "nav.back": "Back",
    "nav.inbox": "Inbox",
    "nav.outbox": "Outbox",
    "nav.trash": "Trash",
    "nav.send": "Send",
    "nav.reply": "Reply",
    "nav.forward": "Forward",
    "nav.dispose": "Dispose",
    "nav.settings": "Settings",
    "nav.exit": "Exit",
    "nav.simulatorChannels": "Simulator channels",
    "nav.appTertiaryMenu": "App tertiary menu",
    "nav.appSecondaryMenu": "App secondary menu",

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
    'contact.currentPhoto': 'Current contact image',
    'contact.noPhoto': 'No contact image',
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
    'action.back': 'Back',
    'calls.search': 'Search calls',
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
        t(key: Key, values: Readonly<Record<string, string | number>> = {}): string {
            const message = overrides[key] ?? english[key];
            const template =
                typeof message === 'string'
                    ? message
                    : (message[
                          plural.select(typeof values.count === 'number' ? values.count : 0)
                      ] ?? message.other);
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
