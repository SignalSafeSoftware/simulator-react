// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { LoadMore } from '../src/ui/lists/LoadMore';

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
});

it('keeps one observer when the loaded count changes and requests once per visibility transition', () => {
    let intersect: (visible?: boolean) => void = () => {};
    const created = vi.fn();
    vi.stubGlobal(
        'IntersectionObserver',
        class {
            constructor(callback: IntersectionObserverCallback) {
                created();
                intersect = (visible = true) =>
                    callback(
                        [{ isIntersecting: visible } as IntersectionObserverEntry],
                        this as unknown as IntersectionObserver,
                    );
            }
            observe() {}
            disconnect() {}
        },
    );
    const load = vi.fn();
    const props = {
        count: 20,
        hasMore: true,
        loading: false,
        error: '',
        onLoadMore: load,
        label: 'More',
    };
    const view = render(<LoadMore {...props} />);
    intersect();
    intersect();
    expect(load).toHaveBeenCalledTimes(1);
    view.rerender(<LoadMore {...props} count={40} />);
    intersect();
    expect(load).toHaveBeenCalledTimes(1);
    expect(created).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button').getAttribute('data-loaded-count')).toBe('40');
    intersect(false);
    intersect();
    expect(load).toHaveBeenCalledTimes(2);
});
