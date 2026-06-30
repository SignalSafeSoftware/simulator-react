/**
 * Email message read/detail: wireframe layout (From, To, Subject, Body), links, attachments,
 * and Reply/Forward/Dispose/Cancel buttons. No Report link. Bottom secondary menu hidden on this screen.
 */
import type { EmailScreenId, SimulatorAction } from '../types/session.js';
import { SimulatorActions } from '../actions/index.js';
import { SimulatorDetailBackBar } from '../components/SimulatorDetail.js';
import { simLayout, simSpacing, simTypo, simActionsBar } from '../simulatorStyles.js';
import type { EmailTemplateContent, EmailTemplateLink } from '../types/portableSimulator.js';
import {
    SimulatorButton,
    SimulatorField,
    SimulatorInput,
    SimulatorLabel,
    SimulatorTextarea,
} from '../ui/primitives.js';
import {
    joinClasses,
    SIM_BORDER_BOTTOM,
    SIM_FLEX_COL,
    SIM_FLEX_GROW_1,
    SIM_FLEX_SHRINK_0,
    SIM_MIN_H_0,
    SIM_OVERFLOW_AUTO,
    SIM_ROUNDED_NONE,
    SIM_SURFACE_LIGHT,
    SIM_TEXT_SM,
} from '../ui/simulatorClasses.js';
import { SIM_EMAIL_MESSAGE_DETAIL } from '../ui/semanticSimulatorClasses.js';

export interface EmailMessageDetailProps {
    message: EmailTemplateContent;
    onAction: (action: SimulatorAction) => void;
    onBack?: () => void;
    /** When set, Cancel navigates to list. */
    onNavigate?: (screen: EmailScreenId) => void;
}

function withStableLinkKeys(
    links: EmailTemplateLink[]
): Array<{ key: string; link: EmailTemplateLink; index: number }> {
    const counts = new Map<string, number>();
    return links.map((link, index) => {
        const base = [link.href ?? '', link.text ?? '', link.title ?? ''].join('|');
        const nextCount = (counts.get(base) ?? 0) + 1;
        counts.set(base, nextCount);
        return { key: `${base}-${nextCount}`, link, index };
    });
}

const readOnlyFieldClass = joinClasses(SIM_ROUNDED_NONE, SIM_SURFACE_LIGHT);

