import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getInitialSessionState } from '../src/state/simulatorSessionReducer';
import { LEARNER_UNSUPPORTED_SCREEN_MESSAGE } from '../src/constants';
import { minimalPhoneWorld } from './support/fixtureWorlds';
import { collectBootstrapViolations } from './bootstrapClassDenylist';
import { TestRenderer, act } from './reactTestRenderer';

vi.mock('../src/shell/PhoneSimulatorShell', () => ({
    default: ({ children }: { children?: React.ReactNode }) =>
        React.createElement('div', { 'data-testid': 'simulator-shell' }, children),
}));

vi.mock('../src/SimulatorDeveloperToolsPanel', () => ({
    default: () => null,
}));

vi.mock('../src/views/ContactsView', () => ({
    default: () => React.createElement('div', { 'data-testid': 'default-contacts-view' }, 'default'),
}));

import SimulatorWithSession from '../src/SimulatorWithSession';

describe('SimulatorWithSession render slots', () => {
    let renderer: TestRenderer.ReactTestRenderer | null = null;

    afterEach(() => {
        renderer?.unmount();
        renderer = null;
    });

    it('passes renderChoice to the active screen and allows host-owned choice UI', async () => {
        const renderChoice = vi.fn((choice) =>
            React.createElement(
                'button',
                {
                    type: 'button',
                    'data-testid': 'host-choice',
                    onClick: choice.onClick,
                },
                choice.label,
            ),
        );
        const dispatch = vi.fn();
        const state = getInitialSessionState(minimalPhoneWorld());

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SimulatorWithSession, {
                    state,
                    dispatch,
                    renderChoice,
                }),
            );
        });

        expect(renderChoice).toHaveBeenCalled();
        const hostChoices = renderer!.root.findAllByProps({ 'data-testid': 'host-choice' });
        expect(hostChoices.length).toBeGreaterThanOrEqual(1);
        expect(hostChoices.some((node) => node.props.children === 'ANSWER')).toBe(true);
        expect(collectBootstrapViolations(renderer!.root)).toEqual([]);
    });

    it('passes renderFeedback to browser screens and allows host-owned feedback UI', async () => {
        const renderFeedback = vi.fn((feedback) =>
            React.createElement('div', { 'data-testid': 'host-feedback' }, feedback.message),
        );
        const dispatch = vi.fn();
        const state = getInitialSessionState({
            channel: 'browser',
            templateKey: 'browser-warning',
            name: 'Browser warning',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: { app: 'internet', screen: 'landing' },
            browser: {
                defaultPageId: 'landing',
                pages: [
                    {
                        id: 'landing',
                        url: 'https://example.test',
                        title: 'Landing',
                        layout: 'content',
                        content: 'Page body',
                        warningBanner: 'Verify the sender before clicking.',
                    },
                ],
            },
        });

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SimulatorWithSession, {
                    state,
                    dispatch,
                    renderFeedback,
                }),
            );
        });

        expect(renderFeedback).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'Verify the sender before clicking.' }),
        );
        expect(renderer!.root.findByProps({ 'data-testid': 'host-feedback' })).toBeTruthy();
    });

    it('uses renderContactsOverlay instead of the default contacts view', async () => {
        const renderContactsOverlay = vi.fn(({ contacts, onClose }) =>
            React.createElement(
                'div',
                { 'data-testid': 'host-contacts-overlay' },
                `${contacts.length} contacts`,
                React.createElement('button', { type: 'button', onClick: onClose }, 'Close'),
            ),
        );
        const dispatch = vi.fn();
        const state = getInitialSessionState(minimalPhoneWorld());
        state.view.contactsPanelOpen = true;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SimulatorWithSession, {
                    state,
                    dispatch,
                    renderContactsOverlay,
                }),
            );
        });

        expect(renderContactsOverlay).toHaveBeenCalledWith(
            expect.objectContaining({
                contacts: expect.any(Array),
                onClose: expect.any(Function),
            }),
        );
        expect(renderer!.root.findByProps({ 'data-testid': 'host-contacts-overlay' })).toBeTruthy();
        expect(renderer!.root.findAllByProps({ 'data-testid': 'default-contacts-view' })).toHaveLength(0);
    });
});
