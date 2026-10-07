// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import MessagesThreadListView, {
    type MessagesThreadListViewProps,
} from '../src/views/messages/MessagesThreadListView';
import { SimulatorLocaleProvider } from '../src/i18n/SimulatorLocale';

const threads = Array.from({ length: 45 }, (_, index) => ({
    id: `thread-${index + 1}`,
    senderName: `Person ${index + 1}`,
    preview: `Preview ${index + 1}`,
}));
const onSelectThread = vi.fn();
const onLoadMore = vi.fn();
const continuation = { visibleCount: 20, hasMore: true, loading: false, onLoadMore };
afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
});

it('searches all loaded rows before paging and lets the host control its query', () => {
    const onChange = vi.fn();
    const view = render(
        <MessagesThreadListView
            threads={threads}
            onSelectThread={onSelectThread}
            search={{ value: '', onChange }}
            continuation={continuation}
        />,
    );
    expect(screen.getAllByRole('button', { name: /^Person/ })).toHaveLength(20);
    fireEvent.click(screen.getByRole('button', { name: 'Load more conversations' }));
    expect(onLoadMore).toHaveBeenLastCalledWith(true);
    const search = screen.getByRole('searchbox', { name: 'Search threads' });
    fireEvent.change(search, { target: { value: 'Person 45' } });
    expect(onChange).toHaveBeenCalledWith('Person 45');
    expect(screen.getAllByRole('button', { name: /^Person/ })).toHaveLength(20);
    view.rerender(
        <MessagesThreadListView
            threads={threads}
            onSelectThread={onSelectThread}
            search={{ value: 'Person 45', onChange }}
            continuation={continuation}
        />,
    );
    expect(screen.getAllByRole('button', { name: /^Person/ })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Person 45 Preview 45' }));
    expect(onSelectThread).toHaveBeenCalledWith('thread-45');
    fireEvent.click(screen.getByRole('button', { name: 'Load more conversations' }));
    expect(onLoadMore).toHaveBeenLastCalledWith(false);
    expect(screen.getByRole('searchbox', { name: 'Search threads' })).toBe(search);
});

it('keeps rows mounted during continuation and localizes loading and retry controls', () => {
    const draw = (
        overrides: Partial<NonNullable<MessagesThreadListViewProps['continuation']>> = {},
    ) => (
        <SimulatorLocaleProvider
            messages={{
                'screen.messagesThreadListView.load.more': 'Afficher plus',
                'list.loadingMore': 'Chargement…',
                'app.retry': 'Réessayer',
            }}
        >
            <MessagesThreadListView
                threads={threads.slice(0, 2)}
                onSelectThread={onSelectThread}
                continuation={{ ...continuation, ...overrides }}
            />
        </SimulatorLocaleProvider>
    );
    const view = render(draw());
    const first = screen.getByRole('button', { name: 'Person 1 Preview 1' });
    fireEvent.click(screen.getByRole('button', { name: 'Afficher plus' }));
    expect(onLoadMore).toHaveBeenLastCalledWith(false);
    view.rerender(draw({ loading: true }));
    expect(screen.getByRole('button', { name: 'Person 1 Preview 1' })).toBe(first);
    expect(screen.getByRole('button', { name: 'Chargement…' }).hasAttribute('disabled')).toBe(true);
    view.rerender(draw({ hasMore: false, error: 'Server unavailable' }));
    expect(screen.getByRole('alert').textContent).toBe('Server unavailable');
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(onLoadMore).toHaveBeenLastCalledWith(false);
    view.rerender(draw({ hasMore: false }));
    expect(screen.queryByRole('button', { name: 'Afficher plus' })).toBeNull();
});

it('keeps continuation reachable for no local search matches and disables automatic loading', () => {
    const observer = vi.fn();
    vi.stubGlobal('IntersectionObserver', observer);
    render(
        <MessagesThreadListView
            threads={threads}
            onSelectThread={onSelectThread}
            search={{ value: 'Not loaded yet', onChange: vi.fn() }}
            continuation={continuation}
        />,
    );
    expect(screen.getByText('No results for "Not loaded yet".')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Load more conversations' }));
    expect(onLoadMore).toHaveBeenCalledWith(false);
    expect(observer).not.toHaveBeenCalled();
});

it('reveals buffered matches before showing a remote archive error', () => {
    render(
        <MessagesThreadListView
            threads={threads}
            onSelectThread={onSelectThread}
            continuation={{ ...continuation, error: 'Server unavailable', loading: true }}
        />,
    );
    expect(screen.queryByRole('alert')).toBeNull();
    const more = screen.getByRole('button', { name: 'Load more conversations' });
    expect(more.hasAttribute('disabled')).toBe(false);
    fireEvent.click(more);
    expect(onLoadMore).toHaveBeenCalledWith(true);
});

it('retains shared avatar chrome around host photo retrieval without exposing a duplicate image', () => {
    const view = render(
        <MessagesThreadListView
            threads={[
                {
                    id: 'photo',
                    senderName: 'Taylor',
                    preview: 'Photo',
                    avatarUrl: '/private-host-photo',
                    unread: true,
                },
            ]}
            onSelectThread={onSelectThread}
            renderAvatar={(row) => <span data-testid='cached-photo'>{row.id}</span>}
        />,
    );
    const row = screen.getByRole('button', { name: 'Taylor Photo' });
    expect(view.container.querySelectorAll('.simulator-avatar')).toHaveLength(1);
    expect(
        screen
            .getByTestId('cached-photo')
            .closest('.simulator-avatar')
            ?.getAttribute('aria-hidden'),
    ).toBe('true');
    expect(row.querySelector('img')).toBeNull();
    expect(
        row
            .querySelector('.simulator-messages__thread-title')
            ?.classList.contains('simulator-text--bold'),
    ).toBe(true);
    expect(screen.queryByRole('button', { name: 'New thread' })).toBeNull();
});

it('retains an actionable retry when the initial archive is empty', () => {
    const view = render(
        <MessagesThreadListView
            threads={[]}
            onSelectThread={onSelectThread}
            continuation={{ ...continuation, loading: true }}
        />,
    );
    expect(screen.getByRole('status').textContent).toBe('Loading items…');
    view.rerender(
        <MessagesThreadListView
            threads={[]}
            onSelectThread={onSelectThread}
            continuation={{ ...continuation, hasMore: false, error: 'Please retry' }}
        />,
    );
    expect(screen.getByRole('alert').textContent).toBe('Please retry');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onLoadMore).toHaveBeenCalledWith(false);
});
