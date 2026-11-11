import {
    SimulatorDispatchActionType,
    type SimulatorDispatchAction,
} from '../../state/simulatorDispatchActions.js';
import { SimulatorCallType } from '@signalsafe/simulator-core/phoneCalls';
import type { ReactNode } from 'react';
import type { SimulatorCallHistoryEntry, SimulatorPhonePayload } from '../../types/session.js';
import { joinClasses } from '../../ui/styles/simulatorClasses.js';
import { simLayout } from '../../simulatorStyles.js';
import { SIM_PHONE } from '../../ui/styles/semanticSimulatorClasses.js';
import PhoneVoicemailView from './PhoneVoicemailView.js';

export function authoredPhoneCall(
    payload: SimulatorPhonePayload | null | undefined,
    selectedId: string | null,
    onBack: () => void,
    navigation: ReactNode,
    onDelete?: (id: string | null) => void,
) {
    const selected = payload?.callHistory?.find((call) => call.id === selectedId && call.callType);
    const active =
        selected?.callType === SimulatorCallType.Incoming ||
        selected?.callType === SimulatorCallType.Calling
            ? selected
            : undefined;
    const content = active
        ? {
              caller_name: active.name,
              caller_title: active.callerTitle,
              phone_number: active.number,
              transcript: active.transcript ?? '',
              choices: [],
              avatar_url: active.avatarUrl,
              outgoing: active.callType === SimulatorCallType.Calling,
          }
        : payload?.content;
    const voicemail =
        selected?.callType === SimulatorCallType.Voicemail ? (
            <AuthoredPhoneVoicemail
                entry={selected}
                onBack={onBack}
                navigation={navigation}
                onDelete={onDelete ? () => onDelete(selected.id) : undefined}
            />
        ) : null;
    return { active, content, voicemail };
}
export function AuthoredPhoneVoicemail({
    entry,
    onBack,
    onDelete,
    navigation,
}: Readonly<{
    entry: SimulatorCallHistoryEntry;
    onDelete?: () => void;
    onBack: () => void;
    navigation: ReactNode;
}>) {
    return (
        <div className={joinClasses(simLayout.screenColumn, SIM_PHONE)}>
            <div className={simLayout.scrollBody}>
                <PhoneVoicemailView
                    transcript={entry.transcript ?? ''}
                    callerName={entry.name}
                    phoneNumber={entry.number}
                    timestamp={entry.timestamp}
                    onBack={onBack}
                    onDelete={onDelete}
                />
            </div>
            {navigation}
        </div>
    );
}

export function voicemailDeletion(dispatch?: (action: SimulatorDispatchAction) => void) {
    return dispatch
        ? (entryId: string | null) =>
              dispatch({ type: SimulatorDispatchActionType.DeleteVoicemail, entryId })
        : undefined;
}
