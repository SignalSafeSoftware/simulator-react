// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { createRef, type ContextType } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { SimulatorTimelineContext } from '../src/contract/hostListSlots';
import { MessageSender, SmsMode, type SimulatorSmsPayload } from '../src/types/session';
import SmsSimulatorView from '../src/views/messages/SmsSimulatorView';

type TimelineOptions = ContextType<typeof SimulatorTimelineContext>;

function messages(count = 20, first = 0, timestamp = '09:00'): SimulatorSmsPayload {
    return {
        mode: SmsMode.History,
        visibleMessageCount: count,
        thread: {
            sender_display_name: 'Taylor Example',
            sender_number: '+12025550123',
            messages: Array.from({ length: count }, (_, index) => ({
                id: `message-${first + index}`,
                from: MessageSender.Them,
                text: `Message ${first + index}`,
                timestamp,
            })),
        },
    };
}

function Thread({
    payload = messages(),
    timeline,
}: Readonly<{ payload?: SimulatorSmsPayload | null; timeline?: TimelineOptions }>) {
    const view = (
        <SmsSimulatorView
            payload={payload}
            visibleCount={payload?.visibleMessageCount ?? 0}
            onAction={() => {}}
            onRevealNext={() => {}}
        />
    );
    return timeline ? (
        <SimulatorTimelineContext.Provider value={timeline}>
            {view}
        </SimulatorTimelineContext.Provider>
    ) : (
        view
    );
}

/** jsdom does not lay out elements; model browser dimensions and clamp scrollTop as the DOM does. */
function scrollingGeometry() {
    const geometry = { height: 1000, viewport: 400 };
    const positions = new WeakMap<HTMLElement, number>();
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(
        () => geometry.height,
    );
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(
        () => geometry.viewport,
    );
    vi.spyOn(HTMLElement.prototype, 'scrollTop', 'get').mockImplementation(function (
        this: HTMLElement,
    ) {
        return positions.get(this) ?? 0;
    });
    vi.spyOn(HTMLElement.prototype, 'scrollTop', 'set').mockImplementation(function (
        this: HTMLElement,
        value: number,
    ) {
        positions.set(this, Math.max(0, Math.min(value, geometry.height - geometry.viewport)));
    });
    const observers: Observer[] = [];
    class Observer implements ResizeObserver {
        readonly observed = new Set<Element>();
        readonly disconnect = vi.fn(() => this.observed.clear());
        readonly observe = vi.fn((target: Element) => this.observed.add(target));
        readonly unobserve = vi.fn((target: Element) => this.observed.delete(target));
        constructor(private readonly callback: ResizeObserverCallback) {
            observers.push(this);
        }
        resize() {
            this.callback([], this);
        }
    }
    vi.stubGlobal('ResizeObserver', Observer);
    const frames = new Map<number, FrameRequestCallback>();
    let frameId = 0;
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
        frames.set(++frameId, callback);
        return frameId;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
    const flush = () => {
        act(() => {
            const scheduled = [...frames.values()];
            frames.clear();
            scheduled.forEach((callback) => callback(0));
        });
    };
    return {
        geometry,
        observers,
        frames,
        flush,
        resize: () => {
            act(() => observers.forEach((observer) => observer.resize()));
            flush();
        },
    };
}

function scrollBody(container: HTMLElement): HTMLDivElement {
    const body = container.querySelector('.simulator-overflow-auto');
    if (!(body instanceof HTMLDivElement)) throw new Error('SMS scroll body was not rendered.');
    return body;
}

function scrollTo(body: HTMLDivElement, top: number) {
    body.scrollTop = top;
    fireEvent.scroll(body);
}

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

it('opens at the newest message and follows appends without a host timeline provider', () => {
    const layout = scrollingGeometry();
    const view = render(<Thread />);
    const body = scrollBody(view.container);
    layout.flush();
    expect(body.scrollTop).toBe(600);
    layout.geometry.height = 1200;
    view.rerender(<Thread payload={messages(21)} />);
    layout.flush();
    expect(body.scrollTop).toBe(800);
    layout.geometry.height = 1400;
    layout.resize();
    expect(body.scrollTop).toBe(1000);
});

