import type { TreeSpecIssue } from '@signalsafe/tree-spec';

export type SimulatorDeveloperPreset = 'off' | 'preview' | 'qa' | 'developer';

export type SimulatorDeveloperSectionKey =
    | 'summary'
    | 'reachability'
    | 'timeline'
    | 'navGraph'
    | 'snapshotExport'
    | 'shortcuts'
    | 'runtimeIssues';

export type SimulatorDeveloperSections = {
    summary?: boolean;
    reachability?: boolean;
    timeline?: boolean;
    navGraph?: boolean;
    snapshotExport?: boolean;
    shortcuts?: boolean;
    runtimeIssues?: boolean;
};

export type SimulatorDeveloperTools = {
    preset?: SimulatorDeveloperPreset;
    enabled?: boolean;
    defaultExpanded?: boolean;
    sections?: SimulatorDeveloperSections;
};

interface ResolvedSimulatorDeveloperTools {
    preset: SimulatorDeveloperPreset;
    enabled: boolean;
    defaultExpanded: boolean;
    sections: Required<SimulatorDeveloperSections>;
}

export type SimulatorRuntimeIssue = TreeSpecIssue;

export const EMPTY_DEVELOPER_SECTIONS: Required<SimulatorDeveloperSections> = {
    summary: false,
    reachability: false,
    timeline: false,
    navGraph: false,
    snapshotExport: false,
    shortcuts: false,
    runtimeIssues: false,
};

const PRESET_SECTIONS: Record<SimulatorDeveloperPreset, Required<SimulatorDeveloperSections>> = {
    off: { ...EMPTY_DEVELOPER_SECTIONS },
    preview: {
        ...EMPTY_DEVELOPER_SECTIONS,
        summary: true,
        reachability: true,
        timeline: true,
        navGraph: true,
        snapshotExport: true,
        shortcuts: true,
    },
    qa: {
        ...EMPTY_DEVELOPER_SECTIONS,
        reachability: true,
        timeline: true,
        navGraph: true,
        snapshotExport: true,
        shortcuts: true,
    },
    developer: {
        summary: true,
        reachability: true,
        timeline: true,
        navGraph: true,
        snapshotExport: true,
        shortcuts: true,
        runtimeIssues: true,
    },
};

function isDeveloperPreset(value: unknown): value is SimulatorDeveloperPreset {
    return value === 'off' || value === 'preview' || value === 'qa' || value === 'developer';
}

function normalizeSections(sections?: SimulatorDeveloperSections): Required<SimulatorDeveloperSections> {
    return {
        ...EMPTY_DEVELOPER_SECTIONS,
        ...sections,
    };
}

function hasEnabledSections(sections: Required<SimulatorDeveloperSections> | null | undefined): boolean {
    return Object.values(sections ?? EMPTY_DEVELOPER_SECTIONS).some(Boolean);
}

export function reconcileVisibleDeveloperSections(
    available: Required<SimulatorDeveloperSections>,
    previous?: Partial<Record<SimulatorDeveloperSectionKey, boolean>> | null
): Required<SimulatorDeveloperSections> {
    return {
        summary: available.summary && (previous?.summary ?? true),
        reachability: available.reachability && (previous?.reachability ?? true),
        timeline: available.timeline && (previous?.timeline ?? true),
        navGraph: available.navGraph && (previous?.navGraph ?? true),
        snapshotExport: available.snapshotExport && (previous?.snapshotExport ?? true),
        shortcuts: available.shortcuts && (previous?.shortcuts ?? true),
        runtimeIssues: available.runtimeIssues && (previous?.runtimeIssues ?? true),
    };
}

export function resolveSimulatorDeveloperTools(tools?: SimulatorDeveloperTools): ResolvedSimulatorDeveloperTools {
    const rawPreset = tools?.preset;
    const preset = isDeveloperPreset(rawPreset) ? rawPreset : 'off';
    const sections = normalizeSections({
        ...PRESET_SECTIONS[preset],
        ...tools?.sections,
    });
    const enabled = tools?.enabled ?? hasEnabledSections(sections);
    return {
        preset,
        enabled,
        defaultExpanded: tools?.defaultExpanded ?? false,
        sections: enabled ? sections : { ...EMPTY_DEVELOPER_SECTIONS },
    };
}
