// @vitest-environment jsdom
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { SimulatorContactValue } from '@signalsafe/simulator-core/devicePayload';
import ContactsView from '../src/views/contacts/ContactsView.js';
import { ContactDetailPanel } from '../src/views/contacts/ContactDetailPanel.js';
import { SimulatorLocaleProvider } from '../src/i18n/SimulatorLocale.js';
import { PhoneNumberFormatContext } from '../src/contract/phonePresentation.js';
import type { SimulatorSessionContact } from '../src/types/session.js';

const contact = {
    id: 'ada',
    displayName: 'Ada Lovelace',
    number: '+15550101',
    email: 'ada@example.test',
} satisfies SimulatorSessionContact;

describe('shared contact detail screen', () => {
    it('uses the photo-card layout with scalar fallbacks and an accessible Back action', () => {
        const onBack = vi.fn();
        const { container } = render(<ContactDetailPanel contact={contact} onBack={onBack} />);
        expect(screen.getByRole('article', { name: contact.displayName })).toBeTruthy();
        expect(
            container.querySelector('.contact-detail-card__photo .simulator-avatar'),
        ).toBeTruthy();
        expect(
            within(screen.getByRole('region', { name: 'Phone numbers' })).getByText(contact.number),
        ).toBeTruthy();
        expect(
            within(screen.getByRole('region', { name: 'Email addresses' })).getByText(
                contact.email,
            ),
        ).toBeTruthy();
        expect(screen.queryByRole('region', { name: 'Postal addresses' })).toBeNull();
        expect(
            container
                .querySelector('.simulator-phone-contact-detail__title')
                ?.getAttribute('tabindex'),
        ).toBe('-1');
        expect(screen.queryByRole('textbox')).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Back to list' }));
        expect(onBack).toHaveBeenCalledOnce();
    });

    it('shows all labeled values instead of duplicating scalar fields and preserves postal lines', () => {
        const multi: SimulatorSessionContact = {
            ...contact,
            phoneNumbers: [
                { label: 'Mobile', value: '+15550101' },
                { label: 'Work', value: '+15550202' },
            ],
            emailAddresses: [
                { label: '', value: 'ada@example.test' },
                { label: 'Work', value: 'ada@work.test' },
            ],
            postalAddresses: [{ label: 'Office', value: '12 Main St\nLondon' }],
        };
        const { container } = render(<ContactDetailPanel contact={multi} onBack={vi.fn()} />);
        expect(screen.getAllByText('+15550101')).toHaveLength(1);
        expect(screen.getAllByText('ada@example.test')).toHaveLength(1);
        expect(screen.getByText('+15550202')).toBeTruthy();
        expect(screen.getByText('ada@work.test')).toBeTruthy();
        expect(
            within(screen.getByRole('region', { name: 'Phone numbers' })).getAllByRole('listitem'),
        ).toHaveLength(2);
        expect(
            within(screen.getByRole('region', { name: 'Email addresses' })).getByText('Unlabeled'),
        ).toBeTruthy();
        expect(container.querySelector('.contact-detail-list__postal-value')?.textContent).toBe(
            '12 Main St\nLondon',
        );
    });

    it('keeps host image, actions, metadata and footer slots within the same screen', () => {
        const onCall = vi.fn();
        const onEdit = vi.fn();
        const renderPhoneAction = vi.fn(
            (phone: SimulatorContactValue, current: SimulatorSessionContact) => (
                <button onClick={() => onCall(phone.number, current.id)}>Call local contact</button>
            ),
        );
        const { container } = render(
            <PhoneNumberFormatContext.Provider value={(value) => `formatted ${value}`}>
                <SimulatorLocaleProvider
                    messages={{
                        'contact.phones': 'Telefonos',
                        'contact.unlabeled': 'Sin etiqueta',
                    }}
                >
                    <ContactDetailPanel
                        contact={{
                            ...contact,
                            postalAddresses: [{ label: 'Office', value: 'Default address' }],
                        }}
                        onBack={vi.fn()}
                        titleOnly
                        notice={<output>Host availability</output>}
                        identityImage={<img src='/local-contact.png' alt='Ada portrait' />}
                        actions={<button onClick={onEdit}>Edit contact</button>}
                        renderPhoneAction={renderPhoneAction}
                        showPostalAddresses={false}
                        additionalDetails={
                            <section aria-label='Imported metadata'>Imported address</section>
                        }
                        footer={<nav aria-label='Host navigation'>Host footer</nav>}
                    />
                </SimulatorLocaleProvider>
            </PhoneNumberFormatContext.Provider>,
        );
        expect(screen.getAllByTestId('simulator-phone-contact-detail')).toHaveLength(1);
        expect(screen.queryByRole('button', { name: 'Back to list' })).toBeNull();
        expect(
            container
                .querySelector('.contact-detail-card__photo')
                ?.contains(screen.getByRole('img', { name: 'Ada portrait' })),
        ).toBe(true);
        expect(screen.getByText('formatted +15550101')).toBeTruthy();
        expect(
            within(screen.getByRole('region', { name: 'Telefonos' })).getByText('Sin etiqueta'),
        ).toBeTruthy();
        expect(screen.getByText('Host availability')).toBeTruthy();
        expect(screen.queryByText('Default address')).toBeNull();
        expect(screen.getByRole('region', { name: 'Imported metadata' })).toBeTruthy();
        expect(screen.getByRole('navigation', { name: 'Host navigation' })).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Call local contact' }));
        expect(onCall).toHaveBeenCalledWith('+15550101', 'ada');
        fireEvent.click(screen.getByRole('button', { name: 'Edit contact' }));
        expect(onEdit).toHaveBeenCalledOnce();
    });

    it('keeps postal addresses when a host supplies unrelated additional metadata', () => {
        render(
            <ContactDetailPanel
                contact={{
                    ...contact,
                    postalAddresses: [{ label: 'Work', value: '10 Example Street' }],
                }}
                onBack={vi.fn()}
                additionalDetails={<p>Analytical Engines Ltd</p>}
            />,
        );
        expect(screen.getByRole('region', { name: 'Postal addresses' })).toBeTruthy();
        expect(screen.getByText('10 Example Street')).toBeTruthy();
        expect(screen.getByText('Analytical Engines Ltd')).toBeTruthy();
    });

    it('preserves standalone local navigation when opening contact details', () => {
        const onPhoneNavSelect = vi.fn();
        const { container } = render(
            <ContactsView
                contacts={[contact]}
                onBack={vi.fn()}
                initialSelectedContactId={contact.id}
                phoneLocalNavItems={[
                    { id: 'history', label: 'History' },
                    { id: 'contacts', label: 'Contacts' },
                ]}
                onPhoneNavSelect={onPhoneNavSelect}
            />,
        );
        const history = screen.getByRole('tab', { name: 'History' });
        const content = container.querySelector('.simulator-contact-detail__content');
        expect(container.querySelector('.simulator-contact-detail--local-nav')).toBeTruthy();
        expect(content?.contains(history)).toBe(false);
        expect(
            container.querySelector('.simulator-contact-detail__footer')?.contains(history),
        ).toBe(true);
        fireEvent.click(history);
        expect(onPhoneNavSelect).toHaveBeenCalledWith('history');
        fireEvent.click(screen.getByRole('button', { name: 'Back to list' }));
        expect(screen.queryByTestId('simulator-phone-contact-detail')).toBeNull();
        expect(screen.getByRole('tab', { name: 'History' })).toBeTruthy();
    });

    it('omits empty groups while retaining the name and shared avatar', () => {
        render(
            <ContactDetailPanel
                contact={{ id: 'empty', displayName: 'Name only' }}
                onBack={vi.fn()}
            />,
        );
        expect(screen.getByRole('heading', { name: 'Name only' })).toBeTruthy();
        expect(screen.queryByRole('region')).toBeNull();
    });
});
