import React from 'react';
import { act, create } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';
import { validateDeviceJson } from '../src/datasource/validateDeviceJson';
import { createTranslator } from '../src/i18n/catalog';
import { ContactValuesEditor } from '../src/components/ContactValuesEditor';
import { ContactPhotoControls } from '../src/components/ContactPhotoControls';
import PhoneContactEditor from '../src/views/PhoneContactEditor';
import SimulatorScreenTile from '../src/views/SimulatorScreenTile';
import PhoneHistoryDetail, { PhoneHistoryPagination } from '../src/views/PhoneHistoryDetail';
import { SimulatorDialog } from '../src/ui/primitives';
import { SimulatorListGroup } from '../src/components/SimulatorListGroup';
import { SimulatorSearchInput } from '../src/components/SimulatorSearchInput';
import { applyBack } from '../src/state/simulatorNavigationHandlers';
import { initialViewState } from '../src/state/simulatorSessionReducer';
import { contactMatchesSearch, contextMatchesContact } from '../src/views/ContactsView';

const entry_point = { app: 'phone', screen: 'history' };

describe('device JSON validation boundaries', () => {
    it.each([
        null, [], {}, { entry_point: null }, { entry_point: { app: 'phone' } },
        { entry_point: { app: 1, screen: 'history' } }, { entry_point: { app: 'invalid', screen: 'history' } },
        { entry_point, contacts: [{ id: 'one', display_name: 1 }] },
        { entry_point, messages: { threads: [{ id: 'one', unread: 'yes' }] } },
        { entry_point, messages: { thread_detail: { messages: [{ from: 'them', text: 'Hi', delay_seconds: '1' }] } } },
        { entry_point, messages: { thread_detail: { messages: [{ from: 'them', text: 'Hi', delay_seconds: Infinity }] } } },
        { entry_point, schema_version: 2 },
    ])('rejects malformed values with a path-specific diagnostic: %j', (value) => {
        expect(() => validateDeviceJson(value)).toThrow(/Invalid simulator JSON at \$/);
    });
    it('accepts finite delays, boolean flags, optional fields and explicit nulls', () => {
        expect(() => validateDeviceJson({
            entry_point, schema_version: 1,
            directory: [{ id: 'one', label: 'Directory', contact_id: null, number: null, url: null, description: null }],
            phone: { incoming_call: null }, email: { detail: null },
            messages: { threads: [{ id: 'one', unread: false }], thread_detail: { messages: [{ from: 'me', text: 'Hi', delay_seconds: 0 }] } },
        })).not.toThrow();
    });
});

it('falls back to the other plural and retains unresolved interpolation placeholders', () => {
    const t = createTranslator({ count: { other: '{count} things for {name}' } });
    expect(t.t('count', { count: 1 })).toBe('1 things for {name}');
    expect(t.t('count')).toBe('{count} things for {name}');
    expect(t.t('count', { count: 'unknown', name: 'Ada' })).toBe('unknown things for Ada');
});

it.each(['phone', 'email', 'address'] as const)('edits %s values, focus, labels, preferences and additions', (kind) => {
    const onChange = vi.fn();
    const values = [{ id: 'one', label: 'Home', value: '123' }, { id: 'two', label: 'Work', value: '456' }];
    const view = create(React.createElement(ContactValuesEditor, { kind, values, preferredId: 'one', createId: () => 'new', onChange }));
    const field = view.root.findAllByType('textarea')[0];
    act(() => field.props.onFocus());
    expect(field.props.value).toBe('123');
    act(() => field.props.onChange({ target: { value: 'changed' } }));
    expect(onChange.mock.lastCall?.[0][0].value).toBe('changed');
    expect(onChange.mock.lastCall?.[0][1]).toEqual(values[1]);
    act(() => field.props.onBlur());
    act(() => view.root.findAllByType('input').find(input => input.props.list)?.props.onChange({ target: { value: 'Other' } }));
    expect(onChange.mock.lastCall?.[0][0].label).toBe('Other');
    const checkbox = view.root.findAllByType('input').find(input => input.props.type === 'checkbox');
    act(() => checkbox?.props.onChange({ target: { checked: false } }));
    expect(onChange.mock.lastCall?.[1]).toBeNull();
    act(() => checkbox?.props.onChange({ target: { checked: true } }));
    expect(onChange.mock.lastCall?.[1]).toBe('one');
    act(() => view.root.findAllByType('button')[0].props.onClick());
    expect(onChange.mock.lastCall?.[0]).toHaveLength(3);
    act(() => view.root.findAllByType('button')[2].props.onClick());
    expect(onChange.mock.lastCall).toEqual([[values[0]], 'one']);
    view.unmount();
});

