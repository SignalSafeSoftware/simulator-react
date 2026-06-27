/**
 * Phone app: secondary nav (History, Contacts, Dial, Back) + content. Defaults to History.
 * Wireframe-style segmented local nav; Back from voicemail or secondary Back returns to primary menu.
 */
import { useState, type ReactNode } from 'react';
import type {
    PhoneScreenId,
    SimulatorAction,
    SimulatorDirectoryEntry,
    SimulatorPhonePayload,
    SimulatorSessionContact,
} from '../types/session';
import type { SimulatorChoiceRenderProps } from '../ui/renderSlots';
import { SimulatorActions } from '../actions';
import SimulatorLocalNav from '../components/SimulatorLocalNav';
import PhoneHistoryList from './PhoneHistoryList';
import PhoneDialView from './PhoneDialView';
import PhoneVoicemailView from './PhoneVoicemailView';
import PhoneIncomingScene from './PhoneIncomingScene';
import type { SimulatorCapabilities } from '../utils/simulatorCapabilities';
import { getPhoneLocalNavItems } from '../utils/phoneLocalNavItems';

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
            <div className="text-center border-bottom border-secondary py-2 mb-2 small fw-semibold text-body">
                Add Contact
            </div>
            <div className="p-2">
                <div className="mb-2">
                    <label htmlFor={nameInputId} className="form-label small mb-1">Name</label>
                    <input
                        id={nameInputId}
                        type="text"
                        className="form-control form-control-sm"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Name"
                    />
                </div>
                <div className="mb-2">
                    <label htmlFor={numberInputId} className="form-label small mb-1">Number</label>
                    <input
                        id={numberInputId}
                        type="tel"
                        className="form-control form-control-sm"
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        placeholder="Number"
                    />
                </div>
                <div className="d-flex gap-2 justify-content-end">
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onCancel}>
                        Cancel
                    </button>
                    <button type="button" className="btn btn-sm btn-primary" onClick={onSave}>
                        Save
                    </button>
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
}

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
        return <p className="text-muted small mb-0">No phone for this scenario.</p>;
    }
    const content = payload?.content;
    if (screen === 'incoming_call') {
        if (content == null) {
            return <p className="text-muted small mb-0">No incoming call for this scenario.</p>;
        }
        const dismiss = () => onDismissIncoming?.();
        return (
            <div className="d-flex flex-column flex-grow-1 min-h-0">
                <div className="flex-grow-1 min-h-0 overflow-auto">
                    <div className="text-center border-bottom border-secondary py-2 mb-2 small fw-semibold text-body">
                        Incoming Call
                    </div>
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
                </div>
                {!navRenderedByShell && (
                    <SimulatorLocalNav
                        items={localNavItems}
                        activeId="history"
                        onSelect={handleNavSelect}
                        className="mb-0 border-bottom-0 flex-shrink-0"
                        aria-label="Phone tabs"
                    />
                )}
            </div>
        );
    }

    return (
        <div className="d-flex flex-column flex-grow-1 min-h-0">
            <div className="flex-grow-1 min-h-0 overflow-auto">
                {screen === 'history' && (
                    <>
                        <div className="text-center border-bottom border-secondary py-2 mb-2 small fw-semibold text-body">
                            Calls
                        </div>
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
                        <div className="d-flex align-items-center justify-content-between border-bottom border-secondary py-2 mb-2 small fw-semibold text-body">
                            <span className="flex-grow-1 text-center">Contacts</span>
                            <button
                                type="button"
                                className="btn btn-outline-primary btn-sm rounded-0 py-1 px-2 me-2"
                                onClick={() => onNavigate('add_contact')}
                                aria-label="Add contact"
                            >
                                Add
                            </button>
                        </div>
                        <ul className="list-group list-group-flush">
                            {(contacts ?? []).map((c) => (
                                <li
                                    key={c.id}
                                    className="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2 small"
                                >
                                    <span>{c.displayName}</span>
                                    {c.number != null && (
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => onAction(SimulatorActions.dialPhone(c.number))}
                                        >
                                            Call
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                        {(contacts ?? []).length === 0 && (
                            <p className="text-muted small mb-0 text-center py-3">No contacts.</p>
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
                        <div className="text-center border-bottom border-secondary py-2 mb-2 small fw-semibold text-body">
                            Dial
                        </div>
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
                    <p className="text-muted small mb-0">No voicemail.</p>
                )}
            </div>
            {!navRenderedByShell && (
                <SimulatorLocalNav
                    items={localNavItems}
                    activeId={screen === 'add_contact' ? 'contacts' : screen}
                    onSelect={handleNavSelect}
                    className="mb-0 border-bottom-0 flex-shrink-0"
                    aria-label="Phone tabs"
                />
            )}
        </div>
    );
}
