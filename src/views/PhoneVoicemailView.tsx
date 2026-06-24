/**
 * Phone Voicemail screen: optional caller/timestamp header + transcript + Back.
 */
import { SimulatorDetailBackBar, SimulatorDetailBlock } from '../components/SimulatorDetail';
import { simTypo } from '../simulatorStyles';

export interface PhoneVoicemailViewProps {
    transcript: string;
    onBack: () => void;
    /** Optional caller name for header (e.g. from payload.voicemailCallerName). */
    callerName?: string | null;
    /** Optional timestamp for header (e.g. "Today 10:15 AM"). */
    timestamp?: string | null;
}

export default function PhoneVoicemailView({
    transcript,
    onBack,
    callerName,
    timestamp,
}: Readonly<PhoneVoicemailViewProps>) {
    return (
        <div className="d-flex flex-column">
            <SimulatorDetailBackBar onBack={onBack} title="Voicemail" ariaLabel="Back" titleOnly />
            {(callerName != null || timestamp != null) && (
                <div className={simTypo.secondaryTight}>
                    {callerName != null && <span className="fw-medium text-body">{callerName}</span>}
                    {callerName != null && timestamp != null && ' · '}
                    {timestamp != null && <span>{timestamp}</span>}
                </div>
            )}
            <SimulatorDetailBlock>
                <pre
                    className={`mb-0 ${simTypo.bodySmall}`}
                    style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}
                >
                    {transcript}
                </pre>
            </SimulatorDetailBlock>
        </div>
    );
}
