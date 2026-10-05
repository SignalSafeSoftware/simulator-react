/**
 * Contacts list, search, and detail inside the simulator.
 * Used from Phone app (screen=contacts) and from the Check contact panel overlay.
 * When phoneLocalNavItems is provided, shows wireframe-style phone tabs above content (Back still available).
 */
import { SimulatorPhoneScreenId } from '@signalsafe/simulator-core/devicePayload';
import {
    SIM_BORDER,
    SIM_BORDER_BOTTOM_NONE,
    SIM_BTN_SM,
    SIM_FLEX_GROW_1,
    SIM_FLEX_SHRINK_0,
    SIM_ROUNDED_NONE,
    SIM_SURFACE_LIGHT,
    SIM_TEXT_CENTER,
    SIM_TEXT_SM,
    SimulatorButtonTone,
    joinClasses,
} from '../../ui/styles/simulatorClasses.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { usePhoneNumberFormatter } from '../../contract/phonePresentation.js';
import { SimulatorListGroup } from '../../ui/lists/SimulatorListGroup.js';
import { useMemo, useState } from 'react';
import type {
    ContactsHostDetailProps,
    ContactsPhoneNavProps,
    ContactsSearchProps,
} from './contactsViewRoles.js';
import { SimulatorDetailBackBar, SimulatorDetailBlock } from '../../ui/layout/SimulatorDetail.js';
import { SimulatorSearchInput } from '../../ui/lists/SimulatorSearchInput.js';
import { SimulatorLocalNav } from '../../ui/navigation/SimulatorLocalNav.js';
import { simLayout, simScreen, simSpacing, simTypo } from '../../simulatorStyles.js';
import { SimulatorButton } from '../../ui/primitives.js';
import { renderCompactContactList, renderPhoneContactList } from './ContactRowLists.js';
import {
    SIM_PHONE_CONTACT_DETAIL,
    SIM_SCREEN_HEADER_ROW,
} from '../../ui/styles/semanticSimulatorClasses.js';
import type { SimulatorSessionContact } from '../../types/session.js';
import {
    normalizeNameForMatch,
    phoneDigitsOnly,
    normalizeEmailForMatch,
    phonesMatch,
    namesMatch,
} from '../../utils/payload/contactNormalization.js';

export interface ContactsViewProps
    extends ContactsSearchProps, ContactsPhoneNavProps, ContactsHostDetailProps {
    contacts: SimulatorSessionContact[] | null;
    onBack: () => void;
    /** When opened from "Check contact", pass the name/number being verified so we can show match status. */
    verificationContext?: { name?: string; number?: string } | null;
    /** Optional title (e.g. "Contacts" in app, "Verify contact" in panel). */
    title?: string;
    /** Called when user opens a contact (navigates to detail). */
    onOpenContact?: (contactId: string) => void;
    /** When set, show a plus button in the header to add a contact (e.g. navigate to Add Contact screen). */
    onAddContact?: () => void;
    /** Open with this contact id selected (detail view) — e.g. README / harness screenshots. */
    initialSelectedContactId?: string | null;
    /** When true, contact detail shows title only (no ← Back) for tight wireframe captures. */
    contactDetailTitleOnly?: boolean;
}

function matchesPrimaryEmail(email: string | undefined, emailQuery: string): boolean {
    return email ? normalizeEmailForMatch(email).includes(emailQuery) : false;
}

/** True if contact matches query (name, number, or email). Exported for tests. */
export function contactMatchesSearch(contact: SimulatorSessionContact, query: string): boolean {
    if (!query) return true;
    const qName = normalizeNameForMatch(query);
    const qPhone = phoneDigitsOnly(query);
    const qEmail = normalizeEmailForMatch(query);
    if (!qName && !qPhone && !qEmail) return false;
    if (qName && normalizeNameForMatch(contact.displayName).includes(qName)) return true;
    if (
        qName &&
        [
            ...(contact.phoneNumbers ?? []),
            ...(contact.emailAddresses ?? []),
            ...(contact.postalAddresses ?? []),
        ].some((item) => normalizeNameForMatch(`${item.label} ${item.value}`).includes(qName))
    )
        return true;
    if (
        qPhone &&
        contact.phoneNumbers?.some((item) =>
            phoneDigitsOnly(item.number || item.value).includes(qPhone),
        )
    )
        return true;
    if (contact.number && qPhone && phoneDigitsOnly(contact.number).includes(qPhone)) return true;
    return matchesPrimaryEmail(contact.email, qEmail);
}

