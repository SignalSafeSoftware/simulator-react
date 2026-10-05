// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { shouldHideSimulatorNavigation } from '../src/utils/navigation/simulatorNavigationPolicy';
import { buildSimulatorPreviewReport } from '../src/utils/preview/simulatorPreviewReport';
import ContactsView, { contactMatchesSearch } from '../src/views/contacts/ContactsView';
import PhoneContactEditor from '../src/views/contacts/PhoneContactEditor';
import { MessageComposeContext } from '../src/contract/messageComposeContract';
import SmsSimulatorView from '../src/views/messages/SmsSimulatorView';
import PhoneHistoryList from '../src/views/phone/PhoneHistoryList';
import PhoneSimulatorView from '../src/views/phone/PhoneSimulatorView';
import { createPayload } from './support/createPayload';

describe('shouldHideSimulatorNavigation', () => {
    it('hides navigation when the active app has no screen', () => {
        expect(shouldHideSimulatorNavigation({ activeApp: 'email' } as never, 'host')).toBe(true);
    });
});

describe('buildSimulatorPreviewReport', () => {
    it('counts browser pages without form fields as a plain page open', () => {
        const report = buildSimulatorPreviewReport(
            createPayload({
                entryPoint: { app: 'internet', screen: 'p' },
                device: { mainMenuItems: [{ id: 'internet' }] },
                browser: {
                    defaultPageId: 'p',
                    pages: [{ id: 'p', url: 'x', title: 'x', layout: 'content' }],
                },
            } as never),
        );
        expect(report.keyActions).toContain('open_page');
        expect(report.keyActions).not.toContain('submit_form');
    });

    it('handles browser payloads whose pages are absent', () => {
        const report = buildSimulatorPreviewReport(
            createPayload({
                device: { mainMenuItems: [{ id: 'internet' }] },
                browser: {},
            } as never),
        );
        expect(report.browserPagesCount).toBe(0);
    });
});

describe('contactMatchesSearch', () => {
    const contact = { id: 'c', displayName: 'Zed', email: 'zed@example.test' } as never;
    it('matches on the primary email only', () => {
        expect(contactMatchesSearch(contact, 'ZED@EXAMPLE')).toBe(true);
        expect(contactMatchesSearch(contact, 'nobody@')).toBe(false);
        expect(contactMatchesSearch({ id: 'x', displayName: 'Zed' } as never, 'nobody@')).toBe(
            false,
        );
    });
});

describe('ContactsView header', () => {
    it('uses the localised title next to the add button when none is given', () => {
        render(<ContactsView contacts={[]} onBack={() => {}} onAddContact={() => {}} />);
        expect(screen.getByText('Contacts')).toBeInstanceOf(HTMLElement);
    });
});

