import type { ReactNode } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { SimulatorCapabilityState, type SimulatorCapability } from '../../contract/capabilities.js';
import { CapabilityButton } from '../../ui/controls/CapabilityButton.js';
import { SIM_BTN_OUTLINE } from '../../ui/styles/simulatorClasses.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';

const enabled: SimulatorCapability = { state: SimulatorCapabilityState.Enabled };

/** Edit and Delete icon buttons for a contact's detail screen; hosts add their own between them. */
export default function ContactDetailActions({
    onEdit,
    onDelete,
    deleteCapability = enabled,
    showDeleteReason = false,
    children,
}: Readonly<{
    onEdit: () => void;
    onDelete: () => void;
    deleteCapability?: SimulatorCapability;
    showDeleteReason?: boolean;
    children?: ReactNode;
}>) {
    const { t } = useSimulatorLocale();
    return (
        <>
            <button
                type='button'
                aria-label={t('contact.edit')}
                title={t('contact.edit')}
                className={SIM_BTN_OUTLINE}
                onClick={onEdit}
            >
                <Pencil size={18} aria-hidden='true' />
            </button>
            {children}
            <CapabilityButton
                type='button'
                capability={deleteCapability}
                showReason={showDeleteReason}
                aria-label={t('contact.delete')}
                title={t('contact.delete')}
                className={SIM_BTN_OUTLINE}
                onClick={onDelete}
            >
                <Trash2 size={18} aria-hidden='true' />
            </CapabilityButton>
        </>
    );
}
