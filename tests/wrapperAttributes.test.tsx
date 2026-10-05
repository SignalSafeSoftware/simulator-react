// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SimulatorSearchInput } from '../src/ui/lists/SimulatorSearchInput';
import { SimulatorAvatar } from '../src/ui/media/SimulatorAvatar';

afterEach(cleanup);

describe('wrappers pass native attributes through', () => {
    it('forwards input attributes from the search input and keeps its own behavior', () => {
        const onChange = vi.fn();
        render(
            <SimulatorSearchInput
                value='abc'
                onChange={onChange}
                id='contact-search'
                name='q'
                disabled
                maxLength={20}
            />,
        );
        const input = screen.getByRole('searchbox') as HTMLInputElement;
        expect(input.id).toBe('contact-search');
        expect(input.name).toBe('q');
        expect(input.disabled).toBe(true);
        expect(input.maxLength).toBe(20);
        expect(input.type).toBe('search');
    });

    it('forwards span attributes from the avatar and keeps it hidden by default', () => {
        const { container } = render(<SimulatorAvatar data-testid='avatar' title='Sam' />);
        const span = container.querySelector('span') as HTMLElement;
        expect(span.getAttribute('data-testid')).toBe('avatar');
        expect(span.title).toBe('Sam');
        expect(span.getAttribute('aria-hidden')).toBe('true');
        expect(span.className).toContain('simulator-avatar');
    });
});
