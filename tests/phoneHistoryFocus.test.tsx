// @vitest-environment jsdom
import { fireEvent, render, renderHook, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PhoneHistoryScreen from '../src/views/phone/PhoneHistoryScreen.js';
import { usePhoneHistoryFocus } from '../src/views/phone/usePhoneHistoryFocus.js';
import type { SimulatorCallHistoryEntry } from '../src/types/session.js';

const entries: SimulatorCallHistoryEntry[] = [
    { id: 'call["one"]', number: '+12025550123', name: 'Taylor', kind: 'incoming' },
    { id: 'two', number: '+12025550456', name: 'Morgan', kind: 'outgoing' },
];
const props = {
    payload: { content: null, chosenIndex: null, callHistory: entries },
    contacts: [],
    hasVoicemail: false,
    onSelectEntry: vi.fn(),
    onSelectIncoming: vi.fn(),
    onSelectVoicemail: vi.fn(),
};

function history(selectedEntryId: string | null) {
    return <PhoneHistoryScreen {...props} selectedEntryId={selectedEntryId} />;
}

describe('call history focus behavior', () => {
    it('focuses each opened detail, preserves ongoing interaction, and restores only its own row', () => {
        const outside = render(
            <button data-simulator-history-id='call["one"]'>Another history</button>,
        );
        const otherButton = within(outside.container).getByRole('button');
        otherButton.focus();
        const view = render(history(null));
        expect(document.activeElement).toBe(otherButton);

        view.rerender(history('two'));
        expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Call Details' }));
        const search = screen.getByRole('searchbox', { name: 'Search calls' });
        search.focus();
        view.rerender(history('two'));
        expect(document.activeElement).toBe(search);

        view.rerender(history('call["one"]'));
        expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Call Details' }));
        expect(view.container.querySelector('button[data-simulator-history-id]')).toBeNull();
        view.rerender(history(null));
        expect(document.activeElement).toBe(
            within(view.container).getByRole('button', { name: /Taylor/ }),
        );
        otherButton.focus();
        view.rerender(history(null));
        expect(document.activeElement).toBe(otherButton);
    });

    it('falls back to the retained list search when the selected row no longer matches it', () => {
        const view = render(history(null));
        fireEvent.change(screen.getByRole('searchbox', { name: 'Search calls' }), {
            target: { value: 'Morgan' },
        });
        view.rerender(history('call["one"]'));
        view.rerender(history(null));
        const search = screen.getByRole<HTMLInputElement>('searchbox', { name: 'Search calls' });
        expect(search.value).toBe('Morgan');
        expect(screen.queryByRole('button', { name: /Taylor/ })).toBeNull();
        expect(document.activeElement).toBe(search);
    });

    it('does not carry pending focus restoration across an unmounted history screen', () => {
        const detail = render(history('two'));
        detail.unmount();
        const outside = render(<button>Host action</button>);
        const hostAction = within(outside.container).getByRole('button');
        hostAction.focus();
        render(history(null));
        expect(document.activeElement).toBe(hostAction);
    });

    it('tolerates a detail close before the history root is attached', () => {
        const hook = renderHook(({ id }) => usePhoneHistoryFocus(id), {
            initialProps: { id: 'two' as string | null },
        });
        expect(() => hook.rerender({ id: null })).not.toThrow();
        expect(hook.result.current.rootRef.current).toBeNull();
    });
});
