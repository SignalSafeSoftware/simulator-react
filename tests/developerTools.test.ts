import { describe, expect, it } from 'vitest';
import { reconcileVisibleDeveloperSections, resolveSimulatorDeveloperTools } from '../src/developerTools';

describe('resolveSimulatorDeveloperTools', () => {
    it('uses explicit sections when no preset is supplied', () => {
        const resolved = resolveSimulatorDeveloperTools({
            sections: { reachability: true },
        });

        expect(resolved.enabled).toBe(true);
        expect(resolved.sections.reachability).toBe(true);
        expect(resolved.sections.summary).toBe(false);
    });

    it('expands preview preset developer affordances', () => {
        const resolved = resolveSimulatorDeveloperTools({
            preset: 'preview',
            defaultExpanded: true,
        });

        expect(resolved.enabled).toBe(true);
        expect(resolved.defaultExpanded).toBe(true);
        expect(resolved.sections.summary).toBe(true);
        expect(resolved.sections.timeline).toBe(true);
        expect(resolved.sections.snapshotExport).toBe(true);
        expect(resolved.sections.navGraph).toBe(true);
        expect(resolved.sections.runtimeIssues).toBe(false);
    });

    it('lets explicit sections override preset defaults', () => {
        const resolved = resolveSimulatorDeveloperTools({
            preset: 'qa',
            sections: {
                timeline: false,
                runtimeIssues: true,
            },
        });

        expect(resolved.sections.timeline).toBe(false);
        expect(resolved.sections.runtimeIssues).toBe(true);
        expect(resolved.sections.snapshotExport).toBe(true);
    });

    it('turns every section off when explicitly disabled', () => {
        const resolved = resolveSimulatorDeveloperTools({
            preset: 'developer',
            enabled: false,
        });

        expect(resolved.enabled).toBe(false);
        expect(Object.values(resolved.sections).every((value) => value === false)).toBe(true);
    });

    it('falls back safely when runtime input provides an invalid preset', () => {
        const resolved = resolveSimulatorDeveloperTools({
            preset: 'bogus' as unknown as 'off',
        });

        expect(resolved.preset).toBe('off');
        expect(Object.values(resolved.sections).every((value) => value === false)).toBe(true);
    });

    it('preserves prior toggles for still-available sections while enabling new ones', () => {
        const visible = reconcileVisibleDeveloperSections(
            {
                summary: true,
                reachability: true,
                timeline: true,
                navGraph: false,
                snapshotExport: false,
                shortcuts: false,
                runtimeIssues: false,
            },
            {
                summary: false,
                reachability: true,
            }
        );

        expect(visible.summary).toBe(false);
        expect(visible.reachability).toBe(true);
        expect(visible.timeline).toBe(true);
        expect(visible.navGraph).toBe(false);
    });

    it('enables tools when any section is truthy and falls back safely for null previous visibility', () => {
        const resolved = resolveSimulatorDeveloperTools({
            sections: {
                shortcuts: true,
            },
        });

        expect(resolved.enabled).toBe(true);
        expect(resolved.sections.shortcuts).toBe(true);

        const visible = reconcileVisibleDeveloperSections(
            {
                summary: false,
                reachability: false,
                timeline: false,
                navGraph: false,
                snapshotExport: true,
                shortcuts: true,
                runtimeIssues: false,
            },
            null
        );
        expect(visible.snapshotExport).toBe(true);
        expect(visible.shortcuts).toBe(true);
    });

    it('defaults to the off preset when no tools config is provided', () => {
        const resolved = resolveSimulatorDeveloperTools();

        expect(resolved.preset).toBe('off');
        expect(resolved.enabled).toBe(false);
        expect(resolved.defaultExpanded).toBe(false);
        expect(Object.values(resolved.sections).every((value) => value === false)).toBe(true);
    });

    it('respects an explicit enabled flag even when no sections are active', () => {
        const resolved = resolveSimulatorDeveloperTools({
            enabled: true,
            sections: {},
        });

        expect(resolved.enabled).toBe(true);
        expect(Object.values(resolved.sections).every((value) => value === false)).toBe(true);
    });

    it('keeps unavailable sections hidden even when previous visibility requested them', () => {
        const visible = reconcileVisibleDeveloperSections(
            {
                summary: false,
                reachability: true,
                timeline: false,
                navGraph: false,
                snapshotExport: false,
                shortcuts: false,
                runtimeIssues: false,
            },
            {
                summary: true,
                reachability: false,
                timeline: true,
            }
        );

        expect(visible.summary).toBe(false);
        expect(visible.reachability).toBe(false);
        expect(visible.timeline).toBe(false);
    });
});
