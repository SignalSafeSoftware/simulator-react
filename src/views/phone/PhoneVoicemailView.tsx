/**
 * Phone Voicemail screen: optional caller/timestamp header + transcript + Back.
 */
import { Trash2 } from 'lucide-react';
import { SIM_PAGE_CONTENT } from '../../ui/styles/semanticSimulatorClasses.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { SimulatorDetailBackBar } from '../../ui/layout/SimulatorDetail.js';
import { SimulatorButton } from '../../ui/primitives.js';
import { SIM_FLEX_COL, SimulatorButtonTone } from '../../ui/styles/simulatorClasses.js';
import PhoneHistoryDetail from './PhoneHistoryDetail.js';

export interface PhoneVoicemailViewProps {
    transcript: string;
    onBack: () => void;
    onDelete?: () => void;
    /** Optional caller name for header (e.g. from payload.voicemailCallerName). */
    callerName?: string | null;
    phoneNumber?: string | null;
    /** Optional timestamp for header (e.g. "Today 10:15 AM"). */
    timestamp?: string | null;
}

export default function PhoneVoicemailView({
    transcript,
    onBack,
    onDelete,
    callerName,
    phoneNumber,
    timestamp,
}: Readonly<PhoneVoicemailViewProps>) {
    const screenLocale = useSimulatorLocale();

    return (
        <div className={SIM_FLEX_COL}>
            <SimulatorDetailBackBar
                onBack={onBack}
                title={screenLocale.t('screen.phoneVoicemailView.voicemail')}
                ariaLabel={screenLocale.t('a11y.back')}
                titleOnly
            />
            <div className={SIM_PAGE_CONTENT}>
                <PhoneHistoryDetail
                    caller={callerName || phoneNumber || screenLocale.t('value.unknown')}
                    number={phoneNumber || undefined}
                    timestamp={timestamp || screenLocale.t('calls.dateUnknown')}
                    actions={
                        onDelete && (
                            <SimulatorButton
                                tone={SimulatorButtonTone.Danger}
                                aria-label={screenLocale.t('calls.deleteVoicemail')}
                                title={screenLocale.t('calls.deleteVoicemail')}
                                onClick={onDelete}
                            >
                                <Trash2 size={20} aria-hidden='true' />
                            </SimulatorButton>
                        )
                    }
                >
                    <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{transcript}</p>
                </PhoneHistoryDetail>
            </div>
        </div>
    );
}
