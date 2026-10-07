// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ContactEditorForm from '../src/views/contacts/ContactEditorForm';
import ContactDetailActions from '../src/views/contacts/ContactDetailActions';
import ContactEditorScreen from '../src/views/contacts/ContactEditorScreen';
import {
    contactFormValues,
    displayNameFromIdentity,
    formatPostalAddress,
    identityFromName,
    initialContactDetails,
} from '../src/views/contacts/contactFormModel';

afterEach(cleanup);

let next = 0;
const createId = () => `id-${++next}`;

describe('ContactEditorForm', () => {
    const renderForm = (props: Partial<Parameters<typeof ContactEditorForm>[0]> = {}) => {
        const onSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => event.preventDefault());
        const onCancel = vi.fn();
        const view = render(
            <ContactEditorForm
                createId={createId}
                onSubmit={onSubmit}
                onCancel={onCancel}
                {...props}
            />,
        );
        return { onSubmit, onCancel, form: view.container.querySelector('form')! };
    };

    it('shows name, phone, email and address sections and exits with Back', () => {
        const { onCancel } = renderForm();
        for (const label of ['First name', 'Last name', 'Company']) {
            expect(screen.getByLabelText(label)).toBeInstanceOf(HTMLInputElement);
        }
        for (const name of ['Phone numbers', 'Email addresses', 'Postal addresses']) {
            expect(screen.getByRole('heading', { name })).toBeInstanceOf(HTMLElement);
        }
        fireEvent.click(screen.getByRole('button', { name: 'Back' }));
        expect(onCancel).toHaveBeenCalledOnce();
    });

    it('submits the combined name, identity and details', () => {
        const { form } = renderForm({
            contact: {
                name: 'Sample Person',
                number: '+12025550100',
                email: 'sample@example.test',
            },
        });
        fireEvent.change(screen.getByLabelText('Company'), { target: { value: 'Example Co' } });
        fireEvent.click(screen.getByRole('button', { name: 'Add address' }));
        fireEvent.change(screen.getByLabelText('Street address 1'), {
            target: { value: '1 Example Way' },
        });
        const { name, details } = contactFormValues(new FormData(form));
        expect(name).toBe('Sample Person');
        expect(details?.identity).toEqual({
            firstName: 'Sample',
            lastName: 'Person',
            company: 'Example Co',
        });
        expect(details?.phones.map((phone) => phone.value)).toEqual(['+12025550100']);
        expect(details?.emails.map((email) => email.value)).toEqual(['sample@example.test']);
        expect(details?.addresses[0]?.value).toBe('1 Example Way');
    });

    it('blocks saving a name longer than 100 characters', () => {
        renderForm({ contact: { name: 'Sample Person' } });
        fireEvent.change(screen.getByLabelText('First name'), {
            target: { value: 'x'.repeat(100) },
        });
        expect(screen.getByRole('alert').textContent).toMatch(/100 characters/);
        expect(screen.getByRole('button', { name: 'Save contact' }).hasAttribute('disabled')).toBe(
            true,
        );
    });
});

describe('ContactEditorForm values', () => {
    const value = (id: string, text: string) => ({ id, label: '', value: text });
    const details = {
        phones: [value('p1', '+12025550100'), value('p2', '+12025550101')],
        emails: [value('e1', 'a@example.test')],
        addresses: [value('a1', '1 Way'), value('a2', '2 Way')],
        preferredPhone: 'p1',
        preferredEmail: null,
        preferredAddress: 'a1',
    };

    it('edits every identity field and address row', () => {
        const onSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => event.preventDefault());
        const view = render(
            <ContactEditorForm
                createId={createId}
                onSubmit={onSubmit}
                onCancel={() => {}}
                contact={{ name: 'Sample Person', details }}
            />,
        );
        fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'Other' } });
        fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Alex' } });

        fireEvent.change(screen.getByLabelText('Label for address 2'), {
            target: { value: 'Work' },
        });
        fireEvent.change(screen.getByLabelText('Street address 2'), { target: { value: '3 Way' } });
        const preferred = screen.getAllByRole('checkbox', { name: 'Preferred address' });
        fireEvent.click(preferred[1]!);
        fireEvent.click(preferred[1]!);
        fireEvent.click(preferred[0]!);
        fireEvent.click(screen.getByRole('button', { name: 'Remove address 2' }));
        fireEvent.click(screen.getByRole('button', { name: 'Remove address 1' }));
        fireEvent.change(screen.getByLabelText('Label for phone 1'), { target: { value: 'Work' } });
        fireEvent.change(screen.getByLabelText('Label for email 1'), { target: { value: 'Home' } });
        fireEvent.click(screen.getByRole('button', { name: 'Add address' }));

        const { name, details: submitted } = contactFormValues(
            new FormData(view.container.querySelector('form')!),
        );
        expect(name).toBe('Alex Other');
        expect(submitted?.addresses.map((address) => address.value)).toEqual(['']);
        expect(submitted?.preferredAddress).toBeNull();
    });
});

