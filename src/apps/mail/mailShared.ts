import type { useDevicePage } from '../../hooks/device/useDevicePage.js';
import type { useVisiblePage } from '../../hooks/device/useVisiblePage.js';
import type { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import type { Mail } from '@signalsafe/simulator-core/apps/contracts';

export type ReplyKind = 'reply' | 'reply-all' | 'forward';
export type MailFolder = Mail['folder'];
export type Translate = ReturnType<typeof useSimulatorLocale>['t'];
export type MailPage = ReturnType<typeof useDevicePage<'mail'>>;
export type VisiblePage = ReturnType<typeof useVisiblePage>;
