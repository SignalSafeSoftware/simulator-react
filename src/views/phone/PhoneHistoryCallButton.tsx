import { Phone } from 'lucide-react';
import { SimulatorCapabilityState, useSimulatorCapabilities } from '../../contract/capabilities.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { CapabilityButton } from '../../ui/controls/CapabilityButton.js';
import { simBtnToneClass, SimulatorButtonTone } from '../../ui/styles/simulatorClasses.js';

/** The Call button on a call's detail page; the host's call capability decides if it is usable. */
export default function PhoneHistoryCallButton({
    onCall,
    disabled = false,
}: Readonly<{ onCall: () => void; disabled?: boolean }>) {
    const { t } = useSimulatorLocale();
    const capability = useSimulatorCapabilities().call ?? {
        state: SimulatorCapabilityState.Enabled,
    };
    return (
        <CapabilityButton
            type='button'
            className={simBtnToneClass(SimulatorButtonTone.NeutralOutline)}
            capability={capability}
            disabled={disabled}
            onClick={onCall}
        >
            <Phone size={18} aria-hidden='true' /> {t('screen.phoneSimulatorView.call')}
        </CapabilityButton>
    );
}
