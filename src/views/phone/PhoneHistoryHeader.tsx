import { forwardRef } from 'react';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { simScreen, simSpacing } from '../../simulatorStyles.js';
import { joinClasses } from '../../ui/styles/simulatorClasses.js';

export interface PhoneHistoryHeaderProps {
    detail?: boolean;
}

/** Shared call-history banner; detail headings accept focus when a call opens. */
const PhoneHistoryHeader = forwardRef<HTMLHeadingElement, PhoneHistoryHeaderProps>(
    function PhoneHistoryHeader({ detail = false }, ref) {
        const { t } = useSimulatorLocale();
        return (
            <h2
                ref={ref}
                tabIndex={detail ? -1 : undefined}
                className={joinClasses(simScreen.header, simSpacing.sectionGap)}
            >
                {t(detail ? 'calls.details' : 'calls.history')}
            </h2>
        );
    },
);

export default PhoneHistoryHeader;
