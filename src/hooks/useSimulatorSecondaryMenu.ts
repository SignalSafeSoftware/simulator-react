/**
 * Secondary menu config for phone/email shell in SimulatorWithSession.
 */

import { useMemo } from 'react';
import type { SimulatorDispatchAction } from '../state/simulatorSessionReducer.js';
import type { SimulatorSessionState } from '../types/session.js';
import type { SimulatorCapabilities } from '../utils/simulatorCapabilities.js';
import { getPhoneLocalNavItems } from '../utils/phoneLocalNavItems.js';
import {
    EMAIL_SECONDARY_ITEMS,
    getEmailSecondaryActiveId,
    getPhoneSecondaryActiveId,
} from '../utils/simulatorSecondaryMenuHelpers.js';

export interface SimulatorSecondaryMenuConfig {
    items: Array<{ id: string; label: string; icon: string }>;
    activeId: string;
    onSelect: (id: string) => void;
    onSecondaryBack: () => void;
}

export function useSimulatorSecondaryMenu(
    view: SimulatorSessionState['view'],
    dispatch: (action: SimulatorDispatchAction) => void,
    phoneCapabilities: SimulatorCapabilities['phone']
): SimulatorSecondaryMenuConfig | undefined {
    const activeApp = view.activeApp;
    const showSecondaryMenu = !view.showPrimaryMenu && (activeApp === 'phone' || activeApp === 'email');

    return useMemo(() => {
        if (!showSecondaryMenu) return undefined;
        if (activeApp === 'phone') {
            const items = getPhoneLocalNavItems(phoneCapabilities).map((item) => ({
                id: item.id,
                label: item.label,
                icon: item.icon,
            }));
            return {
                items,
                activeId: getPhoneSecondaryActiveId(view.phone.screen),
                onSelect: (id: string) => {
                    if (id !== 'back') {
                        dispatch({ type: 'NAV_LOCAL', app: 'phone', screen: id });
                    }
                },
                onSecondaryBack: () => dispatch({ type: 'BACK_TO_PRIMARY' }),
            };
        }
        return {
            items: EMAIL_SECONDARY_ITEMS.map((item) => ({ id: item.id, label: item.label, icon: item.icon })),
            activeId: getEmailSecondaryActiveId(view.email.screen, view.email.stack),
            onSelect: (id: string) => {
                if (id !== 'back') {
                    dispatch({ type: 'NAV_LOCAL', app: 'email', screen: id });
                }
            },
            onSecondaryBack: () => dispatch({ type: 'BACK_TO_PRIMARY' }),
        };
    }, [
        showSecondaryMenu,
        activeApp,
        view.phone.screen,
        view.email.screen,
        view.email.stack,
        phoneCapabilities,
        dispatch,
    ]);
}