it('follows a replaced newest message when the message count is unchanged', () => {
    const layout = scrollingGeometry();
    const view = render(<Thread />);
    const body = scrollBody(view.container);
    layout.flush();
    layout.geometry.height = 1200;
    view.rerender(<Thread payload={messages(20, 1)} />);
    layout.flush();
    expect(body.scrollTop).toBe(800);
});

it('keeps the reader position on append, resize and regional timestamp rerenders', () => {
    const layout = scrollingGeometry();
    const view = render(<Thread />);
    const body = scrollBody(view.container);
    layout.flush();
    scrollTo(body, 250);
    layout.geometry.height = 1100;
    view.rerender(<Thread payload={messages(21)} />);
    layout.flush();
    expect(body.scrollTop).toBe(250);
    layout.geometry.height = 1200;
    layout.resize();
    expect(body.scrollTop).toBe(250);
    view.rerender(<Thread payload={messages(21, 0, '5/10/2026, 15:00:00')} />);
    layout.flush();
    expect(body.scrollTop).toBe(250);
});

it('follows within 48 pixels of the bottom while preserving positions farther away', () => {
    const layout = scrollingGeometry();
    const view = render(<Thread />);
    const body = scrollBody(view.container);
    layout.flush();
    scrollTo(body, 552);
    layout.geometry.height = 1100;
    view.rerender(<Thread payload={messages(21)} />);
    layout.flush();
    expect(body.scrollTop).toBe(700);
    scrollTo(body, 651);
    layout.geometry.height = 1200;
    view.rerender(<Thread payload={messages(22)} />);
    layout.flush();
    expect(body.scrollTop).toBe(651);
});

it('starts at the bottom after an explicit thread switch, even with the same sender and count', () => {
    const layout = scrollingGeometry();
    const view = render(<Thread timeline={{ threadId: 'one' }} />);
    const body = scrollBody(view.container);
    layout.flush();
    scrollTo(body, 200);
    layout.geometry.height = 1400;
    view.rerender(<Thread timeline={{ threadId: 'two' }} />);
    layout.flush();
    expect(body.scrollTop).toBe(1000);
});

it('deduplicates top paging and preserves the visible anchor when earlier messages arrive', () => {
    const layout = scrollingGeometry();
    const load = vi.fn();
    const timeline = {
        threadId: 'one',
        paging: { hasMore: true, loading: false, onLoadEarlier: load },
    };
    const view = render(<Thread timeline={timeline} />);
    const body = scrollBody(view.container);
    layout.flush();
    scrollTo(body, 81);
    expect(load).not.toHaveBeenCalled();
    scrollTo(body, 80);
    fireEvent.scroll(body);
    fireEvent.click(view.getByRole('button', { name: 'Load earlier messages' }));
    expect(load).toHaveBeenCalledTimes(1);
    view.rerender(
        <Thread timeline={{ ...timeline, paging: { ...timeline.paging, loading: true } }} />,
    );
    fireEvent.scroll(body);
    expect(load).toHaveBeenCalledTimes(1);
    layout.geometry.height = 1800;
    view.rerender(<Thread timeline={timeline} payload={messages(40, -20)} />);
    layout.flush();
    expect(body.scrollTop).toBe(880);
    scrollTo(body, 40);
    expect(load).toHaveBeenCalledTimes(2);
});

it('offers explicit earlier loading and stops automatic requests after all history is loaded', () => {
    const layout = scrollingGeometry();
    const load = vi.fn();
    const timeline = {
        threadId: 'one',
        paging: { hasMore: true, loading: false, onLoadEarlier: load },
    };
    const view = render(<Thread timeline={timeline} />);
    const body = scrollBody(view.container);
    layout.flush();
    fireEvent.click(view.getByRole('button', { name: 'Load earlier messages' }));
    expect(load).toHaveBeenCalledTimes(1);
    view.rerender(
        <Thread timeline={{ ...timeline, paging: { ...timeline.paging, hasMore: false } }} />,
    );
    layout.flush();
    scrollTo(body, 0);
    expect(load).toHaveBeenCalledTimes(1);
    expect(view.queryByRole('button', { name: 'Load earlier messages' })).toBeNull();
});

