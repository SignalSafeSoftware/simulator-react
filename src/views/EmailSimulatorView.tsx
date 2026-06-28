/**
 * Email app view: inbox list, compose, or message detail.
 * Wireframe: top "Email" banner, rectangular bottom nav (Inbox, Outbox, Trash, Back).
 */
import type {
    EmailScreenId,
    SimulatorAction,
    SimulatorEmailPayload,
} from '../types/session.js';
import SimulatorLocalNav from '../components/SimulatorLocalNav.js';
import EmailInboxList from './EmailInboxList.js';
import EmailMessageDetail from './EmailMessageDetail.js';
import EmailComposeView from './EmailComposeView.js';
import { simLayout } from '../simulatorStyles.js';
import {
    joinClasses,
    SIM_BORDER_SECONDARY,
    SIM_BORDER_TOP,
    SIM_FLEX_COL,
    SIM_FLEX_GROW_1,
    SIM_FLEX_SHRINK_0,
    SIM_MIN_H_0,
    SIM_OVERFLOW_AUTO,
} from '../ui/simulatorClasses.js';

const EMAIL_NAV_ITEMS = [
    { id: 'list', label: 'Inbox' },
    { id: 'outbox', label: 'Outbox' },
    { id: 'trash', label: 'Trash' },
    { id: 'back', label: 'Back' },
] as const;

export interface EmailSimulatorViewProps {
    payload: SimulatorEmailPayload | null;
    screen: EmailScreenId;
    selectedMessageId: string | null;
    onAction: (action: SimulatorAction) => void;
    onSelectMessage: (messageId: string) => void;
    onBack?: () => void;
    /** Navigate to another email screen (list, detail, compose). */
    onNavigate?: (screen: EmailScreenId) => void;
    /** When true, the shell is rendering the secondary menu (Inbox/Outbox/Trash/Back); do not render local nav here. */
    navRenderedByShell?: boolean;
}

const localNavClass = joinClasses(
    'simulator-spacing--mb-0',
    'simulator-border--bottom-none',
    SIM_FLEX_SHRINK_0,
    SIM_BORDER_TOP,
    SIM_BORDER_SECONDARY,
);

export default function EmailSimulatorView({
    payload,
    screen,
    selectedMessageId,
    onAction,
    onSelectMessage,
    onBack,
    onNavigate,
    navRenderedByShell = false,
}: Readonly<EmailSimulatorViewProps>) {
    const inbox = payload?.inbox ?? [];
    const outbox = payload?.outbox ?? [];
    const trash = payload?.trash ?? [];
    const handleNavSelect = (id: string) => {
        if (id === 'back') {
            onBack?.();
        } else {
            onNavigate?.(id as EmailScreenId);
        }
    };

    const scrollClass =
        screen === 'detail'
            ? joinClasses(SIM_FLEX_GROW_1, SIM_MIN_H_0, SIM_FLEX_COL)
            : joinClasses(SIM_FLEX_GROW_1, SIM_MIN_H_0, SIM_OVERFLOW_AUTO);

    return (
        <div className={simLayout.screenColumn}>
            <div className={scrollClass}>
                {screen === 'list' && (
                    <EmailInboxList
                        inbox={inbox}
                        selectedMessageId={selectedMessageId}
                        onSelectMessage={onSelectMessage}
                        onCompose={() => onNavigate?.('compose')}
                    />
                )}

                {screen === 'outbox' && (
                    <EmailInboxList
                        inbox={outbox}
                        selectedMessageId={selectedMessageId}
                        onSelectMessage={onSelectMessage}
                        onCompose={() => onNavigate?.('compose')}
                        folderLabel="Outbox"
                    />
                )}

                {screen === 'trash' && (
                    <EmailInboxList
                        inbox={trash}
                        selectedMessageId={selectedMessageId}
                        onSelectMessage={onSelectMessage}
                        folderLabel="Trash"
                    />
                )}

                {screen === 'compose' && (
                    <EmailComposeView onCancel={() => onBack?.()} />
                )}

                {screen === 'detail' && (() => {
                    let message = payload?.selectedMessage;
                    if (message == null && selectedMessageId != null && selectedMessageId !== '') {
                        const allRows = [...inbox, ...outbox, ...trash];
                        const row = allRows.find((r) => r.id === selectedMessageId);
                        if (row != null) {
                            message = {
                                subject: row.subject,
                                from: row.from,
                                body: row.snippet ?? '',
                                from_display_name: row.from_display_name,
                            };
                        }
                    }
                    if (message == null) {
                        return (
                            <EmailInboxList
                                inbox={inbox}
                                selectedMessageId={selectedMessageId}
                                onSelectMessage={onSelectMessage}
                                onCompose={() => onNavigate?.('compose')}
                            />
                        );
                    }
                    return (
                        <EmailMessageDetail
                            message={message}
                            onAction={onAction}
                            onBack={onBack}
                            onNavigate={onNavigate}
                        />
                    );
                })()}
            </div>
            {!navRenderedByShell && (screen === 'list' || screen === 'outbox' || screen === 'trash') && (
                <SimulatorLocalNav
                    items={[...EMAIL_NAV_ITEMS]}
                    activeId={screen === 'list' ? 'list' : screen}
                    onSelect={handleNavSelect}
                    className={localNavClass}
                    aria-label="Email folder"
                />
            )}
        </div>
    );
}
