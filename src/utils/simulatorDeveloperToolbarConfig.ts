/**
 * Developer toolbar labels and icons for SimulatorWithSession.
 */

import type { SimulatorDeveloperSectionKey } from '../developerTools.js';

export const DEVELOPER_TOOLBAR_LABELS: Record<SimulatorDeveloperSectionKey, string> = {
    summary: 'Summary',
    reachability: 'Reachability',
    timeline: 'Timeline',
    navGraph: 'Graph',
    snapshotExport: 'Snapshot',
    shortcuts: 'Shortcuts',
    runtimeIssues: 'Runtime issues',
};

export const DEVELOPER_TOOLBAR_ICONS: Record<SimulatorDeveloperSectionKey, string> = {
    summary: '≡',
    reachability: '⇢',
    timeline: '◷',
    navGraph: '⌁',
    snapshotExport: '⎘',
    shortcuts: '⌨',
    runtimeIssues: '⚠',
};
