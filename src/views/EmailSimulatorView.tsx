/**
 * Email app view: inbox list, compose, or message detail.
 * Wireframe: top "Email" banner, rectangular bottom nav (Inbox, Outbox, Trash, Back).
 */
import type {
    EmailScreenId,
    SimulatorAction,
    SimulatorEmailPayload,
} from '../types/session';
import SimulatorLocalNav from '../components/SimulatorLocalNav';
import EmailInboxList from './EmailInboxList';
import EmailMessageDetail from './EmailMessageDetail';
import EmailComposeView from './EmailComposeView';

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

    return (
        <div className="d-flex flex-column flex-grow-1 min-h-0">
            {/* App identity is the shell bottom nav; do not render doc-only diagram labels (e.g. "Email") inside content. */}
            <div className={`flex-grow-1 min-h-0 ${screen === 'detail' ? 'd-flex flex-column' : 'overflow-auto'}`}>
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
                    className="mb-0 border-bottom-0 flex-shrink-0 border-top border-secondary"
                    aria-label="Email folder"
                />
            )}
        </div>
    );
}
