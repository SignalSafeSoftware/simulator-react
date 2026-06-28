import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import PhoneSimulatorShell from '../src/shell/PhoneSimulatorShell';
import PhoneDialView from '../src/views/PhoneDialView';
import EmailInboxList from '../src/views/EmailInboxList';
import { TestRenderer, act } from './reactTestRenderer';
import { collectBootstrapViolations } from './bootstrapClassDenylist';

describe('simulator runtime class hooks', () => {
    let renderer: TestRenderer.ReactTestRenderer | null = null;

    afterEach(() => {
        renderer?.unmount();
        renderer = null;
    });

    it('PhoneSimulatorShell uses simulator-shell hooks not Bootstrap utilities', async () => {
        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(
                    PhoneSimulatorShell,
                    { activeChannel: 'phone', onChannelChange: () => {} },
                    React.createElement('div', { className: 'simulator-test-child' }, 'child'),
                ),
            );
        });

        expect(collectBootstrapViolations(renderer!.root)).toEqual([]);
        expect(
            renderer!.root.findAll(
                (node) =>
                    typeof node.props.className === 'string' &&
                    node.props.className.includes('simulator-shell'),
            ).length,
        ).toBeGreaterThan(0);
    });

    it('PhoneDialView uses simulator-btn hooks not Bootstrap btn classes', async () => {
        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(PhoneDialView, {
                    onDial: () => {},
                }),
            );
        });

        expect(collectBootstrapViolations(renderer!.root)).toEqual([]);
        expect(
            renderer!.root.findAll(
                (node) =>
                    typeof node.props.className === 'string' &&
                    node.props.className.includes('simulator-btn'),
            ).length,
        ).toBeGreaterThan(0);
    });

    it('EmailInboxList uses simulator-list hooks not Bootstrap list-group', async () => {
        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(EmailInboxList, {
                    inbox: [
                        {
                            id: 'm1',
                            from: 'alice@example.com',
                            subject: 'Hello',
                            snippet: 'Hi there',
                            unread: true,
                        },
                    ],
                    selectedMessageId: null,
                    onSelectMessage: () => {},
                }),
            );
        });

        expect(collectBootstrapViolations(renderer!.root)).toEqual([]);
        expect(
            renderer!.root.findAll(
                (node) =>
                    typeof node.props.className === 'string' &&
                    node.props.className.includes('simulator-list'),
            ).length,
        ).toBeGreaterThan(0);
    });
});
