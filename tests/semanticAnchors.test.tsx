// @vitest-environment jsdom
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import {
    simulatorAnchorAttributes,
    simulatorAnchorElements,
} from '../src/contract/semanticAnchors';
import { MailMessageRow } from '../src/apps/mail/MailMessageRow';
import { MailMessageContent } from '../src/apps/mail/MailMessageContent';
import { ContactDetailPanel } from '../src/views/contacts/ContactDetailPanel';
import MessagesThreadListView from '../src/views/messages/MessagesThreadListView';
import EmailSimulatorView from '../src/views/email/EmailSimulatorView';
import { SimulatorAppNavItem } from '../src/ui/navigation/SimulatorAppNavItem';

describe('semantic simulator anchors', () => {
    it('finds only exact role and record identities inside the selected phone', () => {
        const root = document.createElement('div');
        const id = 'Message "A":[]';
        const exact = document.createElement('button');
        Object.entries(
            simulatorAnchorAttributes({ kind: 'simulator', anchor: 'email-row', recordId: id }),
        ).forEach(([key, value]) => exact.setAttribute(key, value));
        const wrong = document.createElement('button');
        wrong.dataset.simulatorAnchor = 'email-body';
        wrong.dataset.simulatorRecordId = id;
        root.append(exact, wrong);
        expect(
            simulatorAnchorElements(root, { kind: 'simulator', anchor: 'email-row', recordId: id }),
        ).toEqual([exact]);
        expect(
            simulatorAnchorElements(root, {
                kind: 'simulator',
                anchor: 'email-row',
                recordId: id.toLowerCase(),
            }),
        ).toEqual([]);
        const otherPhone = document.createElement('div');
        otherPhone.append(exact);
        expect(
            simulatorAnchorElements(root, { kind: 'simulator', anchor: 'email-row', recordId: id }),
        ).toEqual([]);
    });

    it('puts identity on the actual email controls and full message body', () => {
        const row = renderToStaticMarkup(
            <MailMessageRow
                id='email-2'
                subject='Subject'
                address='sender'
                snippet='Preview'
                dateText='Today'
                unread={false}
                onOpen={vi.fn()}
            />,
        );
        expect(row).toContain('data-simulator-anchor="email-row"');
        expect(row).toContain('data-simulator-record-id="email-2"');
        const body = renderToStaticMarkup(
            <MailMessageContent
                id='email-2'
                subject='Subject'
                from='sender'
                body='Full saved body'
            />,
        );
        expect(body).toContain(
            'class="prototype-message-body" data-simulator-anchor="email-body" data-simulator-record-id="email-2"',
        );
        expect(body).toContain('Full saved body');
    });

    it('keeps conversation and contact record identities separate from labels', () => {
        const threads = renderToStaticMarkup(
            <MessagesThreadListView
                threads={[
                    { id: 'thread-A', senderName: 'Same name', preview: 'One' },
                    { id: 'thread-B', senderName: 'Same name', preview: 'Two' },
                ]}
                onSelectThread={vi.fn()}
            />,
        );
        expect(threads).toContain(
            'data-simulator-anchor="conversation-row" data-simulator-record-id="thread-A"',
        );
        expect(threads).toContain(
            'data-simulator-anchor="conversation-row" data-simulator-record-id="thread-B"',
        );
        const contact = renderToStaticMarkup(
            <ContactDetailPanel
                contact={{ id: 'contact-B', displayName: 'Same name', number: '+15550102' }}
                onBack={vi.fn()}
            />,
        );
        expect(contact).toContain(
            'data-simulator-anchor="contact-detail" data-simulator-record-id="contact-B"',
        );
    });

    it('anchors Home only when composition explicitly identifies that native button', () => {
        const home = renderToStaticMarkup(
            <SimulatorAppNavItem label='Translated Home' semanticAnchor='home-control' />,
        );
        const other = renderToStaticMarkup(<SimulatorAppNavItem label='Home' />);
        expect(home).toContain('data-simulator-anchor="home-control"');
        expect(other).not.toContain('data-simulator-anchor');
    });
});

it('retains scenario email identity when selected content is stored separately from its row', () => {
    const html = renderToStaticMarkup(
        <EmailSimulatorView
            payload={{
                inbox: [
                    { id: 'email-1', subject: 'Synthetic preview', from: 'sender@example.test' },
                ],
                selectedMessage: {
                    subject: 'Synthetic preview',
                    from: 'sender@example.test',
                    body: 'Full scenario body',
                },
                selectedMessageId: 'email-1',
            }}
            screen='detail'
            selectedMessageId='email-1'
            onAction={vi.fn()}
            onSelectMessage={vi.fn()}
        />,
    );
    expect(html).toContain('data-simulator-anchor="email-body" data-simulator-record-id="email-1"');
    expect(html).toContain('Full scenario body');
});

it('retains unindexed mail rows without fabricating a semantic record identity', () => {
    const html = renderToStaticMarkup(
        <MailMessageRow
            subject='Unindexed row'
            address='sender'
            snippet='Summary'
            dateText='Today'
            unread={false}
            onOpen={vi.fn()}
        />,
    );
    expect(html).toContain('Unindexed row');
    expect(html).not.toContain('data-simulator-anchor');
    expect(html).not.toContain('data-simulator-record-id');
});

it('retains unidentified full email content without inventing a body anchor', () => {
    const html = renderToStaticMarkup(
        <EmailSimulatorView
            payload={{
                inbox: [],
                selectedMessageId: null,
                selectedMessage: {
                    subject: 'Unindexed full email',
                    from: 'sender',
                    body: 'Unindexed full body',
                },
            }}
            screen='detail'
            selectedMessageId={null}
            onAction={vi.fn()}
            onSelectMessage={vi.fn()}
        />,
    );
    expect(html).toContain('Unindexed full body');
    expect(html).not.toContain('data-simulator-anchor="email-body"');
});

it('returns an unselected email detail to its list without leaking indexed content', () => {
    const html = renderToStaticMarkup(
        <EmailSimulatorView
            payload={{
                inbox: [{ id: 'row', subject: 'Available email', from: 'sender' }],
                selectedMessageId: null,
                selectedMessage: null,
                messagesById: {
                    row: {
                        subject: 'Available email',
                        from: 'sender',
                        body: 'Private indexed body',
                    },
                },
            }}
            screen='detail'
            selectedMessageId={null}
            onAction={vi.fn()}
            onSelectMessage={vi.fn()}
        />,
    );
    expect(html).toContain('Available email');
    expect(html).not.toContain('Private indexed body');
    expect(html).not.toContain('data-simulator-anchor="email-body"');
});
