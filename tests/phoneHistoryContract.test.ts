import { createElement } from 'react';
import type { ReactTestRenderer, ReactTestInstance } from 'react-test-renderer';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestRenderer, act } from './reactTestRenderer';
import PhoneDialView from '../src/views/PhoneDialView';
import { PhoneHistoryList, type PhoneHistoryListProps } from '../src/index';

const entries = [
    { id: 'alex', name: 'Alex', number: '555001', kind: 'outgoing' as const },
    { id: 'sam', name: 'Sam', number: '555002', kind: 'incoming' as const },
];
let renderer: ReactTestRenderer | undefined;
afterEach(() => { renderer?.unmount(); renderer = undefined; });

async function render(extra: Partial<PhoneHistoryListProps> = {}) {
    const props: PhoneHistoryListProps = {
        entries, onSelectIncoming: vi.fn(), onSelectVoicemail: vi.fn(), ...extra,
    };
    await act(async () => { renderer = TestRenderer.create(createElement(PhoneHistoryList, props)); });
    return renderer!.root;
}

function rows(root: ReactTestInstance) {
    return root.findAll((node) => typeof node.type === 'string' &&
        String(node.props.className).split(' ').includes('simulator-phone-history-row'));
}

describe('native history consumer contract', () => {
    it('exposes a dialer digit token with the unchanged default', async () => {
        await act(async () => { renderer = TestRenderer.create(createElement(PhoneDialView, { onDial: vi.fn() })); });
        const digits = renderer!.root.findAll((node) => node.type === 'span' &&
            node.props.style?.fontSize === 'var(--simulator-phone-dialer-digit-font-size, 1.1rem)');
        expect(digits).toHaveLength(12);
    });

    it('retains uncontrolled search and passive native rows by default', async () => {
        const root = await render();
        expect(rows(root).map((row) => row.type)).toEqual(['div', 'div']);
        expect(root.findAllByProps({ className: 'simulator-phone-history-entry' })).toHaveLength(0);
        await act(async () => {
            root.findByType('input').props.onChange({ target: { value: 'sam' } });
        });
        expect(rows(root)).toHaveLength(1);
        expect(rows(root)[0].findByProps({ children: 'Sam' })).toBeDefined();
    });

    it('reports controlled search without overwriting the host value', async () => {
        const onSearchQueryChange = vi.fn();
        const root = await render({ searchQuery: 'alex', onSearchQueryChange, searchAriaLabel: 'Search saved calls' });
        const input = root.findByType('input');
        expect(input.props['aria-label']).toBe('Search saved calls');
        await act(async () => { input.props.onChange({ target: { value: 'sam' } }); });
        expect(onSearchQueryChange).toHaveBeenCalledWith('sam');
        expect(input.props.value).toBe('alex');
        expect(rows(root)).toHaveLength(1);
    });

    it('selects native rows and keeps host actions outside their buttons', async () => {
        const onSelectEntry = vi.fn();
        const action = vi.fn();
        const root = await render({
            onSelectEntry, selectedEntryId: 'sam',
            renderEntryActions: (entry) => createElement('button', { onClick: action }, `Delete ${entry.name}`),
        });
        const groups = root.findAllByProps({ className: 'simulator-phone-history-entry' });
        expect(groups).toHaveLength(2);
        expect(groups.every((group) => group.findAllByType('button').length === 2)).toBe(true);
        const nativeRows = rows(root);
        expect(nativeRows[0].props['aria-current']).toBeUndefined();
        expect(nativeRows[1].props['aria-current']).toBe(true);
        expect(nativeRows.every((row) => row.findAllByType('button').every((button) => button === row))).toBe(true);
        await act(async () => { nativeRows[1].props.onClick(); });
        expect(onSelectEntry).toHaveBeenCalledWith('sam');
        expect(action).not.toHaveBeenCalled();
        await act(async () => { root.findByProps({ children: 'Delete Sam' }).props.onClick(); });
        expect(action).toHaveBeenCalledOnce();
        expect(onSelectEntry).toHaveBeenCalledOnce();
    });

    it('preserves incoming and voicemail actions and truthful empty searches', async () => {
        const onSelectIncoming = vi.fn();
        const onSelectVoicemail = vi.fn();
        const root = await render({
            entries: [], incomingCallContent: { caller_name: 'Alex', transcript: '', choices: [] }, hasVoicemail: true,
            onSelectIncoming, onSelectVoicemail,
        });
        await act(async () => {
            root.findByProps({ 'aria-label': 'Incoming call' }).props.onClick();
            root.findByProps({ 'aria-label': 'Voicemail' }).props.onClick();
        });
        expect(onSelectIncoming).toHaveBeenCalledOnce();
        expect(onSelectVoicemail).toHaveBeenCalledOnce();
        await act(async () => { root.findByType('input').props.onChange({ target: { value: 'absent' } }); });
        expect(root.findByProps({ children: 'No results for "absent".' })).toBeDefined();
    });
});