export default function EmailMessageDetail({
    message,
    onAction,
    onBack,
}: Readonly<EmailMessageDetailProps>) {
    const hasAttachment =
        message.attachment_name != null && message.attachment_name !== '';
    const fromDisplay =
        message.from_display_name != null && message.from_display_name !== ''
            ? `${message.from_display_name} <${message.from}>`
            : message.from ?? '';
    const keyedLinks = withStableLinkKeys(message.links ?? []);

    return (
        <div className={joinClasses(simLayout.screenColumn, SIM_EMAIL_MESSAGE_DETAIL)}>
            {onBack && (
                <>
                    <SimulatorDetailBackBar onBack={onBack} title="Message" ariaLabel="Back to inbox" titleOnly />
                    <div className={SIM_BORDER_BOTTOM} />
                </>
            )}
            <div className={joinClasses(SIM_FLEX_COL, SIM_FLEX_GROW_1, SIM_MIN_H_0, SIM_OVERFLOW_AUTO, simSpacing.p3)}>
                <div className={joinClasses(SIM_FLEX_COL, simSpacing.gap2, SIM_FLEX_GROW_1, SIM_MIN_H_0)}>
                    <SimulatorField className={joinClasses(simSpacing.mb0, SIM_FLEX_SHRINK_0)}>
                        <SimulatorLabel className={simLayout.fieldLabel}>From</SimulatorLabel>
                        <SimulatorInput
                            type="text"
                            readOnly
                            value={fromDisplay}
                            className={readOnlyFieldClass}
                            aria-label="From"
                        />
                    </SimulatorField>
                    <SimulatorField className={joinClasses(simSpacing.mb0, SIM_FLEX_SHRINK_0)}>
                        <SimulatorLabel className={simLayout.fieldLabel}>To</SimulatorLabel>
                        <SimulatorInput
                            type="text"
                            readOnly
                            value={message.to ?? ''}
                            className={readOnlyFieldClass}
                            aria-label="To"
                        />
                    </SimulatorField>
                    <SimulatorField className={joinClasses(simSpacing.mb0, SIM_FLEX_SHRINK_0)}>
                        <SimulatorLabel className={simLayout.fieldLabel}>Subject</SimulatorLabel>
                        <SimulatorInput
                            type="text"
                            readOnly
                            value={message.subject ?? ''}
                            className={readOnlyFieldClass}
                            aria-label="Subject"
                        />
                    </SimulatorField>
                    <SimulatorField
                        className={joinClasses(
                            simSpacing.mb0,
                            SIM_FLEX_GROW_1,
                            SIM_MIN_H_0,
                            SIM_FLEX_COL,
                            'simulator-flex-shrink-1',
                        )}
                    >
                        <SimulatorLabel className={simLayout.fieldLabel}>Body</SimulatorLabel>
                        <SimulatorTextarea
                            readOnly
                            value={message.body ?? ''}
                            className={joinClasses(readOnlyFieldClass, SIM_FLEX_GROW_1, SIM_OVERFLOW_AUTO)}
                            style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, minHeight: 0, resize: 'none' }}
                            aria-label="Body"
                        />
                    </SimulatorField>
                </div>
                {message.links != null && message.links.length > 0 && (
                    <div className={joinClasses(simSpacing.dividerTop, simActionsBar, simSpacing.mt3, simSpacing.pt3, SIM_FLEX_SHRINK_0)}>
                        <span className={joinClasses(simTypo.secondary, simSpacing.me1)}>Links:</span>
                        {keyedLinks.map(({ key, link, index }) => (
                            <SimulatorButton
                                key={key}
                                tone="outline-primary"
                                className={joinClasses('simulator-text--link', SIM_ROUNDED_NONE, 'simulator-btn--sm')}
                                onClick={() =>
                                    onAction(SimulatorActions.clickLink({ linkIndex: index, href: link.href }))
                                }
                                aria-label={link.text || link.href}
                            >
                                {link.text || link.href}
                            </SimulatorButton>
                        ))}
                    </div>
                )}
                {hasAttachment && (
                    <div className={joinClasses(simSpacing.dividerTop, SIM_TEXT_SM, simSpacing.mt3, simSpacing.pt3, SIM_FLEX_SHRINK_0)}>
                        <span className={joinClasses(simTypo.secondary, simSpacing.me2)}>
                            Attachment: {message.attachment_name}
                            {message.attachment_type != null && message.attachment_type !== '' && (
                                <span className={simSpacing.ms1}>({message.attachment_type})</span>
                            )}
                        </span>
                        <SimulatorButton
                            tone="outline-secondary"
                            className={joinClasses(simSpacing.me1, SIM_ROUNDED_NONE, 'simulator-btn--sm')}
                            onClick={() => onAction(SimulatorActions.openAttachment(0))}
                            aria-label="Open attachment"
                        >
                            Open
                        </SimulatorButton>
                        <SimulatorButton
                            tone="outline-secondary"
                            className={joinClasses(SIM_ROUNDED_NONE, 'simulator-btn--sm')}
                            onClick={() => onAction(SimulatorActions.downloadAttachment(0))}
                            aria-label="Download attachment"
                        >
                            Download
                        </SimulatorButton>
                    </div>
                )}
            </div>
            <div className={simLayout.blockFooterRow}>
                <SimulatorButton
                    tone="primary"
                    className={simLayout.blockButton}
                    onClick={() => onAction(SimulatorActions.sendReply())}
                    aria-label="Reply"
                >
                    Reply
                </SimulatorButton>
                <SimulatorButton tone="secondary" className={simLayout.blockButton} onClick={onBack} aria-label="Forward">
                    Forward
                </SimulatorButton>
                <SimulatorButton tone="secondary" className={simLayout.blockButton} onClick={onBack} aria-label="Dispose">
                    Dispose
                </SimulatorButton>
                <SimulatorButton
                    tone="secondary"
                    className={simLayout.blockButton}
                    onClick={() => onBack?.()}
                    aria-label="Cancel"
                >
                    Cancel
                </SimulatorButton>
            </div>
        </div>
    );
}
