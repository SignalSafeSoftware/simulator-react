import { describe, expect, it } from 'vitest';
import { SimulatorActions } from '../src/actions/simulatorActions';

describe('SimulatorActions', () => {
    it('builds typed action objects for the uncovered pure factories', () => {
        expect(SimulatorActions.openApp('internet')).toEqual({ type: 'open_app', app: 'internet' });
        expect(SimulatorActions.report()).toEqual({ type: 'report' });
        expect(SimulatorActions.checkContact()).toEqual({ type: 'check_contact' });
        expect(SimulatorActions.checkContacts()).toEqual({ type: 'check_contacts' });
        expect(SimulatorActions.switchChannel('browser')).toEqual({ type: 'switch_channel', channel: 'browser' });
    });
});