/** True if verification context (name/number) matches contact. Exported for tests. */
export function contextMatchesContact(
    contact: SimulatorSessionContact,
    ctx: { name?: string; number?: string },
): boolean {
    if (
        ctx.number &&
        contact.phoneNumbers?.some((item) => phonesMatch(item.number || item.value, ctx.number!))
    )
        return true;
    if (ctx.number && contact.number && phonesMatch(contact.number, ctx.number)) return true;
    if (ctx.name && contact.displayName && namesMatch(contact.displayName, ctx.name)) return true;
    return false;
}

export default function ContactsView({
    contacts,
    onBack,
    verificationContext,
    title,
    onOpenContact,
    onSearchSubmit,
    initialSearch = '',
    searchQuery: controlledSearchQuery,
    onSearchChange,
    phoneLocalNavItems,
    phoneActiveId = SimulatorPhoneScreenId.Contacts,
    onPhoneNavSelect,
    onAddContact,
    initialSelectedContactId = null,
    contactDetailTitleOnly = false,
    hostOwnsPhoneContactDetail = false,
    onPhoneContactOpen,
}: Readonly<ContactsViewProps>) {
    const screenLocale = useSimulatorLocale();

    const formatNumber = usePhoneNumberFormatter();
    const [internalQuery, setInternalQuery] = useState(initialSearch);
    const isControlled = controlledSearchQuery !== undefined && onSearchChange !== undefined;
    const searchQuery = isControlled ? controlledSearchQuery : internalQuery;
    const setSearchQuery = isControlled ? onSearchChange : setInternalQuery;
    const [selectedId, setSelectedId] = useState<string | null>(
        () => initialSelectedContactId ?? null,
    );

    const list = useMemo(() => contacts ?? [], [contacts]);
    const filtered = useMemo(
        () => list.filter((c) => contactMatchesSearch(c, searchQuery)),
        [list, searchQuery],
    );
    const matchingContact = useMemo(() => {
        if (!verificationContext || list.length === 0) return null;
        return list.find((c) => contextMatchesContact(c, verificationContext)) ?? null;
    }, [list, verificationContext]);

    const selected = selectedId ? list.find((c) => c.id === selectedId) : null;
    const hasPhoneNav = phoneLocalNavItems != null && phoneLocalNavItems.length > 0;

    const open = (contact: SimulatorSessionContact) => {
        onOpenContact?.(contact.id);
        if (hostOwnsPhoneContactDetail && onPhoneContactOpen)
            onPhoneContactOpen(contact.id, contact);
        else setSelectedId(contact.id);
    };

    const phoneNavBlock =
        hasPhoneNav && onPhoneNavSelect ? (
            <SimulatorLocalNav
                items={phoneLocalNavItems}
                activeId={phoneActiveId}
                onSelect={onPhoneNavSelect}
                className={joinClasses(simSpacing.mb0, SIM_BORDER_BOTTOM_NONE, SIM_FLEX_SHRINK_0)}
                aria-label={screenLocale.t('screen.contactsView.phone.tabs')}
            />
        ) : null;

    const listContent = hasPhoneNav
        ? renderPhoneContactList(filtered, open)
        : renderCompactContactList(filtered, open);

    if (selected) {
        return (
            <div className={simLayout.screenColumn}>
                <div className={simLayout.scrollBody}>
                    <SimulatorDetailBackBar
                        onBack={() => setSelectedId(null)}
                        title={screenLocale.t('screen.contactsView.contact')}
                        ariaLabel={screenLocale.t('a11y.back.to.list')}
                        titleOnly={contactDetailTitleOnly}
                    />
                    <SimulatorDetailBlock className={SIM_PHONE_CONTACT_DETAIL}>
                        <h3 className={simTypo.subheading}>{selected.displayName}</h3>
                        {selected.number != null && selected.number !== '' && (
                            <p className={joinClasses(simSpacing.mb1, SIM_TEXT_SM)}>
                                <span className={simTypo.secondary}>
                                    {screenLocale.t('screen.contactsView.number')}
                                </span>{' '}
                                {formatNumber(selected.number)}
                            </p>
                        )}
                        {selected.email != null && selected.email !== '' && (
                            <p className={joinClasses(simSpacing.mb0, SIM_TEXT_SM)}>
                                <span className={simTypo.secondary}>
                                    {screenLocale.t('screen.contactsView.email')}
                                </span>{' '}
                                {selected.email}
                            </p>
                        )}
                    </SimulatorDetailBlock>
                </div>
                {phoneNavBlock}
            </div>
        );
    }

    return (
        <div className={simLayout.screenColumn}>
            <div className={simLayout.scrollBody}>
                {hasPhoneNav && (
                    <div className={joinClasses(simScreen.header, simSpacing.sectionGap)}>
                        {screenLocale.t('screen.contactsView.contacts')}
                    </div>
                )}
                {onAddContact == null ? (
                    <SimulatorDetailBackBar
                        onBack={onBack}
                        title={title ?? screenLocale.t('screen.contactsView.contacts')}
                        ariaLabel={screenLocale.t('a11y.back')}
                        titleOnly
                    />
                ) : (
                    <div className={joinClasses(simLayout.headerRowBetween, SIM_SCREEN_HEADER_ROW)}>
                        <span className={joinClasses(SIM_FLEX_GROW_1, SIM_TEXT_CENTER)}>
                            {title ?? screenLocale.t('screen.contactsView.contacts')}
                        </span>
                        <SimulatorButton
                            tone={SimulatorButtonTone.PrimaryOutline}
                            className={joinClasses(
                                SIM_ROUNDED_NONE,
                                simSpacing.py1,
                                simSpacing.px2,
                                simSpacing.me2,
                                SIM_BTN_SM,
                            )}
                            onClick={onAddContact}
                            aria-label={screenLocale.t('screen.contactsView.add.contact')}
                        >
                            {screenLocale.t('screen.contactsView.add')}
                        </SimulatorButton>
                    </div>
                )}

                {verificationContext &&
                    (verificationContext.number || verificationContext.name) && (
                        <div
                            className={joinClasses(
                                simTypo.secondaryTight,
                                simSpacing.p2,
                                SIM_ROUNDED_NONE,
                                SIM_SURFACE_LIGHT,
                                SIM_BORDER,
                            )}
                        >
                            {matchingContact ? (
                                <span>
                                    <span className={simTypo.secondary}>
                                        {screenLocale.t(
                                            'screen.contactsView.matches.saved.contact',
                                        )}
                                    </span>
                                    <strong>{matchingContact.displayName}</strong>
                                    {matchingContact.number &&
                                        screenLocale.t('screen.contactsView.value1', {
                                            value1: String(matchingContact.number),
                                        })}
                                </span>
                            ) : (
                                <span className={simTypo.secondary}>
                                    {screenLocale.t(
                                        'screen.contactsView.no.match.in.contacts.for.this.number.or.name',
                                    )}
                                </span>
                            )}
                        </div>
                    )}

                <SimulatorListGroup
                    empty={filtered.length === 0}
                    emptyMessage={
                        list.length === 0
                            ? screenLocale.t('screen.contactsView.no.contacts')
                            : screenLocale.t('screen.contactsView.no.results.for.value1', {
                                  value1: String(searchQuery),
                              })
                    }
                    search={
                        <SimulatorSearchInput
                            value={searchQuery}
                            onChange={setSearchQuery}
                            onSubmit={onSearchSubmit}
                            placeholder={screenLocale.t(
                                'copy.ContactsView.search.by.name.number.or.email',
                            )}
                            ariaLabel={screenLocale.t('a11y.search.contacts')}
                            className={simSpacing.mb2}
                            dataSimulatorSearch
                        />
                    }
                >
                    {listContent}
                </SimulatorListGroup>
            </div>
            {phoneNavBlock}
        </div>
    );
}
