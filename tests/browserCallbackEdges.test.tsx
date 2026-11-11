// @vitest-environment jsdom
import { expect, it, vi } from 'vitest';
import ScenarioBrowserWorkbench from '../src/apps/browser/ScenarioBrowserWorkbench';
import BrowserWorkbench from '../src/apps/browser/BrowserWorkbench';
import PhoneSimulatorView from '../src/views/phone/PhoneSimulatorView';
import PhoneVoicemailView from '../src/views/phone/PhoneVoicemailView';
import { renderWithAct, act } from './reactTestRenderer';
import { createState } from './support/reducerSupport';
import {
    BROWSER_ACTION_TYPE,
    BROWSER_ACTION_VERSION,
    type BrowserAction,
} from '@signalsafe/simulator-core/apps/browserProtocol';
it('validates workbench callbacks across absent pages and unresolved action targets', async () => {
    const action = vi.fn();
    const page = {
        id: 'one',
        url: 'https://example.test',
        title: 'Example',
        layout: 'landing' as const,
        buttons: [
            { label: 'Missing', targetPageId: 'missing' },
            { label: 'Same URL', href: 'https://example.test' },
        ],
    };
    const renderer = await renderWithAct(
        <ScenarioBrowserWorkbench payload={null} screen='one' onAction={action} />,
    );
    let child = renderer.root.findByType(BrowserWorkbench);
    const message = (name: string, pageId = 'one'): BrowserAction => ({
        type: BROWSER_ACTION_TYPE,
        version: BROWSER_ACTION_VERSION,
        session: 'test',
        pageId,
        action: name,
        event: 'click',
        values: {},
    });
    await act(async () => {
        child.props.onAction(message('unknown'));
        child.props.onNavigate({ id: 'missing' });
    });
    expect(action).not.toHaveBeenCalled();
    await act(async () =>
        renderer.update(
            <ScenarioBrowserWorkbench
                payload={{ defaultPageId: 'one', pages: [page] }}
                screen='one'
                onAction={action}
            />,
        ),
    );
    child = renderer.root.findByType(BrowserWorkbench);
    await act(async () => {
        child.props.onNavigate({ id: 'one' });
        child.props.onNavigate({ id: 'one' });
        child.props.onAction(message('unknown'));
        child.props.onAction(message('scenario-button:0'));
        child.props.onAction(message('scenario-download'));
        child.props.onAction(message('scenario-button:1'));
        child.props.onAction(message('unknown', 'missing'));
    });
    expect(action).toHaveBeenCalledWith(expect.objectContaining({ type: 'download_click' }));
    await act(async () => renderer.unmount());
});
it('preserves the authored voicemail back callback contract', async () => {
    const payload = {
        content: null,
        chosenIndex: null,
        callHistory: [
            { id: 'voice', callType: 'voicemail' as const, number: '', kind: 'voicemail' as const },
        ],
    };
    const dispatch = vi.fn();
    const state = createState({
        payload: { phone: payload },
        view: {
            activeApp: 'phone',
            phone: {
                screen: 'history',
                chosenIndex: null,
                stack: [],
                selectedHistoryEntryId: 'voice',
            },
        },
    });
    const renderer = await renderWithAct(
        <PhoneSimulatorView
            payload={payload}
            screen='history'
            phoneCapabilities={{ dial: true, voicemail: true, directory: false }}
            sessionState={state}
            sessionDispatch={dispatch}
            onNavigate={() => {}}
            onAction={() => {}}
        />,
    );
    await act(async () => renderer.root.findByType(PhoneVoicemailView).props.onBack());
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ entryId: null }));
    await act(async () => renderer.unmount());
});
