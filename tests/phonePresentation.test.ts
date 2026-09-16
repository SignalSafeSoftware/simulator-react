import { contactMatchesSearch } from '../src/views/ContactsView.js';
import { createElement } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { expect, it, vi } from 'vitest';
import ContactsView from '../src/views/ContactsView.js';
import PhoneHistoryList from '../src/views/PhoneHistoryList.js';
import { PhoneNumberFormatContext } from '../src/contract/phonePresentation.js';

it('formats contact labels without changing the contact passed to navigation', async () => {
    const contact = { id: 'contact', displayName: 'Example', number: '+12025550123' };
    const open = vi.fn();
    let view: TestRenderer.ReactTestRenderer;
    await act(async () => {
        view = TestRenderer.create(createElement(PhoneNumberFormatContext.Provider, { value: value => `Display ${value}` }, createElement(ContactsView, { contacts: [contact], phoneLocalNavItems: [{id: 'contacts', label: 'Contacts'}], hostOwnsPhoneContactDetail: true, onPhoneContactOpen: open })));
    });
    expect(JSON.stringify(view!.toJSON())).toContain('Display +12025550123');
    const row = view!.root.findAll(node => typeof node.type === 'string' && typeof node.props.onClick === 'function' && String(node.props.className).includes('simulator-phone__contact-row'))[0];
    await act(async () => row?.props.onClick());
    expect(open).toHaveBeenCalledWith('contact', contact);
    await act(async () => view!.unmount());
});

it('shows the name, matching label and formatted number together', async () => {
    let view: TestRenderer.ReactTestRenderer;
    await act(async () => {
        view = TestRenderer.create(createElement(PhoneNumberFormatContext.Provider, { value: () => '(202) 555-0123' }, createElement(PhoneHistoryList, { entries: [{ id: 'call', name: 'Example', number: '+12025550123', numberLabel: 'Mobile', kind: 'incoming' }], hasVoicemail: false, onSelectIncoming: vi.fn(), onSelectVoicemail: vi.fn() })));
    });
    const output = JSON.stringify(view!.toJSON());
    expect(output).toContain('Example');
    expect(output).toContain('Mobile · (202) 555-0123');
    await act(async () => view!.unmount());
});

it('searches secondary values and postal addresses without changing identity', () => {
    const contact = { id: 'searchable', displayName: 'Synthetic', phoneNumbers: [{ label: 'Work', value: '+442083661177' }], emailAddresses: [{label:'Alternate',value:'secondary@example.test'}], postalAddresses:[{label:'Home',value:'10 Example Street\nLondon'}] };
    expect(contactMatchesSearch(contact, 'London')).toBe(true);
    expect(contactMatchesSearch(contact, 'secondary@example')).toBe(true);
    expect(contactMatchesSearch(contact, '83661177')).toBe(true);
    expect(contactMatchesSearch(contact, 'Elsewhere')).toBe(false);
});