it('opens the photo chooser and reports selection, status and validation errors', () => {
    const click = vi.fn(); const onSelect = vi.fn();
    const view = create(React.createElement(ContactPhotoControls, { onSelect, onRemove: vi.fn(), onRestore: vi.fn(), capability: { state: 'enabled' }, error: 'Wrong format', status: 'Uploaded' }), { createNodeMock: () => ({ click }) });
    act(() => view.root.findAllByType('button')[0].props.onClick());
    expect(click).toHaveBeenCalledOnce();
    const input = view.root.findByType('input');
    const file = new File(['image'], 'photo.png');
    act(() => input.props.onChange({ target: { files: [file], value: 'photo.png' } }));
    expect(onSelect).toHaveBeenCalledWith(file);
    act(() => input.props.onChange({ target: { files: [], value: '' } }));
    expect(onSelect).toHaveBeenCalledOnce();
    expect(view.root.findByType('output').children).toEqual(['Uploaded']);
    expect(view.root.findByProps({ role: 'alert' }).children).toEqual(['Wrong format']);
    view.unmount();
});

it('delegates contact number editing and disables saving controls', () => {
    const onNumberChange = vi.fn();
    const view = create(React.createElement(PhoneContactEditor, { number: '', onNumberChange, onSubmit: vi.fn(), onCancel: vi.fn(), saving: true }));
    act(() => view.root.findByProps({ name: 'number' }).props.onChange({ target: { value: '123' } }));
    expect(onNumberChange).toHaveBeenCalledWith('123');
    expect(view.root.findByProps({ type: 'submit' }).props.disabled).toBe(true);
    view.unmount();
});

it('renders actionable tiles, optional history content and pagination states', () => {
    const onClick = vi.fn();
    const tile = create(React.createElement(SimulatorScreenTile, { label: 'Open', onClick }));
    act(() => tile.root.findByType('button').props.onClick());
    expect(onClick).toHaveBeenCalledOnce(); tile.unmount();
    const detail = create(React.createElement(PhoneHistoryDetail, { caller: 'Ada', timestamp: 'Now', description: 'Missed', number: '123', actions: 'Call', children: 'Summary' }));
    expect(detail.root.findByProps({ className: 'simulator-history-actions' }).children).toEqual(['Call']); detail.unmount();
    for (const props of [{ hasMore: false }, { hasMore: true }, { hasMore: true, loading: true }, { hasMore: true, disabled: true }]) {
        const view = create(React.createElement(PhoneHistoryPagination, { loading: false, ...props, onLoadMore: vi.fn() }));
        expect(view.root.findAllByType('button')).toHaveLength(props.hasMore ? 1 : 0); view.unmount();
    }
});

it('renders a dialog and supplies default empty text without intercepting non-Enter keys', () => {
    const dialog = create(React.createElement(SimulatorDialog, { open: true, children: 'Content' }));
    const preventCancel = vi.fn();
    act(() => dialog.root.findByType('dialog').props.onCancel({ preventDefault: preventCancel }));
    expect(preventCancel).toHaveBeenCalledOnce(); dialog.unmount();
    const list = create(React.createElement(SimulatorListGroup, { search: null, empty: true }));
    expect(list.root.findByType('p').children.length).toBeGreaterThan(0); list.unmount();
    const submit = vi.fn(); const preventDefault = vi.fn();
    const search = create(React.createElement(SimulatorSearchInput, { value: '', onChange: vi.fn(), onSubmit: submit }));
    act(() => search.root.findByType('input').props.onKeyDown({ key: 'Escape', preventDefault }));
    expect(submit).not.toHaveBeenCalled(); expect(preventDefault).not.toHaveBeenCalled(); search.unmount();
});

it.each(['add_contact', 'directory', 'incoming_call', 'voicemail', 'history'] as const)('returns from phone %s to the correct parent', screen => {
    const next = applyBack({ ...initialViewState, activeApp: 'phone', phone: { ...initialViewState.phone, screen } });
    if (screen === 'history') expect(next.activeApp).toBe('home');
    else expect(next.phone.screen).toBe(screen === 'add_contact' || screen === 'directory' ? 'contacts' : 'history');
});
it('leaves an empty default internet stack alone and exits the messages root', () => {
    const state = { ...initialViewState, activeApp: 'internet' as const };
    expect(applyBack(state).internet).toEqual(state.internet);
    expect(applyBack({ ...initialViewState, activeApp: 'messages' }).activeApp).toBe('home');
});
it('matches secondary phone and email endpoints without a primary number', () => {
    const contact = { id: 'one', displayName: 'Ada', phoneNumbers: [{ id: 'p', label: 'Desk', value: '123456' }], emailAddresses: [{ id: 'e', label: 'Work', value: 'ada@example.test' }] };
    expect(contactMatchesSearch(contact, '3456')).toBe(true);
    expect(contactMatchesSearch(contact, 'ada@example')).toBe(true);
    expect(contextMatchesContact(contact, { number: '123456' })).toBe(true);
    expect(contextMatchesContact(contact, { number: '999' })).toBe(false);
});

it('matches formatted secondary phone numbers after digit normalization', () => {
    const contact = { id: 'one', displayName: 'Ada', phoneNumbers: [{ id: 'p', label: 'Desk', number: '12025550123', value: '12025550123' }], emailAddresses: [] };
    expect(contactMatchesSearch(contact, '+1 (202) 555-0123')).toBe(true);
    expect(contactMatchesSearch({ ...contact, phoneNumbers: [{ label: 'Desk', value: '12025550123' }] }, '+1 (202) 555-0123')).toBe(true);
    expect(contactMatchesSearch({ id: 'one', displayName: 'Ada' }, 'Unmatched')).toBe(false);
});
