import SimulatorWithSession from '@signalsafe/simulator-react/SimulatorWithSession';
import PhoneSimulatorShell from '@signalsafe/simulator-react/shell/PhoneSimulatorShell';
import { simulatorSessionReducer } from '@signalsafe/simulator-react/state/simulatorSessionReducer';
import { lintSimulatorPayload } from '@signalsafe/simulator-react/utils/payload/lintSimulatorPayload';
import { describe, expect, it } from 'vitest';

describe('package imports without react-bootstrap', () => {
    it('loads the public modules without react-bootstrap installed', async () => {
        expect(typeof SimulatorWithSession).toMatch(/^(function|object)$/);
        expect(typeof PhoneSimulatorShell).toMatch(/^(function|object)$/);
        expect(typeof simulatorSessionReducer).toBe('function');
        expect(typeof lintSimulatorPayload).toBe('function');
    });
});
