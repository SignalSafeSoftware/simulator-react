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
        voicemailTimestamp: voicemailTimestamp ?? undefined,
    };
}
