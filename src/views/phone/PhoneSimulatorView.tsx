/**
 * Phone app: secondary nav (History, Contacts, Dial, Back) + content. Defaults to History.
 * Wireframe-style segmented local nav; Back from voicemail or secondary Back returns to primary menu.
 */
import { SimulatorPhoneScreenId } from '@signalsafe/simulator-core/devicePayload';
import {
    SIM_BORDER_BOTTOM_NONE,
    SIM_BTN_SM,
    SIM_FLEX_SHRINK_0,
    SimulatorButtonTone,
    joinClasses,
} from '../../ui/styles/simulatorClasses.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import type { ReactNode } from 'react';
import { type SimulatorDispatchAction } from '../../state/simulatorDispatchActions.js';
import type {
    PhoneScreenId,
    SimulatorAction,
    SimulatorDirectoryEntry,
    SimulatorPhonePayload,
    SimulatorSessionContact,
    SimulatorSessionState,
} from '../../types/session.js';
import {
    renderPhoneIncomingCallExtra,
    type SimulatorChoiceRenderProps,
    type SimulatorPhoneIncomingCallExtraRenderProps,
} from '../../ui/renderSlots.js';
import { SimulatorActions } from '../../actions/simulatorActions.js';
import { SimulatorLocalNav } from '../../ui/navigation/SimulatorLocalNav.js';
import { PhoneContactsScreen } from './PhoneContactsScreen.js';
import PhoneHistoryList from './PhoneHistoryList.js';
import PhoneDialView from './PhoneDialView.js';
import PhoneVoicemailView from './PhoneVoicemailView.js';
import PhoneIncomingScene from './PhoneIncomingScene.js';
import type { SimulatorCapabilities } from '../../utils/payload/simulatorCapabilities.js';
import {
    getPhoneLocalNavItems,
    type PhoneLocalNavItem,
} from '../../utils/navigation/phoneLocalNavItems.js';
import { simLayout, simScreen, simSpacing, simTypo } from '../../simulatorStyles.js';
import { SimulatorButton } from '../../ui/primitives.js';
import { SIM_PHONE } from '../../ui/styles/semanticSimulatorClasses.js';

function SectionHeading({ children }: Readonly<{ children: ReactNode }>) {
    return <div className={joinClasses(simScreen.header, simSpacing.sectionGap)}>{children}</div>;
}

function PhoneAddContactEmptyState({ onBack }: Readonly<{ onBack: () => void }>) {
    const screenLocale = useSimulatorLocale();

    return (
        <>
            <SectionHeading>
                {screenLocale.t('screen.phoneSimulatorView.add.contact')}
            </SectionHeading>
            <div className={simSpacing.p2}>
                <p className={simTypo.emptyState}>
                    {screenLocale.t(
                        'screen.phoneSimulatorView.contact.creation.is.not.configured.for.this.scenar',
                    )}
                </p>
                <SimulatorButton
                    tone={SimulatorButtonTone.NeutralOutline}
                    className={SIM_BTN_SM}
                    onClick={onBack}
                >
                    {screenLocale.t('screen.phoneSimulatorView.back.to.contacts')}
                </SimulatorButton>
            </div>
        </>
    );
}

export interface PhoneSimulatorViewProps {
    payload: SimulatorPhonePayload | null;
    /** When present with entries, Directory tab is shown. */
    directory?: SimulatorDirectoryEntry[] | null;
    /** Contacts list (from full-device payload) for Contacts screen. */
    contacts?: SimulatorSessionContact[] | null;
    /** Derived capabilities: dial, voicemail, directory. Controls which tabs are shown. */
    phoneCapabilities: SimulatorCapabilities['phone'];
    screen: PhoneScreenId;
    onNavigate: (screen: PhoneScreenId) => void;
    onAction: (action: SimulatorAction) => void;
    /** Called after Answer or Ignore to return to previous screen (e.g. History). */
    onDismissIncoming?: () => void;
    /** Called when user taps Back (e.g. from Voicemail or secondary menu Back). */
    onBack?: () => void;
    /** When true, the shell is rendering the secondary menu (History/Contacts/Dial/Back); do not render local nav here. */
    navRenderedByShell?: boolean;
    renderChoice?: (choice: SimulatorChoiceRenderProps) => ReactNode;
    /** Session state for host incoming-call extra slot (provided by {@link SimulatorWithSession}). */
    sessionState?: SimulatorSessionState;
    /** Session dispatch for host incoming-call extra slot (provided by {@link SimulatorWithSession}). */
    sessionDispatch?: (action: SimulatorDispatchAction) => void;
    /** Host-owned content below incoming-call Answer/Ignore (e.g. caller history table). */
    renderIncomingCallExtra?: (props: SimulatorPhoneIncomingCallExtraRenderProps) => ReactNode;
}

const localNavClass = joinClasses(simSpacing.mb0, SIM_BORDER_BOTTOM_NONE, SIM_FLEX_SHRINK_0);

