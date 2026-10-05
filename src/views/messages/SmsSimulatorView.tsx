/**
 * Messages app: thread detail. Wireframe: profile + name, message bubbles,
 * message box and Send/Cancel at bottom. Links and attachments preserved in bubbles.
 */
import { SmsMode, type SimulatorAction, type SimulatorSmsPayload } from '../../types/session.js';
import {
    SIM_BORDER_TOP,
    SIM_BTN_PLAIN,
    SIM_FLEX_SHRINK_0,
    SIM_ROUNDED_NONE,
    SIM_TEXT_BODY,
    SIM_TEXT_DARK,
    SIM_TEXT_MEDIUM,
    SIM_TEXT_SEMIBOLD,
    SIM_TEXT_SM,
    SIM_VISUALLY_HIDDEN,
    SimulatorButtonTone,
    joinClasses,
} from '../../ui/styles/simulatorClasses.js';
import { SimulatorAvatar } from '../../ui/media/SimulatorAvatar.js';
import { useContext, useEffect, useState, type ReactNode } from 'react';
import { SmsMessageTimeline } from './SmsMessageTimeline.js';
import { SimulatorTimelineContext } from '../../contract/hostListSlots.js';
import { useReportComposerState } from '../../contract/composerState.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { SimulatorCapabilityState, useSimulatorCapabilities } from '../../contract/capabilities.js';
import { useMessageComposeOptions } from '../../contract/messageComposeContract.js';
import { usePhoneNumberFormatter } from '../../contract/phonePresentation.js';
import { SimulatorActions } from '../../actions/simulatorActions.js';
import { simBorder, simLayout, simScreen, simSpacing, simTypo } from '../../simulatorStyles.js';
import { SimulatorTextarea } from '../../ui/primitives.js';
import { SIM_MESSAGES_THREAD_DETAIL } from '../../ui/styles/semanticSimulatorClasses.js';
import { renderSimulatorChoice, type SimulatorChoiceRenderProps } from '../../ui/renderSlots.js';

export interface SmsSimulatorViewProps {
    payload: SimulatorSmsPayload | null;
    visibleCount: number;
    onAction: (action: SimulatorAction) => void;
    onRevealNext: () => void;
    onBack?: () => void;
    showReplyBox?: boolean;
    navRenderedByShell?: boolean;
    renderChoice?: (choice: SimulatorChoiceRenderProps) => ReactNode;
}

const EMPTY_MESSAGES: NonNullable<SimulatorSmsPayload['thread']>['messages'] = [];

