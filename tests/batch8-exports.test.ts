import { describe, expect, it } from 'vitest';

const BARREL_FUNCTIONS = [
    'simulatorSessionReducer',
    'simulatorSessionReducerWithLogging',
    'getInitialSessionState',
    'switchChannelAction',
    'templateDetailToPayload',
    'lintSimulatorPayload',
    'analyzeReachability',
    'applyPreviewFallback',
    'resolveScreen',
    'renderActiveScreen',
    'diffSimulatorPayloads',
    'getSimulatorCapabilities',
    'actionToInteractionEvent',
    'normalizeNameForMatch',
    'buildSimulatorNavGraph',
] as const;

const BARREL_COMPONENTS = [
    'SimulatorWithSession',
    'PhoneSimulatorShell',
    'SimulatorErrorBoundary',
    'SimulatorDeveloperToolsPanel',
    'SimulatorLintBanner',
    'PhoneIncomingScene',
] as const;

describe('Batch 8 main barrel exports', () => {
    it('exposes documented runtime functions and shell components', async () => {
        const barrel = await import('../src/index');

        for (const name of BARREL_FUNCTIONS) {
            expect(typeof barrel[name]).toBe('function');
        }
        for (const name of BARREL_COMPONENTS) {
            expect(barrel[name]).toBeTruthy();
        }
    });
});

describe('Batch 8 subpath exports', () => {
    it('loads validateSimulatorPayload subpath', async () => {
        const mod = await import('../src/utils/validateSimulatorPayload');
        expect(typeof mod.validateSimulatorPayload).toBe('function');
    });

    it('loads simulatorPreviewReport subpath', async () => {
        const mod = await import('../src/utils/simulatorPreviewReport');
        expect(typeof mod.buildSimulatorPreviewReport).toBe('function');
    });

    it('loads simulatorRealismChecks subpath', async () => {
        const mod = await import('../src/utils/simulatorRealismChecks');
        expect(typeof mod.runSimulatorRealismChecks).toBe('function');
    });

    it('loads previewFallbackWorld subpath', async () => {
        const mod = await import('../src/utils/previewFallbackWorld');
        expect(typeof mod.applyPreviewFallback).toBe('function');
        expect(typeof mod.PREVIEW_PLACEHOLDER_ID_PREFIX).toBe('string');
    });
});
