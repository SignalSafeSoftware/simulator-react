import type { PhoneAppViewState, SimulatorPhonePayload } from '../types/session.js';
/** Preserve simulated voicemail deletion when hosts reconcile authored payloads. */
export function phoneSessionPayload(phone: SimulatorPhonePayload | null, view: PhoneAppViewState) {
    if (!phone || (!view.deletedVoicemailIds?.length && !view.singletonVoicemailDeleted))
        return phone;
    const deleted = new Set(view.deletedVoicemailIds);
    const remaining = phone.callHistory?.filter((entry) => !deleted.has(entry.id));
    const voicemail = view.singletonVoicemailDeleted
        ? undefined
        : remaining?.find((entry) => entry.callType === 'voicemail');
    return {
        ...phone,
        callHistory: remaining,
        voicemailTranscript: voicemail?.transcript,
        voicemailCallerName: voicemail?.name,
        voicemailTimestamp: voicemail?.timestamp,
        voicemailPhoneNumber: voicemail?.number,
    };
}