export default function SmsSimulatorView({
    payload,
    visibleCount,
    onAction,
    onRevealNext,
    onBack,
    showReplyBox = true,
    navRenderedByShell = false,
    renderChoice,
}: Readonly<SmsSimulatorViewProps>) {
    const screenLocale = useSimulatorLocale();
    const timeline = useContext(SimulatorTimelineContext);

    const formatNumber = usePhoneNumberFormatter();
    const capability = useSimulatorCapabilities().sendMessage;
    const unavailable =
        capability && capability.state !== SimulatorCapabilityState.Enabled
            ? capability.reason
            : '';
    const compose = useMessageComposeOptions();
    const [localReply, setLocalReply] = useState('');
    const replyText = compose?.draft.messageBody ?? localReply;
    const setReplyText = (messageBody: string) => {
        setLocalReply(messageBody);
        if (compose) compose.onChange({ ...compose.draft, messageBody });
    };
    useReportComposerState(
        Boolean(payload && !payload.readOnly && showReplyBox && !unavailable && replyText.trim()),
        false,
    );
    const messages = payload?.thread?.messages ?? EMPTY_MESSAGES;

    useEffect(() => {
        if (payload?.mode === SmsMode.History || messages.length === 0) return;
        const timeouts: ReturnType<typeof setTimeout>[] = [];
        let cumulativeMs = 0;
        for (const msg of messages) {
            if (msg == null) continue;
            const delayMs = (msg.delay_seconds ?? 0) * 1000;
            cumulativeMs += delayMs;
            timeouts.push(setTimeout(() => onRevealNext(), cumulativeMs));
        }
        return () => timeouts.forEach((t) => clearTimeout(t));
    }, [messages, onRevealNext, payload?.mode]);

    if (payload == null) {
        return (
            <p className={simTypo.emptyState}>
                {screenLocale.t('screen.smsSimulatorView.no.messages.for.this.scenario')}
            </p>
        );
    }

    const content = payload.thread;
    const visible = payload.mode === SmsMode.History ? messages : messages.slice(0, visibleCount);
    const senderName = content.sender_display_name;
    const senderNumber = content.sender_number;
    const contactLabel = senderName ?? (senderNumber ? formatNumber(senderNumber) : 'Unknown');

    const renderLinkChoice = (
        link: NonNullable<typeof content.links>[number],
        idx: number,
        className: string,
    ) =>
        renderSimulatorChoice(
            {
                label: link.text || link.href,
                tone: SimulatorButtonTone.Link,
                className,
                onClick: () =>
                    onAction(SimulatorActions.clickLink({ linkIndex: idx, href: link.href })),
                'aria-label': `Link: ${link.text || link.href}`,
            },
            renderChoice,
        );

    const handleSendReply = () => {
        const text = replyText.trim();
        if (text && !unavailable) {
            onAction(SimulatorActions.sendReply(text));
            setReplyText('');
            compose?.onAccepted?.();
        }
    };

    return (
        <div className={joinClasses(simLayout.screenColumn, SIM_MESSAGES_THREAD_DETAIL)}>
            {unavailable && !navRenderedByShell && (
                <p>
                    <output>{unavailable}</output>
                </p>
            )}
            <div className={simLayout.scrollBody} ref={timeline.scrollRef}>
                {timeline.header}
                <div
                    className={joinClasses(
                        simScreen.header,
                        simSpacing.sectionGap,
                        SIM_FLEX_SHRINK_0,
                    )}
                >
                    <SimulatorAvatar key={payload.avatarUrl} avatarUrl={payload.avatarUrl} />
                    <div
                        className={joinClasses(
                            SIM_TEXT_SM,
                            SIM_TEXT_SEMIBOLD,
                            SIM_TEXT_BODY,
                            simSpacing.mt1,
                        )}
                    >
                        {contactLabel}
                    </div>
                </div>

                {payload.loadingMessage && (
                    <p>
                        <output>{payload.loadingMessage}</output>
                    </p>
                )}
                {visible.length === 0 && !payload.loadingMessage && (
                    <p className={simTypo.secondaryTight}>
                        {screenLocale.t('screen.smsSimulatorView.no.messages.in.this.thread')}
                    </p>
                )}
                <SmsMessageTimeline
                    visible={visible}
                    contentRef={timeline.contentRef}
                    onAction={onAction}
                    renderChoice={renderChoice}
                />

                {(content.links?.length ?? 0) > 0 && (
                    <div
                        className={joinClasses(
                            simSpacing.mt3,
                            simSpacing.pt3,
                            SIM_BORDER_TOP,
                            simLayout.actionsRow,
                            simSpacing.sectionGap,
                        )}
                    >
                        {content.links?.map((link, idx) =>
                            link.title != null && link.title !== '' ? (
                                <div
                                    key={`link-${idx}-${link.href ?? ''}-${link.title}`}
                                    className={joinClasses(
                                        simBorder.block,
                                        simSpacing.blockPaddingCompact,
                                        SIM_TEXT_SM,
                                    )}
                                    style={{ maxWidth: 280 }}
                                >
                                    <span
                                        className={joinClasses(
                                            SIM_TEXT_MEDIUM,
                                            'simulator-text--block',
                                            SIM_TEXT_DARK,
                                            simSpacing.mb1,
                                        )}
                                    >
                                        {link.title}
                                    </span>
                                    {renderLinkChoice(
                                        link,
                                        idx,
                                        joinClasses(
                                            SIM_BTN_PLAIN,
                                            SIM_TEXT_SM,
                                            'simulator-text--align-baseline',
                                        ),
                                    )}
                                </div>
                            ) : (
                                <span key={`link-btn-${idx}-${link.href ?? ''}`}>
                                    {renderLinkChoice(
                                        link,
                                        idx,
                                        joinClasses(
                                            SIM_BTN_PLAIN,
                                            'simulator-text--align-baseline',
                                            SIM_ROUNDED_NONE,
                                        ),
                                    )}
                                </span>
                            ),
                        )}
                    </div>
                )}
            </div>

            {payload.readOnly && onBack && (
                <button type="button" onClick={onBack}>
                    {screenLocale.t('screen.smsSimulatorView.back.to.threads')}
                </button>
            )}
            {showReplyBox && !payload.readOnly && (
                <form
                    className={joinClasses(simLayout.footerActions, 'simulator-messages__composer')}
                    onSubmit={(event) => {
                        event.preventDefault();
                        handleSendReply();
                    }}
                >
                    {!unavailable && !replyText.trim() && (
                        <p className={SIM_VISUALLY_HIDDEN}>
                            <output>{screenLocale.t('messages.enterBody')}</output>
                        </p>
                    )}
                    <SimulatorTextarea
                        rows={3}
                        placeholder={screenLocale.t(
                            'screen.smsSimulatorView.i.will.send.you.a.message',
                        )}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        aria-label={screenLocale.t('screen.smsSimulatorView.reply.to.message')}
                        className={SIM_ROUNDED_NONE}
                    />
                    {!navRenderedByShell && (
                        <button
                            type="submit"
                            disabled={Boolean(unavailable) || !replyText.trim()}
                            className="simulator-messages__inline-send"
                        >
                            {screenLocale.t('screen.smsSimulatorView.send')}
                        </button>
                    )}
                </form>
            )}
        </div>
    );
}
