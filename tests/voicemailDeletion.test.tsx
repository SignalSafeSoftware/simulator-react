import { updateSimulatorPayload } from '../src/datasource/datasource';
import React from 'react';
import { expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { TestRenderer, act } from './reactTestRenderer';
import { createPayload } from './support/createPayload';
import { getInitialSessionState } from '../src/state/simulatorSessionInitialState';
import { simulatorSessionReducer } from '../src/state/simulatorSessionReducer';
import { SimulatorDispatchActionType } from '../src/state/simulatorDispatchActions';
import { authoredPhoneCall, voicemailDeletion } from '../src/views/phone/authoredPhoneCall';
import { mapPhone } from '../src/adapters/device/phoneMapper';

it('deletes only the selected voicemail, returns to history and preserves the source', () => {
    const phone = mapPhone({
        calls: [
            { id: 'a', type: 'voicemail', transcript: 'First' },
            { id: 'b', type: 'voicemail', transcript: 'Second' },
            { id: 'c', type: 'received' },
        ],
    });
    const state = getInitialSessionState({ ...createPayload(), phone });
    const next = simulatorSessionReducer(state, {
        type: SimulatorDispatchActionType.DeleteVoicemail,
        entryId: 'b',
    });
    expect(next.payload.phone?.callHistory?.map((call) => call.id)).toEqual(['a', 'c']);
    expect(state.payload.phone?.callHistory).toHaveLength(3);
    expect(next.payload.phone?.voicemailTranscript).toBe('First');
    expect(
        updateSimulatorPayload(next, state.payload).payload.phone?.callHistory?.map(
            (call) => call.id,
        ),
    ).toEqual(['a', 'c']);
    expect(next.view.phone).toMatchObject({ screen: 'history', selectedHistoryEntryId: null });
    expect(
        simulatorSessionReducer(state, {
            type: SimulatorDispatchActionType.DeleteVoicemail,
            entryId: 'c',
        }),
    ).toBe(state);
    expect(
        simulatorSessionReducer(state, {
            type: SimulatorDispatchActionType.DeleteVoicemail,
            entryId: 'missing',
        }),
    ).toBe(state);
});

it('formats voicemail dates and wires an accessible delete icon to the selected id', async () => {
    const phone = mapPhone({
        calls: [
            {
                id: 'b',
                type: 'voicemail',
                name: 'Caller',
                number: '123',
                timestamp: '2026-11-18T15:11:28.000Z',
                transcript: 'Second',
            },
        ],
    });
    const dispatch = vi.fn();
    const selected = authoredPhoneCall(phone, 'b', () => {}, null, voicemailDeletion(dispatch));
    const html = renderToStaticMarkup(selected.voicemail);
    expect(html).not.toContain('2026-11-18T15:11:28.000Z');
    expect(html).not.toContain('<pre');
    expect(html).toContain('Delete voicemail');
    let renderer: ReturnType<typeof TestRenderer.create>;
    await act(async () => {
        renderer = TestRenderer.create(<>{selected.voicemail}</>);
    });
    await act(async () => {
        renderer.root.findByProps({ 'aria-label': 'Delete voicemail' }).props.onClick();
    });
    expect(dispatch).toHaveBeenCalledWith({
        type: SimulatorDispatchActionType.DeleteVoicemail,
        entryId: 'b',
    });
    await act(async () => {
        renderer.unmount();
    });
});

it('removes a legacy singleton voicemail without removing unrelated history', () => {
    const state = getInitialSessionState({
        ...createPayload(),
        phone: { content: null, chosenIndex: null, voicemailTranscript: 'Legacy', callHistory: [] },
    });
    const next = simulatorSessionReducer(state, {
        type: SimulatorDispatchActionType.DeleteVoicemail,
        entryId: null,
    });
    expect(next.payload.phone?.voicemailTranscript).toBeUndefined();
    expect(state.payload.phone?.voicemailTranscript).toBe('Legacy');
});
