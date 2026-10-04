// @vitest-environment jsdom
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SimulatorAlertTone } from '../src/ui/styles/simulatorClasses';
import DeviceHome from '../src/apps/home/DeviceHome';
import { SimulatorAppsProvider, useSimulatorAppsHost } from '../src/apps/shared/SimulatorAppsHost';
import { useComposerSubmit } from '../src/hooks/useComposerSubmit';
import { ContactIdentityCard } from '../src/ui/contacts/ContactIdentityCard';
import { LoadMore } from '../src/ui/lists/LoadMore';
import { SimulatorAppNavItem } from '../src/ui/navigation/SimulatorAppNavItem';
import { renderSimulatorFeedback } from '../src/ui/renderSlots';

type ObserverCallback = (entries: Array<{ isIntersecting: boolean }>) => void;
class FakeObserver {
    static instances: FakeObserver[] = [];
    disconnect = vi.fn();
    observe = vi.fn();
    constructor(public callback: ObserverCallback) {
        FakeObserver.instances.push(this);
    }
}

afterEach(() => {
    vi.unstubAllGlobals();
    FakeObserver.instances = [];
});

describe('LoadMore', () => {
    const props = {
        hasMore: true,
        loading: false,
        error: '',
        label: 'More',
        count: 20,
        onLoadMore: vi.fn(),
    };

    it('renders nothing when finished and offers retry after errors', () => {
        const { container, rerender } = render(<LoadMore {...props} hasMore={false} />);
        expect(container.firstChild).toBeNull();
        rerender(<LoadMore {...props} hasMore={false} error="failed" />);
        expect(screen.getByRole('button').textContent).toBe('Retry');
        rerender(<LoadMore {...props} loading />);
        expect(screen.getByRole('button').textContent).toBe('Loading…');
        rerender(<LoadMore {...props} />);
        fireEvent.click(screen.getByRole('button'));
        expect(props.onLoadMore).toHaveBeenCalledTimes(1);
    });

    it('does not observe without IntersectionObserver or when automatic is off', () => {
        render(<LoadMore {...props} />);
        vi.stubGlobal('IntersectionObserver', FakeObserver);
        render(<LoadMore {...props} automatic={false} />);
        expect(FakeObserver.instances).toHaveLength(0);
    });

    it('requests the next page once per intersection and respects blocking', () => {
        vi.stubGlobal('IntersectionObserver', FakeObserver);
        const onLoadMore = vi.fn();
        const { rerender, unmount } = render(<LoadMore {...props} onLoadMore={onLoadMore} />);
        const observer = FakeObserver.instances[0];
        act(() => observer.callback([{ isIntersecting: true }]));
        act(() => observer.callback([{ isIntersecting: true }]));
        expect(onLoadMore).toHaveBeenCalledTimes(1);
        act(() => observer.callback([{ isIntersecting: false }]));
        rerender(<LoadMore {...props} onLoadMore={onLoadMore} loading />);
        act(() => observer.callback([{ isIntersecting: true }]));
        expect(onLoadMore).toHaveBeenCalledTimes(1);
        unmount();
        expect(observer.disconnect).toHaveBeenCalled();
    });
});

describe('DeviceHome', () => {
    it('opens apps and shows the lock action only when supplied', () => {
        const handlers = {
            onOpenSettings: vi.fn(),
            onOpenVault: vi.fn(),
            onOpenPhotos: vi.fn(),
        };
        const { rerender } = render(<DeviceHome {...handlers} homeHeader={<p>Header</p>} />);
        for (const name of ['Settings', 'Vault', 'Photos']) {
            fireEvent.click(screen.getByRole('button', { name }));
        }
        expect(handlers.onOpenSettings).toHaveBeenCalled();
        expect(handlers.onOpenVault).toHaveBeenCalled();
        expect(handlers.onOpenPhotos).toHaveBeenCalled();
        expect(screen.queryByRole('button', { name: /lock/i })).toBeNull();
        const onLock = vi.fn();
        rerender(<DeviceHome {...handlers} onLock={onLock} />);
        fireEvent.click(screen.getByRole('button', { name: /lock/i }));
        expect(onLock).toHaveBeenCalled();
    });
});

