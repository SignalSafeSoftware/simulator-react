/** Stable semantic class hooks for host styling and DOM targeting (no UI framework). */

export const SIM_RUNTIME = 'simulator-runtime';
export const SIM_RUNTIME_SCREEN = 'simulator-runtime__screen';
export const SIM_RUNTIME_APP_ROOT = 'simulator-runtime__app-root';
export const SIM_RUNTIME_DIAGNOSTICS_BAND = 'simulator-runtime__diagnostics-band';
export const SIM_CHANNEL = 'simulator-channel';
export const SIM_CHANNEL_PHONE = 'simulator-channel--phone';
export const SIM_CHANNEL_EMAIL = 'simulator-channel--email';
export const SIM_CHANNEL_MESSAGES = 'simulator-channel--messages';

export const SIM_PHONE = 'simulator-phone';
export const SIM_PHONE_DIALER = 'simulator-phone__dialer';
export const SIM_PHONE_DIALER_CALL_BUTTON = 'simulator-phone__dialer-call-button';
export const SIM_PHONE_CONTACT_LIST = 'simulator-phone__contact-list';
export const SIM_PHONE_CONTACT_ROW = 'simulator-phone__contact-row';
export const SIM_PHONE_CONTACT_DETAIL = 'simulator-phone__contact-detail';
export const SIM_PHONE_INCOMING_CALL_HISTORY = 'simulator-phone__incoming-call-history';
export const SIM_PHONE_INCOMING_CALL_EXTRA = 'simulator-phone__incoming-call-extra';
export const SIM_PHONE_INCOMING_CALL_AFTER_ACTIONS = 'simulator-phone__incoming-call-after-actions';
export const SIM_PHONE_INCOMING_CALL_SCENE = 'simulator-phone__incoming-call-scene';
export const SIM_PHONE_INCOMING_CALL_AVATAR = 'simulator-phone__incoming-call-avatar';
export const SIM_PHONE_INCOMING_CALL_CALLER_NAME = 'simulator-phone__incoming-call-caller-name';
export const SIM_PHONE_INCOMING_CALL_NUMBER = 'simulator-phone__incoming-call-number';
export const SIM_PHONE_INCOMING_CALL_ACTIONS = 'simulator-phone__incoming-call-actions';
export const SIM_PHONE_CONTACT_ROW_AVATAR = 'simulator-phone__contact-row-avatar';
export const SIM_PHONE_HISTORY_INCOMING_ROW = 'simulator-phone__history-incoming-row';
export const SIM_PHONE_DIALER_NUMBER = 'simulator-phone__dialer-number';
export const SIM_PHONE_DIALER_BACKSPACE = 'simulator-phone__dialer-backspace';

export const SIM_CALL_STATUS_BADGE = 'simulator-call-status-badge';
export const SIM_CALL_STATUS_BADGE_INCOMING = 'simulator-call-status-badge--incoming';
export const SIM_CALL_STATUS_BADGE_MISSED = 'simulator-call-status-badge--missed';
export const SIM_CALL_STATUS_BADGE_OUTBOUND = 'simulator-call-status-badge--outbound';
export const SIM_CALL_STATUS_BADGE_UNKNOWN = 'simulator-call-status-badge--unknown';

export const SIM_EMAIL = 'simulator-email';
export const SIM_EMAIL_INBOX = 'simulator-email__inbox';
export const SIM_EMAIL_MESSAGE_ROW = 'simulator-email__message-row';
export const SIM_EMAIL_MESSAGE_DETAIL = 'simulator-email__message-detail';
export const SIM_EMAIL_MESSAGE_DETAIL_BODY = 'simulator-email__message-detail-body';
export const SIM_EMAIL_STATUS_BADGE = 'simulator-email__status-badge';

export const SIM_MESSAGES = 'simulator-messages';
export const SIM_MESSAGES_THREAD_LIST = 'simulator-messages__thread-list';
export const SIM_MESSAGES_THREAD_ROW = 'simulator-messages__thread-row';
export const SIM_MESSAGES_THREAD_DETAIL = 'simulator-messages__thread-detail';
export const SIM_MESSAGES_MESSAGE_TIMELINE = 'simulator-messages__message-timeline';
export const SIM_MESSAGES_BUBBLE = 'simulator-messages__bubble';
export const SIM_MESSAGES_BUBBLE_THEM = 'simulator-messages__bubble--them';
export const SIM_MESSAGES_BUBBLE_ME = 'simulator-messages__bubble--me';

export const SIM_ERROR = 'simulator-error';
export const SIM_ERROR_DIAGNOSTICS = 'simulator-error__diagnostics';
export const SIM_UNSUPPORTED = 'simulator-unsupported';

/** Map shell bottom-nav channel id to a semantic channel modifier class. */
export function simChannelModifierForShellChannel(channel: string): string | undefined {
    switch (channel) {
        case 'contacts':
            return SIM_CHANNEL_PHONE;
        case 'email':
            return SIM_CHANNEL_EMAIL;
        case 'sms':
            return SIM_CHANNEL_MESSAGES;
        default:
            return undefined;
    }
}
