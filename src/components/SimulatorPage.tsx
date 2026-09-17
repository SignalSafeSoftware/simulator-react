import type { HTMLAttributes, ReactNode } from 'react';
import { useSimulatorLocale } from '../i18n/SimulatorLocale.js';

export interface SimulatorPageProps extends HTMLAttributes<HTMLElement> {
    as?: 'div' | 'section';
    header?: ReactNode;
    footer?: ReactNode;
    children: ReactNode;
}

/** Shared slots without an extra scroll container. The device owns the navigation footer. */
export function SimulatorPage({
    as: Element = 'div',
    header,
    footer,
    children,
    lang,
    ...props
}: Readonly<SimulatorPageProps>) {
    const { locale } = useSimulatorLocale();
    return (
        <Element {...props} lang={lang ?? locale} data-simulator-page="true">
            {header}
            {children}
            {footer}
        </Element>
    );
}
