/** Plain data shapes for the shared contact form; hosts own validation and persistence. */
export interface ContactPostalAddress {
    line1: string;
    line2: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
}

export interface ContactFormValue {
    id: string;
    label: string;
    value: string;
    number?: string | null;
    address?: ContactPostalAddress | null;
}

export interface ContactFormIdentity {
    firstName: string;
    lastName: string;
    company: string;
}

export interface ContactFormDetails {
    identity?: ContactFormIdentity | null;
    phones: ContactFormValue[];
    emails: ContactFormValue[];
    addresses: ContactFormValue[];
    preferredPhone: string | null;
    preferredEmail: string | null;
    preferredAddress: string | null;
}

/** What the form needs to start from; a missing contact starts an empty form. */
export interface ContactFormSource {
    name?: string;
    number?: string;
    email?: string;
    details?: ContactFormDetails | null;
}

export function identityFromName(name = ''): ContactFormIdentity {
    const [firstName = '', ...lastName] = name.trim().split(/\s+/);
    return { firstName, lastName: lastName.join(' '), company: '' };
}

export function displayNameFromIdentity(identity: ContactFormIdentity): string {
    return (
        [identity.firstName.trim(), identity.lastName.trim()].filter(Boolean).join(' ') ||
        identity.company.trim()
    );
}

export function initialContactDetails(
    contact: ContactFormSource | undefined,
    createId: () => string,
): ContactFormDetails {
    if (contact?.details) return contact.details;
    const phones = contact?.number ? [{ id: createId(), label: '', value: contact.number }] : [];
    const emails = contact?.email ? [{ id: createId(), label: '', value: contact.email }] : [];
    return {
        phones,
        emails,
        addresses: [],
        preferredPhone: phones[0]?.id ?? null,
        preferredEmail: emails[0]?.id ?? null,
        preferredAddress: null,
    };
}

export function postalAddressFields(value: ContactFormValue): ContactPostalAddress {
    if (value.address) return value.address;
    return { line1: value.value, line2: '', city: '', region: '', postalCode: '', country: '' };
}

export function formatPostalAddress(address: ContactPostalAddress): string {
    return [
        address.line1,
        address.line2,
        [address.city, address.region, address.postalCode].filter(Boolean).join(', '),
        address.country,
    ]
        .filter(Boolean)
        .join('\n');
}

function isValueList(value: unknown): value is ContactFormValue[] {
    return (
        Array.isArray(value) &&
        value.every(
            (item) =>
                typeof item === 'object' &&
                item !== null &&
                'id' in item &&
                typeof item.id === 'string' &&
                'value' in item &&
                typeof item.value === 'string',
        )
    );
}

function isDetails(value: unknown): value is ContactFormDetails {
    return (
        typeof value === 'object' &&
        value !== null &&
        'phones' in value &&
        isValueList(value.phones) &&
        'emails' in value &&
        isValueList(value.emails) &&
        'addresses' in value &&
        isValueList(value.addresses)
    );
}

function isIdentity(value: unknown): value is ContactFormIdentity {
    return (
        typeof value === 'object' &&
        value !== null &&
        'firstName' in value &&
        typeof value.firstName === 'string' &&
        'lastName' in value &&
        typeof value.lastName === 'string' &&
        'company' in value &&
        typeof value.company === 'string'
    );
}

/** Reads the hidden `name`, `identity` and `details` fields the shared form submits. */
export function contactFormValues(form: FormData): {
    name: string;
    details: ContactFormDetails | undefined;
} {
    const name = form.get('name');
    const rawDetails = form.get('details');
    const rawIdentity = form.get('identity');
    const parsed: unknown = typeof rawDetails === 'string' ? JSON.parse(rawDetails) : undefined;
    const details = isDetails(parsed) ? parsed : undefined;
    if (details && typeof rawIdentity === 'string' && rawIdentity) {
        const identity: unknown = JSON.parse(rawIdentity);
        if (isIdentity(identity)) details.identity = identity;
    }
    return { name: typeof name === 'string' ? name : '', details };
}
