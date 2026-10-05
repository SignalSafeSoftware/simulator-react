import { createTranslator, simulatorEnglish } from '../../i18n/catalog.js';
import type { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { SIM_INPUT } from '../../ui/styles/simulatorClasses.js';
import { createContext, useContext, useMemo, type ComponentType, type ReactNode } from 'react';
import type { PhotoMetadata } from '@signalsafe/simulator-core/apps/contracts';
import { checkLock, createLock } from '../lock/lock.js';
import { readAsset } from './assets.js';
import { extractPhotoMetadata } from '../photos/photoMetadata.js';
import { confirmInBrowser, copyToClipboard } from '../../utils/browser/browserEnvironment.js';
type SimulatorTranslate = ReturnType<typeof useSimulatorLocale>['t'];
const defaultTranslate: SimulatorTranslate = createTranslator(simulatorEnglish).t;
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
const defaults: SimulatorAppsHost = {
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
    formatDate: (date) => date.toLocaleString(),
    formatCaptureDate: (metadata, translate = defaultTranslate) =>
        metadata.capturedAt
            ? translate('app.photos.captureDate', {
                  when: metadata.capturedAt.replace('T', ' '),
                  zone: metadata.timeZone || translate('app.photos.captureZoneUnknown'),
              })
            : translate('app.photos.captureUnknown'),
    readAsset,
    extractPhotoMetadata,
    checkLock,
    createLock,
    confirm: confirmInBrowser,
    copyText: copyToClipboard,
};
const Context = createContext<SimulatorAppsHost>(defaults);
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
    return useContext(Context);
}
