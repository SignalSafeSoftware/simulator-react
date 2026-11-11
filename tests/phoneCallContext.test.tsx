// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import PhoneCallView, { PhoneCallPhase } from '../src/views/phone/PhoneCallView';

it('keeps secondary context below working answer and decline actions', () => {
    const answer = vi.fn();
    const decline = vi.fn();
    const { container } = render(
        <PhoneCallView
            callerName='Example caller'
            incoming
            phase={PhoneCallPhase.Ringing}
            connectedAt={null}
            muted={false}
            digits=''
            onAnswer={answer}
            onHangup={decline}
        >
            <section aria-label='Previous calls'>
                <p>Received yesterday</p>
            </section>
        </PhoneCallView>,
    );
    const context = container.querySelector('.simulator-call-context');
    expect(context?.previousElementSibling?.className).toBe('simulator-call-actions');
    fireEvent.click(screen.getByRole('button', { name: 'Answer call' }));
    fireEvent.click(screen.getByRole('button', { name: 'Decline call' }));
    expect(answer).toHaveBeenCalledOnce();
    expect(decline).toHaveBeenCalledOnce();
});
