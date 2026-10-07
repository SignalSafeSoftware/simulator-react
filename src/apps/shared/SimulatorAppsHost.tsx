import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { SIM_INPUT } from '../../ui/styles/simulatorClasses.js';
import { createContext, useContext, useMemo, type ComponentType, type ReactNode } from 'react';
import type { PhotoMetadata } from '@signalsafe/simulator-core/apps/contracts';
import { checkLock, createLock } from '../lock/lock.js';
import { readAsset } from './assets.js';
import { extractPhotoMetadata } from '../photos/photoMetadata.js';
import { confirmInBrowser, copyToClipboard } from '../../utils/browser/browserEnvironment.js';
import { useRegionalDateTimeFormatter } from '../../contract/regionalPresentation.js';
import { formatPhotoCaptureDate } from '../photos/captureDate.js';
type SimulatorTranslate = ReturnType<typeof useSimulatorLocale>['t'];
export interface SimulatorAppNotesProps {
    label: string;
    placeholder: string;
    markdown: string;
    readOnly: boolean;
    onChange: (markdown: string, initialNormalization?: boolean) => void;
}
/** Layout and formatting the host can restyle. */
export interface SimulatorAppsPresentation {
    Shell: ComponentType<{ children: ReactNode; nav: ReactNode }>;
    NotesEditor: ComponentType<SimulatorAppNotesProps>;
    formatDate: (date: Date) => string;
    /** Receives the active locale's translator so the default label follows the host language. */
    formatCaptureDate: (metadata: PhotoMetadata, translate?: SimulatorTranslate) => string;
    renderPhotoMap?: (latitude: number, longitude: number) => ReactNode;
}
/** File and photo metadata reading. */
export interface SimulatorAppsAssets {
    readAsset: typeof readAsset;
    extractPhotoMetadata: typeof extractPhotoMetadata;
}
/** Device lock hashing and verification. */
export interface SimulatorAppsLock {
    checkLock: typeof checkLock;
    createLock: typeof createLock;
}
/** Browser capabilities the host can replace. */
export interface SimulatorAppsPlatform {
    confirm: (message: string) => boolean;
    copyText: (text: string) => Promise<void>;
}
export interface SimulatorAppsHost
    extends
        SimulatorAppsPresentation,
        SimulatorAppsAssets,
        SimulatorAppsLock,
        SimulatorAppsPlatform {}
const defaults: Omit<SimulatorAppsHost, 'formatDate' | 'formatCaptureDate'> = {
    Shell: ({ children, nav }) => (
        <>
            {children}
            {nav}
        </>
    ),
    NotesEditor: ({ label, markdown, readOnly, placeholder, onChange }) => (
        <label>
            {label}
            <textarea
                className={SIM_INPUT}
                value={markdown}
                readOnly={readOnly}
                placeholder={placeholder}
                onChange={(event) => onChange(event.target.value)}
            />
        </label>
    ),
    readAsset,
    extractPhotoMetadata,
    checkLock,
    createLock,
    confirm: confirmInBrowser,
    copyText: copyToClipboard,
};
const Context = createContext<Partial<SimulatorAppsHost>>({});
export function SimulatorAppsProvider({
    value,
    children,
}: Readonly<{
    value: Partial<SimulatorAppsHost>;
    children: ReactNode;
}>) {
    const inherited = useContext(Context);
    const merged = useMemo(() => ({ ...inherited, ...value }), [inherited, value]);
    return <Context.Provider value={merged}>{children}</Context.Provider>;
}
export function useSimulatorAppsHost(): SimulatorAppsHost {
    const overrides = useContext(Context);
    const regionalFormatDate = useRegionalDateTimeFormatter();
    const { t } = useSimulatorLocale();
    const formatDate = overrides.formatDate ?? regionalFormatDate;
    return useMemo(
        () => ({
            ...defaults,
            ...overrides,
            formatDate,
            formatCaptureDate:
                overrides.formatCaptureDate ??
                ((metadata: PhotoMetadata, translate: SimulatorTranslate = t) =>
                    formatPhotoCaptureDate(metadata, formatDate, translate)),
        }),
        [overrides, formatDate, t],
    );
}
