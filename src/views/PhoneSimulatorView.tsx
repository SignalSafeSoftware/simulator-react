/**
 * Phone app: secondary nav (History, Contacts, Dial, Back) + content. Defaults to History.
 * Wireframe-style segmented local nav; Back from voicemail or secondary Back returns to primary menu.
 */
import { useState, type ReactNode } from 'react';
import type { SimulatorDispatchAction } from '../state/simulatorSessionReducer.js';
import type {
    PhoneScreenId,
    SimulatorAction,
    SimulatorDirectoryEntry,
    SimulatorPhonePayload,
    SimulatorSessionContact,
    SimulatorSessionState,
} from '../types/session.js';
import {
    renderPhoneIncomingCallExtra,
    type SimulatorChoiceRenderProps,
    type SimulatorPhoneIncomingCallExtraRenderProps,
} from '../ui/renderSlots.js';
import { SimulatorActions } from '../actions/index.js';
import SimulatorLocalNav from '../components/SimulatorLocalNav.js';
import PhoneHistoryList from './PhoneHistoryList.js';
import PhoneDialView from './PhoneDialView.js';
import PhoneVoicemailView from './PhoneVoicemailView.js';
import PhoneIncomingScene from './PhoneIncomingScene.js';
import type { SimulatorCapabilities } from '../utils/simulatorCapabilities.js';
import { getPhoneLocalNavItems } from '../utils/phoneLocalNavItems.js';
import { simLayout, simScreen, simSpacing, simTypo } from '../simulatorStyles.js';
import {
    SimulatorButton,
    SimulatorField,
    SimulatorInput,
    SimulatorLabel,
    SimulatorList,
    SimulatorListItem,
} from '../ui/primitives.js';
import {
    joinClasses,
    SIM_AVATAR,
    SIM_FLEX_COL,
    SIM_FLEX_GROW_1,
    SIM_FLEX_SHRINK_0,
    SIM_MUTED,
    SIM_ROUNDED_NONE,
    SIM_SURFACE_AVATAR,
    SIM_TEXT_CENTER,
    SIM_TEXT_MEDIUM,
    SIM_TEXT_SM,
} from '../ui/simulatorClasses.js';
import {
    SIM_PHONE,
    SIM_PHONE_CONTACT_LIST,
    SIM_PHONE_CONTACT_ROW,
    SIM_PHONE_CONTACT_ROW_AVATAR,
    SIM_PHONE_CONTACT_ROW_MAIN,
    SIM_PHONE_CONTACT_ROW_NAME,
    SIM_PHONE_CONTACT_ROW_NUMBER,
} from '../ui/semanticSimulatorClasses.js';

