/**
 * Phone incoming call scene: wireframe order — large profile icon, "Name calling (URGENT)", number,
 * rectangular Answer / Ignore. Emits answer_call / ignore_call via callbacks.
 */
import type { ReactNode } from 'react';

import type { PhoneSimulatorContent } from '../types/portableSimulator.js';
import { simBorder, simLayout, simSpacing } from '../simulatorStyles.js';
import {
    joinClasses,
    SIM_FLEX_COL,
    SIM_FLEX_GROW_1,
    SIM_MUTED,
    SIM_OVERFLOW_HIDDEN,
    SIM_ROUNDED_NONE,
    SIM_SURFACE_AVATAR,
    SIM_SURFACE_LIGHT,
    SIM_TEXT_BOLD,
    SIM_TEXT_CENTER,
    SIM_TEXT_DARK,
    SIM_TEXT_SEMIBOLD,
    SIM_TEXT_SM,
} from '../ui/simulatorClasses.js';
import {
    SIM_PHONE_INCOMING_CALL_ACTIONS,
    SIM_PHONE_INCOMING_CALL_AVATAR,
    SIM_PHONE_INCOMING_CALL_CALLER_NAME,
    SIM_PHONE_INCOMING_CALL_NUMBER,
    SIM_PHONE_INCOMING_CALL_SCENE,
} from '../ui/semanticSimulatorClasses.js';
import {
    renderSimulatorChoice,
    type SimulatorChoiceRenderProps,
} from '../ui/renderSlots.js';

export interface PhoneIncomingSceneProps {
    content: PhoneSimulatorContent;
    onAnswer: () => void;
    onIgnore: () => void;
    renderChoice?: (choice: SimulatorChoiceRenderProps) => ReactNode;
}

const actionBtnClass = joinClasses(
    SIM_ROUNDED_NONE,
    simSpacing.py3,
    SIM_TEXT_SEMIBOLD,
    SIM_FLEX_GROW_1,
    'simulator-btn--block',
);

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
            className={joinClasses(
                SIM_PHONE_INCOMING_CALL_SCENE,
                SIM_FLEX_COL,
                'simulator-flex--align-center',
                simSpacing.py3,
                simSpacing.px3,
                simBorder.tile,
                SIM_ROUNDED_NONE,
                SIM_SURFACE_LIGHT,
            )}
            style={{ minHeight: 320 }}
            data-testid="phone-incoming-scene"
        >
            <div
                className={joinClasses(
                    SIM_PHONE_INCOMING_CALL_AVATAR,
                    SIM_ROUNDED_NONE,
                    SIM_OVERFLOW_HIDDEN,
                    SIM_SURFACE_AVATAR,
                    'simulator-flex simulator-flex--center',
                    simSpacing.mb3,
                )}
                style={{ width: 120, height: 120 }}
                data-testid="phone-simulator-avatar"
            >
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt=""
                        className="simulator-w-full simulator-h-full simulator-object-fit-cover"
                    />
                ) : (
                    <span className="simulator-text--primary" style={{ fontSize: '3.5rem' }} aria-hidden>
                        👤
                    </span>
                )}
            </div>

            <h2
                className={joinClasses(
                    SIM_PHONE_INCOMING_CALL_CALLER_NAME,
                    'simulator-heading simulator-heading--sub',
                    simSpacing.mb1,
                    SIM_TEXT_BOLD,
                    SIM_TEXT_DARK,
                    SIM_TEXT_CENTER,
                )}
                data-testid="phone-simulator-caller-name"
            >
                {callingLabel}
            </h2>
            <p
                className={joinClasses(
                    SIM_PHONE_INCOMING_CALL_NUMBER,
                    simSpacing.mb3,
                    SIM_TEXT_SM,
                    SIM_MUTED,
                    SIM_TEXT_CENTER,
                )}
                data-testid="phone-simulator-number"
            >
                {phoneNumber}
            </p>

            <div
                className={joinClasses(
                    SIM_PHONE_INCOMING_CALL_ACTIONS,
                    simLayout.row,
                    simSpacing.gap2,
                    'simulator-w-full',
                    'simulator-spacing--mt-auto',
                )}
                data-testid="phone-simulator-actions"
            >
                {renderSimulatorChoice(
                    {
                        label: 'ANSWER',
                        tone: 'success',
                        className: actionBtnClass,
                        onClick: onAnswer,
                        'aria-label': 'Answer',
                    },
                    renderChoice,
                )}
                {renderSimulatorChoice(
                    {
                        label: 'IGNORE',
                        tone: 'danger',
                        className: actionBtnClass,
                        onClick: onIgnore,
                        'aria-label': 'Ignore',
                    },
                    renderChoice,
                )}
            </div>
        </div>
    );
}
