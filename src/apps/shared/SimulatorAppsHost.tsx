import { SIM_INPUT } from '../../ui/styles/simulatorClasses.js';
import { createContext, useContext, type ComponentType, type ReactNode } from 'react';
import type { PhotoMetadata } from '@signalsafe/simulator-core/apps/contracts';
import { checkLock, createLock } from '../lock/lock.js';
import { readAsset } from './assets.js';
import { extractPhotoMetadata } from '../photos/photoMetadata.js';
export interface SimulatorAppNotesProps {
    label: string;
    placeholder: string;
    markdown: string;
    readOnly: boolean;
    onChange: (markdown: string, initialNormalization?: boolean) => void;
}
export interface SimulatorAppsHost {
    Shell: ComponentType<{ children: ReactNode; nav: ReactNode }>;
    NotesEditor: ComponentType<SimulatorAppNotesProps>;
    formatDate: (date: Date) => string;
    formatCaptureDate: (metadata: PhotoMetadata) => string;
    readAsset: typeof readAsset;
    extractPhotoMetadata: typeof extractPhotoMetadata;
    renderPhotoMap?: (latitude: number, longitude: number) => ReactNode;
    checkLock: typeof checkLock;
    createLock: typeof createLock;
}
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
    formatCaptureDate: (metadata) =>
        metadata.capturedAt
            ? `${metadata.capturedAt.replace('T', ' ')} (${metadata.timeZone || 'capture time zone unknown'})`
            : 'Unknown capture date',
    readAsset,
    extractPhotoMetadata,
    checkLock,
    createLock,
};
const Context = createContext<SimulatorAppsHost>(defaults);
export function SimulatorAppsProvider({
    value,
    children,
}: {
    value: Partial<SimulatorAppsHost>;
    children: ReactNode;
}) {
    const inherited = useContext(Context);
    return <Context.Provider value={{ ...inherited, ...value }}>{children}</Context.Provider>;
}
export function useSimulatorAppsHost(): SimulatorAppsHost {
    return useContext(Context);
}
