import { createContext, useContext, useMemo, type ReactNode } from 'react';
import {
    createTranslator,
    simulatorEnglish,
    type Catalog,
    type LocaleOptions,
    type SimulatorMessageKey,
} from './catalog.js';

const LocaleContext = createContext(createTranslator(simulatorEnglish));

export interface SimulatorLocaleProviderProps extends LocaleOptions {
    messages?: Partial<Catalog<SimulatorMessageKey>>;
    children: ReactNode;
}

export function SimulatorLocaleProvider({
    children,
    messages,
    locale = 'en',
    timeZone,
}: SimulatorLocaleProviderProps) {
    const value = useMemo(
        () => createTranslator(simulatorEnglish, messages, { locale, timeZone }),
        [messages, locale, timeZone],
    );
    return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useSimulatorLocale() {
    return useContext(LocaleContext);
}
