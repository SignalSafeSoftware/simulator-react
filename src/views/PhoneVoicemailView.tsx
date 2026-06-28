/**
 * Phone Voicemail screen: optional caller/timestamp header + transcript + Back.
 */
import { SimulatorDetailBackBar, SimulatorDetailBlock } from '../components/SimulatorDetail.js';
import { simSpacing, simTypo } from '../simulatorStyles.js';
import { joinClasses, SIM_TEXT_BODY, SIM_TEXT_MEDIUM } from '../ui/simulatorClasses.js';

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
        <div className="simulator-flex simulator-flex--column">
            <SimulatorDetailBackBar onBack={onBack} title="Voicemail" ariaLabel="Back" titleOnly />
            {(callerName != null || timestamp != null) && (
                <div className={simTypo.secondaryTight}>
                    {callerName != null && <span className={joinClasses(SIM_TEXT_MEDIUM, SIM_TEXT_BODY)}>{callerName}</span>}
                    {callerName != null && timestamp != null && ' · '}
                    {timestamp != null && <span>{timestamp}</span>}
                </div>
            )}
            <SimulatorDetailBlock>
                <pre
                    className={joinClasses(simSpacing.mb0, simTypo.bodySmall)}
                    style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}
                >
                    {transcript}
                </pre>
            </SimulatorDetailBlock>
        </div>
    );
}