describe('contactFormModel', () => {
    it('derives names, details and address text', () => {
        expect(identityFromName('A B C')).toEqual({ firstName: 'A', lastName: 'B C', company: '' });
        expect(
            displayNameFromIdentity({ firstName: '', lastName: '', company: ' Example Co ' }),
        ).toBe('Example Co');
        expect(initialContactDetails(undefined, createId)).toMatchObject({
            phones: [],
            preferredPhone: null,
        });
        expect(
            formatPostalAddress({
                line1: '1 Way',
                line2: '',
                city: 'City',
                region: 'ST',
                postalCode: '00000',
                country: 'Country',
            }),
        ).toBe('1 Way\nCity, ST, 00000\nCountry');
    });

    it('ignores malformed submitted details', () => {
        const form = new FormData();
        form.set('name', 'Name');
        form.set('details', JSON.stringify({ phones: 'nope' }));
        expect(contactFormValues(form)).toEqual({ name: 'Name', details: undefined });
        expect(contactFormValues(new FormData())).toEqual({ name: '', details: undefined });
        const withIdentity = (identity: unknown) => {
            const data = new FormData();
            data.set(
                'details',
                JSON.stringify({
                    phones: [],
                    emails: [],
                    addresses: [],
                    preferredPhone: null,
                    preferredEmail: null,
                    preferredAddress: null,
                }),
            );
            data.set('identity', JSON.stringify(identity));
            return contactFormValues(data).details?.identity;
        };
        expect(withIdentity({ nope: true })).toBeUndefined();
        expect(withIdentity({ firstName: 'A', lastName: 'B', company: '' })).toEqual({
            firstName: 'A',
            lastName: 'B',
            company: '',
        });
        expect(
            initialContactDetails(
                {
                    details: {
                        phones: [],
                        emails: [],
                        addresses: [],
                        preferredPhone: null,
                        preferredEmail: null,
                        preferredAddress: null,
                    },
                },
                createId,
            ).phones,
        ).toEqual([]);
    });
});

describe('ContactDetailActions', () => {
    it('calls edit and delete, and disables delete when unavailable', () => {
        const onEdit = vi.fn();
        const onDelete = vi.fn();
        const { rerender } = render(
            <ContactDetailActions onEdit={onEdit} onDelete={onDelete}>
                <button>Extra</button>
            </ContactDetailActions>,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Edit contact' }));
        fireEvent.click(screen.getByRole('button', { name: 'Delete contact' }));
        expect(onEdit).toHaveBeenCalledOnce();
        expect(onDelete).toHaveBeenCalledOnce();
        expect(screen.getByRole('button', { name: 'Extra' })).toBeInstanceOf(HTMLElement);
        rerender(
            <ContactDetailActions
                onEdit={onEdit}
                onDelete={onDelete}
                deleteCapability={{ state: 'unsupported', reason: 'Kept as evidence.' }}
            />,
        );
        expect(
            screen.getByRole('button', { name: 'Delete contact' }).hasAttribute('disabled'),
        ).toBe(true);
    });
});

describe('ContactEditorScreen', () => {
    it('shows the title, notices and form in order, and omits the form frame when empty', () => {
        const { container, rerender } = render(
            <ContactEditorScreen title='Add contact' notices={<p>Notice</p>}>
                <input aria-label='Field' />
            </ContactEditorScreen>,
        );
        expect(screen.getByRole('heading', { name: 'Add contact' })).toBeInstanceOf(HTMLElement);
        expect(container.querySelector('.simulator-contact-editor-layout')).not.toBeNull();
        expect(
            screen.getByText('Notice').compareDocumentPosition(screen.getByLabelText('Field')) &
                Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy();
        rerender(<ContactEditorScreen title='Add contact' notices={<p>Notice</p>} />);
        expect(container.querySelector('.simulator-contact-editor-layout')).toBeNull();
    });
});
