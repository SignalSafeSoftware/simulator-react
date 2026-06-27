/**
 * Phone incoming call scene: wireframe order — large profile icon, "Name calling (URGENT)", number,
 * rectangular Answer / Ignore. Emits answer_call / ignore_call via callbacks.
 */
import type { ReactNode } from 'react';

import type { PhoneSimulatorContent } from '../types/portableSimulator';
import { joinClasses } from '../ui/simulatorClasses';
import {
    renderSimulatorChoice,
    type SimulatorChoiceRenderProps,
} from '../ui/renderSlots';

export interface PhoneIncomingSceneProps {
    content: PhoneSimulatorContent;
    onAnswer: () => void;
    onIgnore: () => void;
    renderChoice?: (choice: SimulatorChoiceRenderProps) => ReactNode;
}

export default function PhoneIncomingScene({
    content,
    onAnswer,
    onIgnore,
    renderChoice,
}: Readonly<PhoneIncomingSceneProps>) {
    const phoneNumber = content.phone_number ?? '+1 555 000-0000';
    const callerName = content.caller_name ?? 'Unknown';
    const urgencyPart = content.caller_title ?? (content.urgency ? content.urgency : null);
    const callingLabel = urgencyPart ? `${callerName} calling (${urgencyPart.toUpperCase()})` : `${callerName} calling`;
    const avatarUrl = content.avatar_url;

    return (
        <div
            className="d-flex flex-column align-items-center py-4 px-3 border border-secondary rounded-0 bg-light"
            style={{ minHeight: 320 }}
            data-testid="phone-incoming-scene"
        >
            <div
                className="rounded-0 overflow-hidden bg-primary bg-opacity-25 d-flex align-items-center justify-content-center mb-3"
                style={{ width: 120, height: 120 }}
                data-testid="phone-simulator-avatar"
            >
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt=""
                        className="w-100 h-100 object-fit-cover"
                    />
                ) : (
                    <span className="text-primary" style={{ fontSize: '3.5rem' }} aria-hidden>
                        👤
                    </span>
                )}
            </div>

            <h2
                className="h6 mb-1 fw-bold text-dark text-center"
                data-testid="phone-simulator-caller-name"
            >
                {callingLabel}
            </h2>
            <p
                className="mb-4 small text-muted text-center"
                data-testid="phone-simulator-number"
            >
                {phoneNumber}
            </p>

            <div className="d-flex flex-row gap-2 w-100 mt-auto" data-testid="phone-simulator-actions">
                {renderSimulatorChoice(
                    {
                        label: 'ANSWER',
                        tone: 'success',
                        className: joinClasses('rounded-0', 'py-3', 'fw-semibold', 'flex-grow-1', 'simulator-btn--block'),
                        onClick: onAnswer,
                        'aria-label': 'Answer',
                    },
                    renderChoice,
                )}
                {renderSimulatorChoice(
                    {
                        label: 'IGNORE',
                        tone: 'danger',
                        className: joinClasses('rounded-0', 'py-3', 'fw-semibold', 'flex-grow-1', 'simulator-btn--block'),
                        onClick: onIgnore,
                        'aria-label': 'Ignore',
                    },
                    renderChoice,
                )}
            </div>
        </div>
    );
}
