import type { ReactNode } from 'react';
import { SimulatorPhoneScreenId } from '@signalsafe/simulator-core/devicePayload';
import type {
    PhoneScreenId,
    SimulatorAction,
    SimulatorPhonePayload,
    SimulatorSessionContact,
} from '../../types/session.js';
import type { SimulatorCapabilities } from '../../utils/payload/simulatorCapabilities.js';
import type { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { SimulatorActions } from '../../actions/simulatorActions.js';
import { simLayout, simScreen, simTypo } from '../../simulatorStyles.js';
import { joinClasses } from '../../ui/styles/simulatorClasses.js';
import { SIM_PHONE } from '../../ui/styles/semanticSimulatorClasses.js';
import { PhoneContactsScreen } from './PhoneContactsScreen.js';
import PhoneHistoryScreen from './PhoneHistoryScreen.js';
import PhoneDialView from './PhoneDialView.js';
import PhoneVoicemailView from './PhoneVoicemailView.js';
import type { voicemailDeletion } from './authoredPhoneCall.js';

export function renderStandardPhoneView({
    payload,
    screen,
    contactList,
    phoneCapabilities,
    onNavigate,
    onAction,
    onBack,
    selectedHistoryEntryId,
    selectHistoryEntry,
    localNav,
    deleteVoicemail,
    screenLocale,
    renderDialHeading,
    renderAddContact,
}: Readonly<{
    payload: SimulatorPhonePayload | null;
    screen: PhoneScreenId;
    contactList: SimulatorSessionContact[];
    phoneCapabilities: SimulatorCapabilities['phone'];
    onNavigate: (screen: PhoneScreenId) => void;
    onAction: (action: SimulatorAction) => void;
    onBack?: () => void;
    selectedHistoryEntryId: string | null;
    selectHistoryEntry: (entryId: string | null) => void;
    localNav: (activeId: string) => ReactNode;
    deleteVoicemail: ReturnType<typeof voicemailDeletion>;
    screenLocale: ReturnType<typeof useSimulatorLocale>;
    renderDialHeading: () => ReactNode;
    renderAddContact: () => ReactNode;
}>) {
    return (
        <div className={joinClasses(simLayout.screenColumn, SIM_PHONE)}>
            <div className={simLayout.scrollBody}>
                {screen === SimulatorPhoneScreenId.History && payload != null && (
                    <PhoneHistoryScreen
                        payload={payload}
                        contacts={contactList}
                        selectedEntryId={selectedHistoryEntryId}
                        hasVoicemail={phoneCapabilities.voicemail}
                        onSelectEntry={selectHistoryEntry}
                        onSelectIncoming={() => onNavigate(SimulatorPhoneScreenId.IncomingCall)}
                        onSelectVoicemail={() => {
                            onAction(SimulatorActions.openVoicemail());
                            onNavigate(SimulatorPhoneScreenId.Voicemail);
                        }}
                        onCall={
                            phoneCapabilities.dial
                                ? (number) => onAction(SimulatorActions.dialPhone(number))
                                : undefined
                        }
                    />
                )}

                {screen === SimulatorPhoneScreenId.Contacts && (
                    <PhoneContactsScreen
                        contactList={contactList}
                        onNavigate={onNavigate}
                        onAction={onAction}
                    />
                )}

                {screen === SimulatorPhoneScreenId.AddContact && renderAddContact()}

                {screen === SimulatorPhoneScreenId.Dial && (
                    <>
                        {renderDialHeading()}
                        <PhoneDialView
                            onDial={(number) => onAction(SimulatorActions.dialPhone(number))}
                        />
                    </>
                )}

                {screen === SimulatorPhoneScreenId.Voicemail &&
                    payload?.voicemailTranscript != null && (
                        <PhoneVoicemailView
                            onDelete={deleteVoicemail ? () => deleteVoicemail(null) : undefined}
                            transcript={payload.voicemailTranscript}
                            callerName={payload.voicemailCallerName ?? null}
                            phoneNumber={payload.voicemailPhoneNumber ?? null}
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
