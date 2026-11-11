import { SimulatorCallType } from '@signalsafe/simulator-core/phoneCalls';
import {
    CallHistoryEntryKind,
    type SimulatorCallHistoryEntry,
    type SimulatorPhonePayload,
} from '../../types/session.js';
import { englishLocale } from '../../i18n/englishLocale.js';
import type { SimulatorDevicePayload } from '@signalsafe/simulator-core/devicePayload';
import { nullableString, optionalString, stringOr } from './mapperValues.js';

/** Map device history entry direction to CallHistoryEntryKind. */
function mapHistoryKind(direction: string | undefined): CallHistoryEntryKind {
    const d = (direction ?? '').toLowerCase();
    if (d === CallHistoryEntryKind.Missed || d === CallHistoryEntryKind.Voicemail) return d;
    if (d === 'out') return CallHistoryEntryKind.Outgoing;
    return CallHistoryEntryKind.Incoming;
}

/** Map phone app section to session phone payload (incoming_call, history, voicemail). */
export function mapPhone(phone: SimulatorDevicePayload['phone']): SimulatorPhonePayload | null {
    if (phone == null) return null;
    if (Object.hasOwn(phone, 'voicemail_transcript')) {
        throw new Error(
            'Removed simulator field phone.voicemail_transcript; migrate it to phone.voicemail.transcript.',
        );
    }
    if (phone.calls) {
        const calls = phone.calls;
        const active = calls.find(
            (call) =>
                call.type === SimulatorCallType.Incoming || call.type === SimulatorCallType.Calling,
        );
        const voicemail = calls.find((call) => call.type === SimulatorCallType.Voicemail);
        return {
            unifiedCalls: true,
            voicemailTranscript: voicemail?.transcript,
            voicemailCallerName: voicemail?.name,
            voicemailPhoneNumber: voicemail?.number,
            voicemailTimestamp: voicemail?.timestamp,
            chosenIndex: null,
            content: active
                ? {
                      caller_name: active.name,
                      caller_title: active.caller_title,
                      phone_number: active.number,
                      transcript: active.transcript ?? '',
                      avatar_url: active.avatar_url,
                      choices: [],
                      outgoing: active.type === SimulatorCallType.Calling,
                  }
                : null,
            callHistory: calls.map((call) => ({
                id: call.id,
                name: call.name,
                number: call.number ?? '',
                callType: call.type,
                transcript: call.transcript,
                avatarUrl: call.avatar_url,
                callerTitle: call.caller_title,
                timestamp: call.timestamp,
                durationSeconds: call.duration_seconds,
                kind:
                    call.type === SimulatorCallType.Voicemail
                        ? CallHistoryEntryKind.Voicemail
                        : call.type === SimulatorCallType.Missed ||
                            call.type === SimulatorCallType.Declined
                          ? CallHistoryEntryKind.Missed
                          : [
                                  SimulatorCallType.Calling,
                                  SimulatorCallType.Accepted,
                                  SimulatorCallType.Unanswered,
                                  SimulatorCallType.Cancelled,
                                  SimulatorCallType.Outgoing,
                              ].some((type) => type === call.type)
                            ? CallHistoryEntryKind.Outgoing
                            : CallHistoryEntryKind.Incoming,
            })),
        };
    }
    const incoming = phone.incoming_call;
    const transcript = stringOr(incoming?.transcript);
    const rawHistory = phone.history;
    const callHistory: SimulatorCallHistoryEntry[] = Array.isArray(rawHistory)
        ? rawHistory.map((h, i) => ({
              id: typeof h.id === 'string' ? h.id : `call-${i}`,
              number: stringOr(h.number),
              name: optionalString(h.name),
              kind: mapHistoryKind(h.direction),
              timestamp: optionalString(h.timestamp),
              durationSeconds: h.duration_seconds,
          }))
        : [];
    const voicemailSection = phone.voicemail;
    const voicemailTranscript = voicemailSection?.transcript;
    const voicemailStr = nullableString(voicemailTranscript);
    if (incoming == null && callHistory.length === 0 && !voicemailStr) return null;
    const voicemailCallerName = optionalString(voicemailSection?.caller_name);
    const voicemailTimestamp = optionalString(voicemailSection?.timestamp);
    return {
        content:
            incoming == null
                ? null
                : {
                      transcript:
                          transcript || englishLocale.t('copy.fullDeviceToSession.incoming.call'),
                      choices: [],
                      phone_number: optionalString(incoming?.phone_number),
                      caller_name: optionalString(incoming?.caller_name),
                      caller_title: optionalString(incoming?.caller_title),
                      avatar_url: optionalString(incoming?.avatar_url),
                  },
        chosenIndex: null,
        callHistory: callHistory.length > 0 ? callHistory : undefined,
        voicemailTranscript: voicemailStr != null && voicemailStr !== '' ? voicemailStr : undefined,
        voicemailCallerName: voicemailCallerName ?? undefined,
        voicemailPhoneNumber: optionalString(voicemailSection?.phone_number),
        voicemailTimestamp: voicemailTimestamp ?? undefined,
    };
}
