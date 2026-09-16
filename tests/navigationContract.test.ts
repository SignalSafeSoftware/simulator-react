import { describe, expect, it, vi } from 'vitest';
import { createSimulatorNavigationDispatch } from '../src/contract/navigation.js';
import { getInitialSessionState, simulatorSessionReducer } from '../src/state/simulatorSessionReducer.js';
import type { SimulatorDispatchAction } from '../src/state/simulatorDispatchActions.js';

const initial = () => getInitialSessionState({ channel: 'phone', entryPoint: { app: 'phone', screen: 'history' } });
describe('one navigation contract', () => {
    it('normalizes local and screen-action entry points and preserves identical back stacks', () => {
        const actions: SimulatorDispatchAction[] = [
            { type: 'NAV_LOCAL', app: 'phone', screen: 'contacts' },
            { type: 'SIMULATOR_ACTION', action: { type: 'navigate_screen', app: 'phone', screen: 'contacts' } },
        ];
        const results = actions.map((action) => {
            let state = initial();
            const events = vi.fn();
            const dispatch = createSimulatorNavigationDispatch({ getState: () => state,
                dispatch: (next) => { state = simulatorSessionReducer(state, next); }, onNavigationEvent: events });
            dispatch(action);
            dispatch(action);
            expect(state.view.phone.stack).toEqual(['history']);
            dispatch({ type: 'BACK' });
            expect(state.view.phone.screen).toBe('contacts');
            expect(state.view.showPrimaryMenu).toBe(true);
            return events.mock.calls;
        });
        expect(results[0]).toEqual(results[1]);
    });
    it('handled navigation leaves package state and stack untouched, while void delegates', () => {
        const dispatch = vi.fn();
        const observe = vi.fn();
        const handler = vi.fn(() => 'handled' as const);
        const send = createSimulatorNavigationDispatch({getState: initial, dispatch, onNavigation: handler, onNavigationEvent: observe});
        send({ type: 'NAV_LOCAL', app: 'phone', screen: 'contacts' });
        expect(dispatch).not.toHaveBeenCalled();
        expect(observe).toHaveBeenCalledWith(expect.objectContaining({ disposition: 'handled' }));
        send({ type: 'PHONE_CHOOSE', index: 0 });
        expect(handler).toHaveBeenCalledTimes(1);
        expect(dispatch).toHaveBeenCalledTimes(1);
        createSimulatorNavigationDispatch({getState: initial, dispatch})({type: 'BACK'});
        expect(dispatch).toHaveBeenCalledTimes(2);
    });
    it('does not dispatch when host interception throws', () => {
        const dispatch = vi.fn();
        const send = createSimulatorNavigationDispatch({getState: initial, dispatch, onNavigation: () => { throw new Error('host failure'); }});
        expect(() => send({type: 'BACK'})).toThrow('host failure');
        expect(dispatch).not.toHaveBeenCalled();
    });
    it('normalizes app switching and Settings screen actions independent of entry point', () => {
        const state = getInitialSessionState({channel:'home',entryPoint:{app:'home',screen:'home'}});
        const onNavigation = vi.fn(() => 'handled' as const);
        const send = createSimulatorNavigationDispatch({getState: () => state, dispatch:vi.fn(), onNavigation});
        send({type:'SWITCH_APP',app:'phone'});
        send({type:'SIMULATOR_ACTION', action:{type:'open_app',app:'phone'}});
        expect(onNavigation.mock.calls[0]).toEqual(onNavigation.mock.calls[1]);
        send({type:'NAV_LOCAL',app:'home',screen:'settings'});
        send({type:'SIMULATOR_ACTION',action:{type:'navigate_screen',app:'home',screen:'settings'}});
        expect(onNavigation.mock.calls[2]).toEqual(onNavigation.mock.calls[3]);
        for (const type of ['BACK','CANCEL','BACK_TO_PRIMARY'] as const) send({type});
        expect(onNavigation).toHaveBeenCalledTimes(7);
    });

});
