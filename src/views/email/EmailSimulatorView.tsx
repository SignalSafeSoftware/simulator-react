/**
 * Email app view: inbox list, compose, or message detail.
 * Wireframe: top "Email" banner, rectangular bottom nav (Inbox, Outbox, Trash, Back).
 */
import { SimulatorEmailScreenId } from '@signalsafe/simulator-core/devicePayload';
import { getEmailSecondaryItems } from '../../utils/navigation/simulatorSecondaryMenuHelpers.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import type { EmailScreenId, SimulatorAction, SimulatorEmailPayload } from '../../types/session.js';
import { SimulatorLocalNav } from '../../ui/navigation/SimulatorLocalNav.js';
import EmailInboxList from './EmailInboxList.js';
import EmailMessageDetail from './EmailMessageDetail.js';
import EmailComposeView from './EmailComposeView.js';
import { simLayout } from '../../simulatorStyles.js';
import {
    SIM_BORDER_BOTTOM_NONE,
    SIM_BORDER_SECONDARY,
    SIM_BORDER_TOP,
    SIM_FLEX_COL,
    SIM_FLEX_GROW_1,
    SIM_FLEX_SHRINK_0,
    SIM_MIN_H_0,
    SIM_OVERFLOW_AUTO,
    joinClasses,
} from '../../ui/styles/simulatorClasses.js';
import { SIM_EMAIL } from '../../ui/styles/semanticSimulatorClasses.js';

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
    SIM_BORDER_BOTTOM_NONE,
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
    const screenLocale = useSimulatorLocale();

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
        screen === SimulatorEmailScreenId.Detail
            ? joinClasses(SIM_FLEX_GROW_1, SIM_MIN_H_0, SIM_FLEX_COL)
            : joinClasses(SIM_FLEX_GROW_1, SIM_MIN_H_0, SIM_OVERFLOW_AUTO);

    return (
        <div className={joinClasses(simLayout.screenColumn, SIM_EMAIL)}>
            <div className={scrollClass}>
                {screen === SimulatorEmailScreenId.List && (
                    <EmailInboxList
                        inbox={inbox}
                        selectedMessageId={selectedMessageId}
                        onSelectMessage={onSelectMessage}
                        onCompose={() => onNavigate?.(SimulatorEmailScreenId.Compose)}
                    />
                )}

                {screen === SimulatorEmailScreenId.Outbox && (
                    <EmailInboxList
                        inbox={outbox}
                        selectedMessageId={selectedMessageId}
                        onSelectMessage={onSelectMessage}
                        onCompose={() => onNavigate?.(SimulatorEmailScreenId.Compose)}
                        folder="outbox"
                        folderLabel={screenLocale.t('nav.outbox')}
                    />
                )}

                {screen === SimulatorEmailScreenId.Trash && (
                    <EmailInboxList
                        inbox={trash}
                        selectedMessageId={selectedMessageId}
                        onSelectMessage={onSelectMessage}
                        folder="trash"
                        folderLabel={screenLocale.t('nav.trash')}
                    />
                )}

                {screen === SimulatorEmailScreenId.Compose && (
                    <EmailComposeView
                        onCancel={() => onBack?.()}
                        hideActions={navRenderedByShell}
                    />
                )}

                {screen === SimulatorEmailScreenId.Detail &&
                    (() => {
                        let message = payload?.selectedMessage;
                        if (
                            message == null &&
                            selectedMessageId != null &&
                            selectedMessageId !== ''
                        ) {
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
                                    onCompose={() => onNavigate?.(SimulatorEmailScreenId.Compose)}
                                />
                            );
                        }
                        let folderLabel = screenLocale.t('nav.inbox');
                        if (outbox.some((row) => row.id === selectedMessageId)) {
                            folderLabel = screenLocale.t('nav.outbox');
                        } else if (trash.some((row) => row.id === selectedMessageId)) {
                            folderLabel = screenLocale.t('nav.trash');
                        }
                        return (
                            <EmailMessageDetail
                                folderLabel={folderLabel}
                                hideActions={navRenderedByShell}
                                message={message}
                                onAction={onAction}
                                onBack={onBack}
                                onNavigate={onNavigate}
                            />
                        );
                    })()}
            </div>
            {!navRenderedByShell &&
                (screen === SimulatorEmailScreenId.List ||
                    screen === SimulatorEmailScreenId.Outbox ||
                    screen === SimulatorEmailScreenId.Trash) && (
                    <SimulatorLocalNav
                        items={getEmailSecondaryItems(screenLocale)}
                        activeId={screen === SimulatorEmailScreenId.List ? 'list' : screen}
                        onSelect={handleNavSelect}
                        className={localNavClass}
                        aria-label={screenLocale.t('screen.emailSimulatorView.email.folder')}
                    />
                )}
        </div>
    );
}
