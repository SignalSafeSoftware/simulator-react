import { SIM_PHONE_INCOMING_CALL_SCENE } from '../../ui/styles/semanticSimulatorClasses.js';
import type { ReactNode } from 'react';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { type PhoneSimulatorContent } from '../../types/template.js';
import type { SimulatorChoiceRenderProps } from '../../ui/renderSlots.js';
import PhoneCallView from './PhoneCallView.js';
import SimulatorAvatar from '../../ui/media/SimulatorAvatar.js';

export interface PhoneIncomingSceneProps {
    content: PhoneSimulatorContent;
    onAnswer: () => void;
    onIgnore: () => void;
    renderChoice?: (choice: SimulatorChoiceRenderProps) => ReactNode;
}

/** Scenario callbacks adapt to the same controlled call view used by live hosts. */
export default function PhoneIncomingScene({
    content,
    onAnswer,
    onIgnore,
    renderChoice,
}: Readonly<PhoneIncomingSceneProps>) {
    const { t } = useSimulatorLocale();
    return (
        <div className={SIM_PHONE_INCOMING_CALL_SCENE} data-testid="phone-incoming-scene">
            <PhoneCallView
                callerName={content.caller_name || t('value.unknown')}
                number={content.phone_number || undefined}
                label={content.caller_title || content.urgency || t('calls.simulated')}
                phase="ringing"
                incoming
                connectedAt={null}
                muted={false}
                digits=""
                onAnswer={onAnswer}
                onHangup={onIgnore}
                onMute={() => undefined}
                onDigit={() => undefined}
                renderChoice={
                    renderChoice
                        ? (choice) =>
                              renderChoice({
                                  ...choice,
                                  label:
                                      choice.tone === 'success'
                                          ? t('screen.phoneIncomingScene.answer')
                                          : t('screen.phoneIncomingScene.ignore'),
                              })
                        : undefined
                }
                avatar={
                    content.avatar_url ? (
                        <SimulatorAvatar avatarUrl={content.avatar_url} />
                    ) : undefined
                }
            />
        </div>
    );
}
