import { createElement } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';
import EmailComposeView from '../src/views/EmailComposeView.js';
import MessagesNewThreadView from '../src/views/MessagesNewThreadView.js';
import HomeSimulatorView from '../src/views/HomeSimulatorView.js';
import PhoneSimulatorView from '../src/views/PhoneSimulatorView.js';
import { demoHomeFixture } from '../examples/demo-home-fixture.js';

describe('reusable screen placeholders', () => {
    it('disables unconfigured compose controls without silently navigating away', async () => {
        const onBack = vi.fn();
        for (const view of [
            createElement(EmailComposeView, { onCancel: onBack }),
            createElement(MessagesNewThreadView, { onBack }),
        ]) {
            let renderer: TestRenderer.ReactTestRenderer;
            await act(async () => { renderer = TestRenderer.create(view); });
            expect(renderer!.root.findByProps({ role: 'status' }).props.children).toContain('not configured');
            for (const field of [...renderer!.root.findAllByType('input'), ...renderer!.root.findAllByType('textarea')]) {
                expect(field.props.disabled).toBe(true);
            }
            const send = renderer!.root.findByProps({ 'aria-label': 'Send' });
            expect(send.props.disabled).toBe(true);
            await act(async () => {
                const forms = renderer!.root.findAllByType('form');
                if (forms.length) forms[0].props.onSubmit({ preventDefault() {} });
                else send.props.onClick();
            });
            expect(onBack).not.toHaveBeenCalled();
            await act(async () => { renderer!.unmount(); });
        }
    });

    it('delivers configured new-message data through its callback before returning', async () => {
        const onSend = vi.fn();
        const onBack = vi.fn();
        let renderer: TestRenderer.ReactTestRenderer;
        await act(async () => { renderer = TestRenderer.create(createElement(MessagesNewThreadView, { onSend, onBack })); });
        await act(async () => {
            renderer!.root.findByProps({ 'aria-label': 'Phone number' }).props.onChange({ target: { value: ' 5550100 ' } });
            renderer!.root.findByProps({ 'aria-label': 'Message body' }).props.onChange({ target: { value: ' Synthetic message ' } });
        });
        await act(async () => { renderer!.root.findByType('form').props.onSubmit({ preventDefault() {} }); });
        expect(onSend).toHaveBeenCalledWith({ phoneNumber: '5550100', messageBody: ' Synthetic message ' });
        expect(onBack).toHaveBeenCalledOnce();
        renderer!.unmount();
    });

    it('keeps the former demo fixture available only through an explicit example', () => {
        expect(demoHomeFixture.featuredApps[0]?.name).toBe('Q Test');
    });

    it('renders only functional searches and no package-owned configuration input', async () => {
        let renderer: TestRenderer.ReactTestRenderer;
        await act(async () => {
            renderer = TestRenderer.create(
                createElement(HomeSimulatorView, {
                    payload: {
                        widgets: [{ id: 'demo', label: 'Q Test queue' }],
                        featuredApps: [{ id: 'quality', name: 'Q Test' }],
                        settingsSections: [{ id: 'general', title: 'General' }],
                    },
                    homeCapabilities: { store: true, settings: true },
                    screen: 'home',
                    onNavigate: vi.fn(),
                    onAction: vi.fn(),
                    onBack: vi.fn(),
                }),
            );
        });
        expect(renderer!.root.findAllByType('input')).toHaveLength(0);

        await act(async () => {
            renderer!.update(
                createElement(HomeSimulatorView, {
                    payload: {
                        widgets: [],
                        featuredApps: [],
                        settingsSections: [{ id: 'general', title: 'General' }],
                    },
                    homeCapabilities: { store: true, settings: true },
                    screen: 'settings',
                    onNavigate: vi.fn(),
                    onAction: vi.fn(),
                    onBack: vi.fn(),
                }),
            );
        });
        expect(renderer!.root.findAllByType('input')).toHaveLength(1);
        expect(renderer!.root.findAllByProps({ 'aria-label': 'General' })).toHaveLength(0);
    });

    it('renders an honest empty state instead of a disconnected contact form', async () => {
        let renderer: TestRenderer.ReactTestRenderer;
        await act(async () => {
            renderer = TestRenderer.create(
                createElement(PhoneSimulatorView, {
                    payload: { content: { transcript: '', choices: [] }, chosenIndex: null },
                    contacts: [],
                    phoneCapabilities: { dial: true, voicemail: false, directory: false },
                    screen: 'add_contact',
                    onNavigate: vi.fn(),
                    onAction: vi.fn(),
                }),
            );
        });
        expect(renderer!.root.findAllByType('input')).toHaveLength(0);
        expect(
            renderer!.root.findByProps({ children: 'Contact creation is not configured for this scenario.' }),
        ).toBeDefined();
    });
});