describe('PhoneContactEditor', () => {
    const renderEditor = (props: { saving?: boolean; saveDisabled?: boolean }) => {
        const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
        const onCancel = vi.fn();
        const { container } = render(
            <PhoneContactEditor
                number=''
                onNumberChange={() => {}}
                onSubmit={onSubmit}
                onCancel={onCancel}
                {...props}
            />,
        );
        return { form: container.querySelector('form')!, onSubmit, onCancel };
    };

    it('submits and cancels normally', () => {
        const { form, onSubmit, onCancel } = renderEditor({});
        fireEvent.submit(form);
        expect(onSubmit).toHaveBeenCalledTimes(1);
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('ignores submissions while saving or disabled', () => {
        const saving = renderEditor({ saving: true });
        fireEvent.submit(saving.form);
        expect(saving.onSubmit).not.toHaveBeenCalled();
        const disabled = renderEditor({ saveDisabled: true });
        fireEvent.submit(disabled.form);
        expect(disabled.onSubmit).not.toHaveBeenCalled();
    });
});

describe('PhoneHistoryList', () => {
    it('labels incoming calls without a caller as unknown and shows call durations', () => {
        render(
            <PhoneHistoryList
                entries={
                    [
                        {
                            id: 'e1',
                            number: '+15550100',
                            name: 'Ada',
                            kind: 'outgoing',
                            durationSeconds: 125,
                        },
                    ] as never
                }
                incomingCallContent={{} as never}
                onSelectIncoming={() => {}}
                onSelectVoicemail={() => {}}
            />,
        );
        expect(screen.getByText('Unknown')).toBeInstanceOf(HTMLElement);
        expect(screen.getByText(/2/)).toBeInstanceOf(HTMLElement);
    });
});

describe('PhoneSimulatorView without call history', () => {
    const capabilities = { dial: true, voicemail: false, directory: false } as never;
    const content = { caller_name: 'Bank', phone_number: '+15550100', urgency: 'high' } as never;

    it('shows an empty history list', () => {
        render(
            <PhoneSimulatorView
                payload={{ content, chosenIndex: null } as never}
                phoneCapabilities={capabilities}
                screen='history'
                onNavigate={() => {}}
                onAction={() => {}}
            />,
        );
        expect(screen.getAllByText('Bank').length).toBeGreaterThan(0);
    });

    it('passes empty history and contacts to the incoming-call extra slot', () => {
        const extra = vi.fn(
            ({ callHistory, contacts }: { callHistory: unknown[]; contacts: unknown[] | null }) => (
                <p>{`extra ${callHistory.length} ${String(contacts)}`}</p>
            ),
        );
        render(
            <PhoneSimulatorView
                payload={{ content, chosenIndex: null } as never}
                phoneCapabilities={capabilities}
                screen='incoming_call'
                onNavigate={() => {}}
                onAction={() => {}}
                sessionState={{} as never}
                sessionDispatch={() => {}}
                renderIncomingCallExtra={extra as never}
            />,
        );
        expect(extra).toHaveBeenCalled();
        expect(screen.getByText('extra 0 null')).toBeInstanceOf(HTMLElement);
    });
});

describe('SmsSimulatorView', () => {
    const baseProps = {
        visibleCount: 10,
        onAction: vi.fn(),
        onRevealNext: vi.fn(),
    };
    const payload = (
        overrides: Record<string, unknown> = {},
        thread: Record<string, unknown> = {},
    ) =>
        ({
            mode: 'history',
            visibleMessageCount: 10,
            thread: {
                messages: [{ from: 'them', text: 'Hello' }],
                sender_display_name: 'Ada',
                ...thread,
            },
            ...overrides,
        }) as never;

    it('renders messages without ids or text', () => {
        render(
            <SmsSimulatorView
                {...baseProps}
                payload={payload(
                    {},
                    { messages: [{ from: 'them' }, { from: 'me', text: '\u200B' }] },
                )}
            />,
        );
        expect(screen.getAllByText('No text content').length).toBeGreaterThan(0);
    });

    it('renders titled and untitled links, with or without targets', () => {
        render(
            <SmsSimulatorView
                {...baseProps}
                payload={payload(
                    {},
                    {
                        links: [
                            { title: 'Titled', text: 'Open titled' },
                            { title: 'Titled', href: 'https://example.test', text: 'Open linked' },
                            { text: 'Open bare' },
                            { href: 'https://other.test', text: 'Open other' },
                        ],
                    },
                )}
            />,
        );
        expect(screen.getByText('Open bare')).toBeInstanceOf(HTMLElement);
        expect(screen.getByText('Open other')).toBeInstanceOf(HTMLElement);
    });

    it('offers a way back from read-only threads', () => {
        const onBack = vi.fn();
        render(
            <SmsSimulatorView
                {...baseProps}
                onBack={onBack}
                payload={payload({ readOnly: true })}
            />,
        );
        fireEvent.click(screen.getByText('Back to threads'));
        expect(onBack).toHaveBeenCalledTimes(1);
        expect(screen.queryByLabelText('Reply to message')).toBeNull();
    });

    it('does not offer a back button without a handler', () => {
        render(<SmsSimulatorView {...baseProps} payload={payload({ readOnly: true })} />);
        expect(screen.queryByText('Back to threads')).toBeNull();
    });

    it('mirrors reply edits into the host compose state', () => {
        const onChange = vi.fn();
        render(
            <MessageComposeContext.Provider
                value={{ draft: { phoneNumber: '', messageBody: '' }, onChange }}
            >
                <SmsSimulatorView {...baseProps} payload={payload()} />
            </MessageComposeContext.Provider>,
        );
        fireEvent.change(screen.getByLabelText('Reply to message'), { target: { value: 'Typed' } });
        expect(onChange).toHaveBeenCalledWith({ phoneNumber: '', messageBody: 'Typed' });
    });
});
