import type { SimulatorCallType } from '@signalsafe/simulator-core/phoneCalls';
export interface AuthoredPhoneCallFields {
    callType?: SimulatorCallType;
    transcript?: string;
    avatarUrl?: string;
    callerTitle?: string;
}
export interface AuthoredPhonePayloadFields {
    unifiedCalls?: boolean;
}

export interface PhoneSessionMutationFields {
    deletedVoicemailIds?: string[];
    singletonVoicemailDeleted?: boolean;
}
