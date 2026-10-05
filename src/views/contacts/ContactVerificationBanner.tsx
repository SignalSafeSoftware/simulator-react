import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { simSpacing, simTypo } from '../../simulatorStyles.js';
import {
    SIM_BORDER,
    SIM_ROUNDED_NONE,
    SIM_SURFACE_LIGHT,
    joinClasses,
} from '../../ui/styles/simulatorClasses.js';
import type { SimulatorSessionContact } from '../../types/session.js';

/** Match status for a name/number being verified against saved contacts. */
export function ContactVerificationBanner({
    matchingContact,
}: Readonly<{ matchingContact: SimulatorSessionContact | null }>) {
    const screenLocale = useSimulatorLocale();
    return (
        <div
            className={joinClasses(
                simTypo.secondaryTight,
                simSpacing.p2,
                SIM_ROUNDED_NONE,
                SIM_SURFACE_LIGHT,
                SIM_BORDER,
            )}
        >
            {matchingContact ? (
                <span>
                    <span className={simTypo.secondary}>
                        {screenLocale.t('screen.contactsView.matches.saved.contact')}
                    </span>
                    <strong>{matchingContact.displayName}</strong>
                    {matchingContact.number &&
                        screenLocale.t('screen.contactsView.value1', {
                            value1: String(matchingContact.number),
                        })}
                </span>
            ) : (
                <span className={simTypo.secondary}>
                    {screenLocale.t(
                        'screen.contactsView.no.match.in.contacts.for.this.number.or.name',
                    )}
                </span>
            )}
        </div>
    );
}