function PhoneAddContactForm({
    onSave,
    onCancel,
}: Readonly<{
    onSave: () => void;
    onCancel: () => void;
}>) {
    const [name, setName] = useState('');
    const [number, setNumber] = useState('');
    const nameInputId = 'phone-add-contact-name';
    const numberInputId = 'phone-add-contact-number';
    return (
        <>
            <div className={joinClasses(simScreen.header, simSpacing.sectionGap)}>Add Contact</div>
            <div className={simSpacing.p2}>
                <SimulatorField className={simSpacing.mb2}>
                    <SimulatorLabel className={simLayout.fieldLabel}>Name</SimulatorLabel>
                    <SimulatorInput
                        id={nameInputId}
                        type="text"
                        className="simulator-input--sm"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Name"
                    />
                </SimulatorField>
                <SimulatorField className={simSpacing.mb2}>
                    <SimulatorLabel className={simLayout.fieldLabel}>Number</SimulatorLabel>
                    <SimulatorInput
                        id={numberInputId}
                        type="tel"
                        className="simulator-input--sm"
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        placeholder="Number"
                    />
                </SimulatorField>
                <div className={joinClasses(simLayout.actionsRow, 'simulator-flex--end')}>
                    <SimulatorButton tone="outline-secondary" className="simulator-btn--sm" onClick={onCancel}>
                        Cancel
                    </SimulatorButton>
                    <SimulatorButton tone="primary" className="simulator-btn--sm" onClick={onSave}>
                        Save
                    </SimulatorButton>
                </div>
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

const localNavClass = joinClasses(simSpacing.mb0, 'simulator-border--bottom-none', SIM_FLEX_SHRINK_0);

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
    const localNavItems = getPhoneLocalNavItems(phoneCapabilities);
    const handleNavSelect = (id: string) => {
        if (id === 'back') {
            onBack?.();
        } else {
            onNavigate(id as PhoneScreenId);
        }
    };
    if (payload == null && screen !== 'dial') {
        return <p className={simTypo.emptyState}>No phone for this scenario.</p>;
    }
    const content = payload?.content;
    if (screen === 'incoming_call') {
        if (content == null) {
            return <p className={simTypo.emptyState}>No incoming call for this scenario.</p>;
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
                    <div className={joinClasses(simScreen.header, simSpacing.sectionGap)}>Incoming Call</div>
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
                {!navRenderedByShell && (
                    <SimulatorLocalNav
                        items={localNavItems}
                        activeId="history"
                        onSelect={handleNavSelect}
                        className={localNavClass}
                        aria-label="Phone tabs"
                    />
                )}
            </div>
        );
    }

    return (
        <div className={joinClasses(simLayout.screenColumn, SIM_PHONE)}>
            <div className={simLayout.scrollBody}>
                {screen === 'history' && (
                    <>
                        <div className={joinClasses(simScreen.header, simSpacing.sectionGap)}>Calls</div>
                        <PhoneHistoryList
                            entries={payload?.callHistory ?? []}
                            incomingCallContent={payload?.content}
                            hasVoicemail={phoneCapabilities.voicemail}
                            onSelectIncoming={() => onNavigate('incoming_call')}
                            onSelectVoicemail={() => {
                                onAction(SimulatorActions.openVoicemail());
                                onNavigate('voicemail');
                            }}
                        />
                    </>
                )}

                {screen === 'contacts' && (
                    <>
                        <div className={simLayout.headerRowBetween}>
                            <span className={joinClasses(SIM_FLEX_GROW_1, SIM_TEXT_CENTER)}>Contacts</span>
                            <SimulatorButton
                                tone="outline-primary"
                                className={joinClasses(SIM_ROUNDED_NONE, simSpacing.py1, simSpacing.px2, simSpacing.me2, 'simulator-btn--sm')}
                                onClick={() => onNavigate('add_contact')}
                                aria-label="Add contact"
                            >
                                Add
                            </SimulatorButton>
                        </div>
                        <SimulatorList className={joinClasses('simulator-list--flush', SIM_PHONE_CONTACT_LIST)}>
                            {(contacts ?? []).map((c) => (
                                <SimulatorListItem
                                    key={c.id}
                                    action
                                    className={joinClasses(
                                        simLayout.rowBetween,
                                        simSpacing.py2,
                                        'simulator-text--sm',
                                        SIM_PHONE_CONTACT_ROW,
                                    )}
                                >
                                    <div
                                        className={joinClasses(
                                            SIM_PHONE_CONTACT_ROW_AVATAR,
                                            SIM_AVATAR,
                                            SIM_SURFACE_AVATAR,
                                            'simulator-flex simulator-flex--center',
                                            SIM_FLEX_SHRINK_0,
                                        )}
                                        style={{ width: 40, height: 40 }}
                                        aria-hidden
                                    >
                                        <span className="simulator-text--primary" style={{ fontSize: '1.25rem' }}>
                                            👤
                                        </span>
                                    </div>
                                    <div className={joinClasses(SIM_PHONE_CONTACT_ROW_MAIN, SIM_FLEX_GROW_1, 'simulator-min-w-0', SIM_FLEX_COL)}>
                                        <span className={joinClasses(SIM_PHONE_CONTACT_ROW_NAME, SIM_TEXT_MEDIUM)}>{c.displayName}</span>
                                        {c.number != null && c.number !== '' && (
                                            <span className={joinClasses(SIM_PHONE_CONTACT_ROW_NUMBER, SIM_MUTED, SIM_TEXT_SM)}>
                                                {c.number}
                                            </span>
                                        )}
                                    </div>
                                    {c.number != null && (
                                        <SimulatorButton
                                            tone="outline-primary"
                                            className="simulator-btn--sm"
                                            onClick={() => onAction(SimulatorActions.dialPhone(c.number))}
                                        >
                                            Call
                                        </SimulatorButton>
                                    )}
                                </SimulatorListItem>
                            ))}
                        </SimulatorList>
                        {(contacts ?? []).length === 0 && (
                            <p className={joinClasses(simTypo.emptyState, SIM_TEXT_CENTER, simSpacing.py3)}>No contacts.</p>
                        )}
                    </>
                )}

                {screen === 'add_contact' && (
                    <PhoneAddContactForm
                        onSave={() => onNavigate('contacts')}
                        onCancel={() => onNavigate('contacts')}
                    />
                )}

                {screen === 'dial' && (
                    <>
                        <div className={joinClasses(simScreen.header, simSpacing.sectionGap)}>Dial</div>
                        <PhoneDialView
                            onDial={(number) => onAction(SimulatorActions.dialPhone(number))}
                        />
                    </>
                )}

                {screen === 'voicemail' && payload?.voicemailTranscript != null && (
                    <PhoneVoicemailView
                        transcript={payload.voicemailTranscript}
                        callerName={payload.voicemailCallerName ?? null}
                        timestamp={payload.voicemailTimestamp ?? null}
                        onBack={onBack ?? (() => onNavigate('history'))}
                    />
                )}

                {screen === 'voicemail' && payload?.voicemailTranscript == null && (
                    <p className={simTypo.emptyState}>No voicemail.</p>
                )}
            </div>
            {!navRenderedByShell && (
                <SimulatorLocalNav
                    items={localNavItems}
                    activeId={screen === 'add_contact' ? 'contacts' : screen}
                    onSelect={handleNavSelect}
                    className={localNavClass}
                    aria-label="Phone tabs"
                />
            )}
        </div>
    );
}
