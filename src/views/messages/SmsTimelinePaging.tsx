import type { SimulatorTimelinePaging } from '../../contract/hostListSlots.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { SIM_BTN_OUTLINE } from '../../ui/styles/simulatorClasses.js';

export function SmsTimelinePaging({
    paging,
    onLoadEarlier,
}: Readonly<{
    paging?: SimulatorTimelinePaging;
    onLoadEarlier: () => void;
}>) {
    const { t } = useSimulatorLocale();
    if (!paging || (!paging.hasMore && !paging.error)) return null;
    return (
        <div>
            {paging.error && <p role='alert'>{paging.error}</p>}
            <button
                type='button'
                className={SIM_BTN_OUTLINE}
                disabled={paging.loading}
                onClick={onLoadEarlier}
            >
                {t(
                    paging.loading
                        ? 'messages.loadingEarlier'
                        : paging.error
                          ? 'messages.retryEarlier'
                          : 'messages.loadEarlier',
                )}
            </button>
        </div>
    );
}
