import { simulatorSessionReducer } from '@signalsafe/simulator-react/state/simulatorSessionReducer';
import { simulatorSessionReducerWithLogging } from '@signalsafe/simulator-react/state/simulatorSessionReducer';
import { getInitialSessionState } from '@signalsafe/simulator-react/state/simulatorSessionInitialState';
import { switchChannelAction } from '@signalsafe/simulator-react/state/simulatorDispatchActions';
import { templateDetailToPayload } from '@signalsafe/simulator-react/adapters/templateToSession';
import { lintSimulatorPayload } from '@signalsafe/simulator-react/utils/payload/lintSimulatorPayload';
import { analyzeReachability } from '@signalsafe/simulator-react/utils/navigation/simulatorReachability';
import { applyPreviewFallback } from '@signalsafe/simulator-react/utils/preview/previewFallbackWorld';
import { resolveScreen } from '@signalsafe/simulator-react/screenRegistry/registry';
import { renderActiveScreen } from '@signalsafe/simulator-react/screenRegistry/registry';
import { diffSimulatorPayloads } from '@signalsafe/simulator-react/utils/payload/simulatorPayloadDiff';
import { getSimulatorCapabilities } from '@signalsafe/simulator-react/utils/payload/simulatorCapabilities';
import { actionToInteractionEvent } from '@signalsafe/simulator-react/utils/telemetry/simulatorEventMapper';
import { normalizeNameForMatch } from '@signalsafe/simulator-react/utils/payload/contactNormalization';
import { buildSimulatorNavGraph } from '@signalsafe/simulator-react/utils/navigation/simulatorNavGraph';
import SimulatorWithSession from '@signalsafe/simulator-react/SimulatorWithSession';
import PhoneSimulatorShell from '@signalsafe/simulator-react/shell/PhoneSimulatorShell';
import SimulatorErrorBoundary from '@signalsafe/simulator-react/SimulatorErrorBoundary';
import SimulatorDeveloperToolsPanel from '@signalsafe/simulator-react/developer-tools/SimulatorDeveloperToolsPanel';
import SimulatorLintBanner from '@signalsafe/simulator-react/developer-tools/SimulatorLintBanner';
import PhoneIncomingScene from '@signalsafe/simulator-react/views/phone/PhoneIncomingScene';
const publicValues = {
    simulatorSessionReducer,
    simulatorSessionReducerWithLogging,
    getInitialSessionState,
    switchChannelAction,
    templateDetailToPayload,
    lintSimulatorPayload,
    analyzeReachability,
    applyPreviewFallback,
    resolveScreen,
    renderActiveScreen,
    diffSimulatorPayloads,
    getSimulatorCapabilities,
    actionToInteractionEvent,
    normalizeNameForMatch,
    buildSimulatorNavGraph,
    SimulatorWithSession,
    PhoneSimulatorShell,
    SimulatorErrorBoundary,
    SimulatorDeveloperToolsPanel,
    SimulatorLintBanner,
    PhoneIncomingScene,
};
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

describe('Batch 8 owner module exports', () => {
    it('exposes documented runtime functions and shell components', async () => {
        for (const name of BARREL_FUNCTIONS) {
            expect(typeof publicValues[name]).toBe('function');
        }
        for (const name of BARREL_COMPONENTS) {
            expect(publicValues[name]).toBeTruthy();
        }
    });
});

describe('Batch 8 subpath exports', () => {
    it('loads validateSimulatorPayload subpath', async () => {
        const mod = await import('../src/utils/payload/validateSimulatorPayload.js');
        expect(typeof mod.validateSimulatorPayload).toBe('function');
    });

    it('loads simulatorPreviewReport subpath', async () => {
        const mod = await import('../src/utils/preview/simulatorPreviewReport.js');
        expect(typeof mod.buildSimulatorPreviewReport).toBe('function');
    });

    it('loads simulatorRealismChecks subpath', async () => {
        const mod = await import('../src/utils/payload/simulatorRealismChecks.js');
        expect(typeof mod.runSimulatorRealismChecks).toBe('function');
    });

    it('loads previewFallbackWorld subpath', async () => {
        const mod = await import('../src/utils/preview/previewFallbackWorld.js');
        expect(typeof mod.applyPreviewFallback).toBe('function');
        expect(typeof mod.PREVIEW_PLACEHOLDER_ID_PREFIX).toBe('string');
    });
});
