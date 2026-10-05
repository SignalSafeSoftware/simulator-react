import type { useDevicePage } from '../../hooks/device/useDevicePage.js';
import type { useVisiblePage } from '../../hooks/device/useVisiblePage.js';
import type { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import type { Secret } from '@signalsafe/simulator-core/apps/contracts';

export type Translate = ReturnType<typeof useSimulatorLocale>['t'];
export type SecretPage = ReturnType<typeof useDevicePage<'secrets'>>;
export type VisiblePage = ReturnType<typeof useVisiblePage>;
export type TypeLabels = Record<Secret['type'], string>;

export const FolderPage = Object.freeze({ Create: 'create', Delete: 'delete' } as const);
export type FolderPage = (typeof FolderPage)[keyof typeof FolderPage];