describe('shared controls', () => {
    it('marks the active nav item', () => {
        const onClick = vi.fn();
        const { rerender } = render(
            <SimulatorAppNavItem label="Home" icon="home" onClick={onClick} />,
        );
        expect(screen.getByRole('button').getAttribute('aria-current')).toBeNull();
        rerender(<SimulatorAppNavItem label="Home" active ariaLabel="Go home" onClick={onClick} />);
        expect(screen.getByRole('button', { name: 'Go home' }).getAttribute('aria-current')).toBe(
            'page',
        );
    });

    it('renders the identity card with and without an image', () => {
        const { container, rerender } = render(<ContactIdentityCard>Body</ContactIdentityCard>);
        expect(container.querySelector('header')).toBeNull();
        rerender(<ContactIdentityCard image={<img alt="x" />}>Body</ContactIdentityCard>);
        expect(container.querySelector('header')).not.toBeNull();
    });

    it('renders default or custom feedback', () => {
        const { container, rerender } = render(
            <>{renderSimulatorFeedback({ message: 'Careful' })}</>,
        );
        expect(container.textContent).toContain('Careful');
        rerender(
            <>{renderSimulatorFeedback({ message: 'Fine', tone: SimulatorAlertTone.Info })}</>,
        );
        expect(container.textContent).toContain('Fine');
        rerender(
            <>
                {renderSimulatorFeedback({ message: 'x' }, (feedback) => (
                    <b>{feedback.message}!</b>
                ))}
            </>,
        );
        expect(container.textContent).toBe('x!');
    });
});

describe('SimulatorAppsProvider defaults', () => {
    it('formats dates, edits notes and merges overrides', () => {
        let host!: ReturnType<typeof useSimulatorAppsHost>;
        const Probe = () => {
            host = useSimulatorAppsHost();
            return null;
        };
        render(
            <SimulatorAppsProvider value={{}}>
                <SimulatorAppsProvider value={{ formatDate: () => 'fixed' }}>
                    <Probe />
                </SimulatorAppsProvider>
            </SimulatorAppsProvider>,
        );
        expect(host.formatDate(new Date(0))).toBe('fixed');
        expect(
            host.formatCaptureDate({
                capturedAt: '',
                timeZone: '',
                latitude: null,
                longitude: null,
            }),
        ).toBe('Unknown capture date');
        expect(
            host.formatCaptureDate({
                capturedAt: '2026-01-01T10:00',
                timeZone: '',
                latitude: null,
                longitude: null,
            }),
        ).toContain('capture time zone unknown');
        expect(
            host.formatCaptureDate({
                capturedAt: '2026-01-01T10:00',
                timeZone: 'UTC',
                latitude: null,
                longitude: null,
            }),
        ).toContain('(UTC)');
    });

    it('uses the default date formatter and notes editor', () => {
        let host!: ReturnType<typeof useSimulatorAppsHost>;
        const Probe = () => {
            host = useSimulatorAppsHost();
            return null;
        };
        render(<Probe />);
        expect(host.formatDate(new Date(0))).toBe(new Date(0).toLocaleString());
        const onChange = vi.fn();
        render(
            <host.NotesEditor
                label="Notes"
                markdown="a"
                placeholder=""
                readOnly={false}
                onChange={onChange}
            />,
        );
        fireEvent.change(screen.getByLabelText('Notes'), { target: { value: 'b' } });
        expect(onChange).toHaveBeenCalledWith('b');
    });
});

describe('useComposerSubmit', () => {
    const options = (send: () => Promise<void>, onSent = vi.fn()) => ({
        canSend: true,
        send,
        onSent,
        failureMessage: 'failed',
    });

    it('stays quiet when the form unmounts during sending', async () => {
        let finish: () => void = () => {};
        let fail: (reason: unknown) => void = () => {};
        const onSent = vi.fn();
        const ok = renderHook(() =>
            useComposerSubmit(
                options(() => new Promise<void>((done) => (finish = () => done())), onSent),
            ),
        );
        const bad = renderHook(() =>
            useComposerSubmit(options(() => new Promise<void>((_done, reject) => (fail = reject)))),
        );
        let pendingOk: Promise<void> = Promise.resolve();
        let pendingBad: Promise<void> = Promise.resolve();
        act(() => {
            pendingOk = ok.result.current.submit();
            pendingBad = bad.result.current.submit();
        });
        ok.unmount();
        bad.unmount();
        finish();
        fail(new Error('late'));
        await pendingOk;
        await pendingBad;
        expect(onSent).not.toHaveBeenCalled();
    });
});
