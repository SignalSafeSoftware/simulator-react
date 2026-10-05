import { describe, expect, it } from 'vitest';
import { SimulatorApp } from '@signalsafe/simulator-core/simulatorApp';
import { channelToApp, viewStateToActiveChannel } from '../src/types/session';
import { getDefaultScreen, parseEntryScreen } from '../src/state/simulatorViewStateHelpers';
import { ownValue } from '../src/utils/lookup';

describe('ownValue', () => {
    it('returns own entries and ignores inherited keys', () => {
        const table = { known: 1 };
        expect(ownValue(table, 'known')).toBe(1);
        expect(ownValue(table, 'constructor')).toBeUndefined();
        expect(ownValue(table, 'missing')).toBeUndefined();
    });
});

describe('app lookup tables with untrusted ids', () => {
    it('fall back instead of returning inherited object members', () => {
        expect(channelToApp('constructor' as never)).toBe(SimulatorApp.Email);
        expect(viewStateToActiveChannel('toString' as never)).toBe('email');
        expect(getDefaultScreen('valueOf' as never)).toBe(getDefaultScreen(SimulatorApp.Email));
        expect(parseEntryScreen('constructor' as never, 'x')).toBe(
            getDefaultScreen(SimulatorApp.Email),
        );
    });
});
