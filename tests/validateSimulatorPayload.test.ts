import { describe, expect, it } from 'vitest';
import { validateSimulatorPayload } from '../src/utils/validateSimulatorPayload';

describe('validateSimulatorPayload', () => {
    it('accepts a valid email payload', () => {
        expect(() => validateSimulatorPayload({ channel: 'email' })).not.toThrow();
    });

    it('accepts less common supported channels', () => {
        expect(() => validateSimulatorPayload({ channel: 'contacts' })).not.toThrow();
        expect(() => validateSimulatorPayload({ channel: 'home' })).not.toThrow();
    });

    it('throws when payload is null', () => {
        expect(() => validateSimulatorPayload(null)).toThrow('payload is missing or not an object');
    });

    it('throws when payload is not an object', () => {
        expect(() => validateSimulatorPayload('email')).toThrow('payload is missing or not an object');
    });

    it('throws when channel is unsupported', () => {
        expect(() => validateSimulatorPayload({ channel: 'pager' })).toThrow('channel must be one of');
    });
});
