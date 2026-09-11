import { describe, expect, it } from 'vitest';
import { resolveScreenOverride, type SimulatorScreenOverrides } from '../src/contract/screenOverrides.js';
import { getInitialSessionState } from '../src/state/simulatorSessionReducer.js';

describe('typed override resolution', () => {
    it('resolves exact destinations across apps without changing missing-screen defaults', () => {
        const Screen = () => null;
        const overrides: SimulatorScreenOverrides = {phone:{history:Screen},home:{settings:Screen},internet:{'custom-page':Screen},email:{compose:Screen},messages:{new_thread:Screen}};
        for (const entryPoint of [{app:'phone',screen:'history'},{app:'home',screen:'settings'},{app:'internet',screen:'custom-page'},{app:'email',screen:'compose'},{app:'messages',screen:'new_thread'}] as const) {
            const state=getInitialSessionState({channel:'phone',entryPoint});
            state.view.activeApp=entryPoint.app;
            state.view.phone.screen='history'; state.view.home.screen='settings';
            state.view.internet.screen='custom-page'; state.view.email.screen='compose'; state.view.messages.screen='new_thread';
            expect(resolveScreenOverride(overrides,state)).toBe(Screen);
            expect(resolveScreenOverride(undefined,state)).toBeUndefined();
        }
        expect(resolveScreenOverride(overrides,getInitialSessionState({channel:'home',entryPoint:{app:'home',screen:'home'}}))).toBeUndefined();
    });
});
