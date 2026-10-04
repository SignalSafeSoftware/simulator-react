/**
 * Phone Voicemail screen: optional caller/timestamp header + transcript + Back.
 */
import { SIM_PAGE_CONTENT } from '../../ui/styles/semanticSimulatorClasses.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { SimulatorDetailBackBar, SimulatorDetailBlock } from '../../ui/layout/SimulatorDetail.js';
import { simSpacing, simTypo } from '../../simulatorStyles.js';
import {
    SIM_FLEX_COL,
    SIM_TEXT_BODY,
    SIM_TEXT_MEDIUM,
    joinClasses,
} from '../../ui/styles/simulatorClasses.js';

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
                {(callerName != null || timestamp != null) && (
                    <div className={simTypo.secondaryTight}>
                        {callerName != null && (
                            <span className={joinClasses(SIM_TEXT_MEDIUM, SIM_TEXT_BODY)}>
                                {callerName}
                            </span>
                        )}
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
        </div>
    );
}