it('allows repeated explicit retries after an empty detail request fails, without auto retry loops', () => {
    const layout = scrollingGeometry();
    const load = vi.fn();
    const payload = messages(0);
    const timeline = {
        threadId: 'empty',
        paging: { hasMore: false, loading: false, error: 'Offline', onLoadEarlier: load },
    };
    const view = render(<Thread timeline={timeline} payload={payload} />);
    const body = scrollBody(view.container);
    layout.flush();
    scrollTo(body, 0);
    expect(load).not.toHaveBeenCalled();
    expect(view.getByText('Offline')).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: 'Retry earlier messages' }));
    expect(load).toHaveBeenCalledTimes(1);
    view.rerender(
        <Thread
            timeline={{ ...timeline, paging: { ...timeline.paging, loading: true } }}
            payload={payload}
        />,
    );
    view.rerender(<Thread timeline={timeline} payload={payload} />);
    fireEvent.click(view.getByRole('button', { name: 'Retry earlier messages' }));
    expect(load).toHaveBeenCalledTimes(2);
});

it('composes host refs and header while cleaning up observers, listeners and queued work', () => {
    const layout = scrollingGeometry();
    const load = vi.fn();
    const scrollRef = vi.fn<(node: HTMLDivElement | null) => void>();
    const contentRef = createRef<HTMLUListElement>();
    const timeline = {
        threadId: 'one',
        header: <p>Host history notice</p>,
        scrollRef,
        contentRef,
        paging: { hasMore: true, loading: false, onLoadEarlier: load },
    };
    const view = render(<Thread timeline={timeline} />);
    const body = scrollBody(view.container);
    const content = view.getByRole('list', { name: 'Message timeline' });
    layout.flush();
    expect(scrollRef).toHaveBeenCalledWith(body);
    expect(contentRef.current).toBe(content);
    expect(view.getByText('Host history notice')).toBeTruthy();
    expect(layout.observers.some((observer) => observer.observed.has(content))).toBe(true);
    const removed = vi.spyOn(body, 'removeEventListener');
    layout.geometry.height = 1100;
    layout.resize();
    view.unmount();
    expect(scrollRef).toHaveBeenLastCalledWith(null);
    expect(contentRef.current).toBeNull();
    expect(removed.mock.calls.some(([type]) => type === 'scroll')).toBe(true);
    expect(layout.observers.every((observer) => observer.disconnect.mock.calls.length > 0)).toBe(
        true,
    );
    expect(layout.frames.size).toBe(0);
    scrollTo(body, 0);
    expect(load).not.toHaveBeenCalled();
});

it('does not count new replies as prepended height while an earlier page is loading', () => {
    const layout = scrollingGeometry();
    const load = vi.fn();
    const timeline = {
        threadId: 'one',
        paging: { hasMore: true, loading: false, onLoadEarlier: load },
    };
    const loadingTimeline = { ...timeline, paging: { ...timeline.paging, loading: true } };
    const view = render(<Thread timeline={timeline} />);
    const body = scrollBody(view.container);
    layout.flush();
    scrollTo(body, 40);
    expect(load).toHaveBeenCalledTimes(1);
    view.rerender(<Thread timeline={loadingTimeline} />);
    layout.geometry.height = 1100;
    view.rerender(<Thread timeline={loadingTimeline} payload={messages(21)} />);
    layout.flush();
    expect(body.scrollTop).toBe(40);
    layout.geometry.height = 1900;
    view.rerender(<Thread timeline={timeline} payload={messages(41, -20)} />);
    layout.flush();
    expect(body.scrollTop).toBe(840);
});

it('cleans up an unavailable payload and opens restored content at the bottom', () => {
    const layout = scrollingGeometry();
    const view = render(<Thread payload={null} />);
    expect(view.queryByRole('list', { name: 'Message timeline' })).toBeNull();
    view.rerender(<Thread />);
    layout.flush();
    const previousBody = scrollBody(view.container);
    expect(previousBody.scrollTop).toBe(600);
    scrollTo(previousBody, 200);
    view.rerender(<Thread payload={null} />);
    expect(layout.observers.every((observer) => observer.disconnect.mock.calls.length > 0)).toBe(
        true,
    );
    layout.geometry.height = 1200;
    view.rerender(<Thread />);
    layout.flush();
    const restoredBody = scrollBody(view.container);
    expect(restoredBody).not.toBe(previousBody);
    expect(restoredBody.scrollTop).toBe(800);
});
