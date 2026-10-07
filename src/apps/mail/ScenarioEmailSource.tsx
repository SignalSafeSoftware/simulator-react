import { mailFolderSchema, type Mail } from '@signalsafe/simulator-core/apps/contracts';
import { newMail, replyMail, ReplyKind } from '@signalsafe/simulator-core/apps/mail';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import type { SimulatorEmailPayload } from '../../types/session.js';
import { SimulatorButton } from '../../ui/primitives.js';
import { SimulatorButtonTone } from '../../ui/styles/simulatorClasses.js';
import type { MailboxSource } from './Mailbox.js';

const SCENARIO_SOURCE_ID = 'scenario';

export interface ScenarioEmailSourceOptions {
    payload: SimulatorEmailPayload | null;
    selectedMessageId?: string | null;
    onSelectMessage: (messageId: string) => void;
    identity: string;
}

/** Opt-in bridge from read-only scenario email to independent local mailbox drafts. */
export function useScenarioEmailSource({
    payload,
    ...options
}: Readonly<ScenarioEmailSourceOptions>): MailboxSource | null {
    const { t } = useSimulatorLocale();
    if (!payload) return null;
    return {
        id: SCENARIO_SOURCE_ID,
        label: t('app.mail.scenario.source'),
        render: (onCompose) => (
            <ScenarioEmailContent {...options} payload={payload} onCompose={onCompose} />
        ),
    };
}

function ScenarioEmailContent({
    payload,
    selectedMessageId,
    onSelectMessage,
    identity,
    onCompose,
}: Readonly<
    Omit<ScenarioEmailSourceOptions, 'payload'> & {
        payload: SimulatorEmailPayload;
        onCompose: (mail: Mail) => void;
    }
>) {
    const { t } = useSimulatorLocale();
    const selectedId = selectedMessageId ?? payload.selectedMessageId;
    const folders = [
        { id: mailFolderSchema.enum.inbox, name: t('app.mail.folder.inbox'), rows: payload.inbox },
        {
            id: mailFolderSchema.enum.sent,
            name: t('app.mail.folder.sent'),
            rows: payload.outbox ?? [],
        },
        {
            id: mailFolderSchema.enum.trash,
            name: t('app.mail.folder.trash'),
            rows: payload.trash ?? [],
        },
    ];
    const row = folders.flatMap((folder) => folder.rows).find((item) => item.id === selectedId);
    const fullMessage = selectedId === payload.selectedMessageId ? payload.selectedMessage : null;
    const content: SimulatorEmailPayload['selectedMessage'] =
        fullMessage ??
        (row
            ? {
                  subject: row.subject,
                  from: row.from,
                  body: row.snippet ?? '',
              }
            : null);
    const compose = (
        message: NonNullable<typeof content>,
        kind: typeof ReplyKind.Reply | typeof ReplyKind.Forward,
    ) => {
        onCompose(
            replyMail(
                {
                    ...newMail(identity),
                    threadId: selectedId ?? SCENARIO_SOURCE_ID,
                    from:
                        kind === ReplyKind.Reply
                            ? (message.reply_to ?? message.from)
                            : message.from,
                    to: message.to ?? '',
                    cc: message.cc ?? '',
                    subject: message.subject,
                    body: message.body,
                },
                identity,
                kind,
            ),
        );
    };
    return (
        <section>
            <h3>{t('app.mail.scenario.source')}</h3>
            {folders.map((folder) => (
                <div key={folder.id}>
                    <h4>{folder.name}</h4>
                    <ul className='prototype-list'>
                        {folder.rows.map((item) => (
                            <li key={item.id}>
                                <SimulatorButton
                                    tone={SimulatorButtonTone.NeutralOutline}
                                    onClick={() => onSelectMessage(item.id)}
                                >
                                    {item.subject || t('app.mail.noSubject')}
                                </SimulatorButton>
                            </li>
                        ))}
                    </ul>
                    {!folder.rows.length && <p>{t('app.mail.scenario.emptyFolder')}</p>}
                </div>
            ))}
            {content && (
                <article>
                    <h4>{content.subject || t('app.mail.noSubject')}</h4>
                    {!fullMessage && <p>{t('app.mail.scenario.previewOnly')}</p>}
                    <p>{t('app.mail.from', { value: content.from })}</p>
                    <p className='prototype-message-body'>{content.body}</p>
                    <SimulatorButton
                        tone={SimulatorButtonTone.NeutralOutline}
                        onClick={() => compose(content, ReplyKind.Reply)}
                    >
                        {t('app.mail.scenario.reply')}
                    </SimulatorButton>
                    <SimulatorButton
                        tone={SimulatorButtonTone.NeutralOutline}
                        onClick={() => compose(content, ReplyKind.Forward)}
                    >
                        {t('app.mail.scenario.forward')}
                    </SimulatorButton>
                    <p>{t('app.mail.scenario.readOnly')}</p>
                </article>
            )}
        </section>
    );
}