export default function PhoneSimulatorView({
    payload,
    directory: _directory,
    contacts = null,
    phoneCapabilities,
    screen,
    onNavigate,
    onAction,
    onDismissIncoming,
    onBack,
    navRenderedByShell = false,
    renderChoice,
    sessionState,
    sessionDispatch,
    renderIncomingCallExtra,
}: Readonly<PhoneSimulatorViewProps>) {
    const screenLocale = useSimulatorLocale();

    const localNavItems = getPhoneLocalNavItems(phoneCapabilities, screenLocale);
    const contactList = contacts ?? [];
    const handleNavSelect = (id: PhoneLocalNavItem['id']) => {
        if (id === 'back') {
            onBack?.();
        } else {
            onNavigate(id);
        }
    };
    const localNav = (activeId: string) =>
        !navRenderedByShell && (
            <SimulatorLocalNav
                items={localNavItems}
                activeId={activeId}
                onSelect={handleNavSelect}
                className={localNavClass}
                aria-label={screenLocale.t('screen.phoneSimulatorView.phone.tabs')}
            />
        );
    if (payload == null && screen !== SimulatorPhoneScreenId.Dial) {
        return (
            <p className={simTypo.emptyState}>
                {screenLocale.t('screen.phoneSimulatorView.no.phone.for.this.scenario')}
            </p>
        );
    }
    const content = payload?.content;
    if (screen === SimulatorPhoneScreenId.IncomingCall) {
        if (content == null) {
            return (
                <p className={simTypo.emptyState}>
                    {screenLocale.t('screen.phoneSimulatorView.no.incoming.call.for.this.scenario')}
                </p>
            );
        }
        const dismiss = () => onDismissIncoming?.();
        const incomingCallExtra =
            sessionState != null && sessionDispatch != null
                ? renderPhoneIncomingCallExtra(
                      {
                          state: sessionState,
                          dispatch: sessionDispatch,
                          content,
                          callHistory: payload?.callHistory ?? [],
                          contacts: contacts ?? null,
                      },
                      renderIncomingCallExtra,
                  )
                : null;
        return (
            <div className={joinClasses(simLayout.screenColumn, SIM_PHONE)}>
                <div className={simLayout.scrollBody}>
                    <PhoneIncomingScene
                        content={content}
                        renderChoice={renderChoice}
                        onAnswer={() => {
                            onAction(SimulatorActions.answerCall(0));
                            dismiss();
                        }}
                        onIgnore={() => {
                            onAction(SimulatorActions.ignoreCall());
                            dismiss();
                        }}
                    />
                    {incomingCallExtra}
                </div>
                {localNav(SimulatorPhoneScreenId.History)}
            </div>
        );
    }

    return (
        <div className={joinClasses(simLayout.screenColumn, SIM_PHONE)}>
            <div className={simLayout.scrollBody}>
                {screen === SimulatorPhoneScreenId.History && (
                    <>
                        <SectionHeading>
                            {screenLocale.t('screen.phoneSimulatorView.calls')}
                        </SectionHeading>
                        <PhoneHistoryList
                            entries={payload?.callHistory ?? []}
                            incomingCallContent={payload?.content}
                            hasVoicemail={phoneCapabilities.voicemail}
                            onSelectIncoming={() => onNavigate(SimulatorPhoneScreenId.IncomingCall)}
                            onSelectVoicemail={() => {
                                onAction(SimulatorActions.openVoicemail());
                                onNavigate(SimulatorPhoneScreenId.Voicemail);
                            }}
                        />
                    </>
                )}

                {screen === SimulatorPhoneScreenId.Contacts && (
                    <PhoneContactsScreen
                        contactList={contactList}
                        onNavigate={onNavigate}
                        onAction={onAction}
                    />
                )}

                {screen === SimulatorPhoneScreenId.AddContact && (
                    <PhoneAddContactEmptyState
                        onBack={() => onNavigate(SimulatorPhoneScreenId.Contacts)}
                    />
                )}

                {screen === SimulatorPhoneScreenId.Dial && (
                    <>
                        <SectionHeading>
                            {screenLocale.t('screen.phoneSimulatorView.dial')}
                        </SectionHeading>
                        <PhoneDialView
                            onDial={(number) => onAction(SimulatorActions.dialPhone(number))}
                        />
                    </>
                )}

                {screen === SimulatorPhoneScreenId.Voicemail &&
                    payload?.voicemailTranscript != null && (
                        <PhoneVoicemailView
                            transcript={payload.voicemailTranscript}
                            callerName={payload.voicemailCallerName ?? null}
                            timestamp={payload.voicemailTimestamp ?? null}
                            onBack={onBack ?? (() => onNavigate(SimulatorPhoneScreenId.History))}
                        />
                    )}

                {screen === SimulatorPhoneScreenId.Voicemail &&
                    payload?.voicemailTranscript == null && (
                        <>
                            <div className={simScreen.header}>
                                {screenLocale.t('screen.phoneVoicemailView.voicemail')}
                            </div>
                            <p className={simTypo.emptyState}>
                                {screenLocale.t('screen.phoneSimulatorView.no.voicemail')}
                            </p>
                        </>
                    )}
            </div>
            {localNav(
                screen === SimulatorPhoneScreenId.AddContact
                    ? SimulatorPhoneScreenId.Contacts
                    : screen,
            )}
        </div>
    );
}
