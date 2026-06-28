import { describe, expect, it } from 'vitest';

describe('package imports without react-bootstrap', () => {
    it('loads the public barrel without react-bootstrap installed', async () => {
        const pkg = await import('../src/index');
        expect(pkg.SimulatorWithSession).toBeTruthy();
        expect(pkg.PhoneSimulatorShell).toBeTruthy();
        expect(typeof pkg.simulatorSessionReducer).toBe('function');
        expect(typeof pkg.lintSimulatorPayload).toBe('function');
    });
});
