/** UI-kit agnostic layout and shell class hooks (host styles via CSS or UI library). */

export const SIM_CARD = 'simulator-card';
export const SIM_CARD_HEADER = 'simulator-card__header';
export const SIM_CARD_BODY = 'simulator-card__body';

export const SIM_LIST = 'simulator-list';
export const SIM_LIST_FLUSH = 'simulator-list simulator-list--flush';
export const SIM_LIST_ITEM = 'simulator-list__item';
export const SIM_LIST_ITEM_ACTION = 'simulator-list__item--action';
export const SIM_LIST_ITEM_ACTIVE = 'simulator-list__item--active';

export const SIM_BTN = 'simulator-btn';
export const SIM_BTN_SM = 'simulator-btn--sm';
export const SIM_BTN_BLOCK = 'simulator-btn--block';
export const SIM_INPUT = 'simulator-input';
export const SIM_INPUT_SM = 'simulator-input--sm';
export const SIM_FIELD = 'simulator-field';
export const SIM_FIELD_LABEL = 'simulator-field__label';

export const SIM_ALERT = 'simulator-alert';
export const SIM_MODAL = 'simulator-modal';
export const SIM_MODAL_DIALOG = 'simulator-modal__dialog';
export const SIM_MODAL_BODY = 'simulator-modal__body';

export const SIM_FLEX = 'simulator-flex';
export const SIM_FLEX_COL = 'simulator-flex simulator-flex--column';
export const SIM_FLEX_ROW = 'simulator-flex simulator-flex--row';
export const SIM_FLEX_BETWEEN = 'simulator-flex simulator-flex--between';
export const SIM_FLEX_CENTER = 'simulator-flex simulator-flex--center';
export const SIM_FLEX_GROW_1 = 'simulator-flex-grow-1';
export const SIM_FLEX_SHRINK_0 = 'simulator-flex-shrink-0';
export const SIM_MIN_H_0 = 'simulator-min-h-0';
export const SIM_MIN_W_0 = 'simulator-min-w-0';
export const SIM_OVERFLOW_AUTO = 'simulator-overflow-auto';
export const SIM_OVERFLOW_HIDDEN = 'simulator-overflow-hidden';
export const SIM_W_FULL = 'simulator-w-full';

export const SIM_MUTED = 'simulator-muted';
export const SIM_HIDDEN = 'simulator-hidden';
export const SIM_BADGE = 'simulator-badge';
export const SIM_BORDER = 'simulator-border';
export const SIM_BORDER_SECONDARY = 'simulator-border simulator-border--secondary';
export const SIM_BORDER_BOTTOM = 'simulator-border simulator-border--bottom';
export const SIM_BORDER_TOP = 'simulator-border simulator-border--top';

export const SIM_ROUNDED_NONE = 'simulator-rounded--none';
export const SIM_SURFACE_LIGHT = 'simulator-surface--light';
export const SIM_SURFACE_WHITE = 'simulator-surface--white';
export const SIM_SURFACE_MUTED = 'simulator-surface--muted';
export const SIM_SURFACE_CARD = 'simulator-surface--card';
export const SIM_SURFACE_AVATAR = 'simulator-surface--avatar';
export const SIM_SURFACE_SELECTED = 'simulator-surface--selected';

export const SIM_TEXT_SM = 'simulator-text--sm';
export const SIM_TEXT_SEMIBOLD = 'simulator-text--semibold';
export const SIM_TEXT_MEDIUM = 'simulator-text--medium';
export const SIM_TEXT_BOLD = 'simulator-text--bold';
export const SIM_TEXT_BODY = 'simulator-text--body';
export const SIM_TEXT_DARK = 'simulator-text--dark';
export const SIM_TEXT_DANGER = 'simulator-text--danger';
export const SIM_TEXT_CENTER = 'simulator-text--center';
export const SIM_TEXT_START = 'simulator-text--start';
export const SIM_MONO = 'simulator-mono';

export const SIM_AVATAR = 'simulator-avatar';
export const SIM_SHELL_FRAME = 'simulator-shell__frame';
export const SIM_SHELL_BODY = 'simulator-shell__body';
export const SIM_SHELL_NAV = 'simulator-shell__nav';

export function simBtnToneClass(tone?: string): string {
    const mapped = normalizeSimBtnTone(tone);
    return `${SIM_BTN} simulator-btn--${mapped}`;
}

export function simAlertToneClass(tone: 'warning' | 'danger' | 'info' = 'warning'): string {
    return `${SIM_ALERT} simulator-alert--${tone}`;
}

export function simBadgeToneClass(tone: string): string {
    return `${SIM_BADGE} simulator-badge--${tone}`;
}

function normalizeSimBtnTone(tone?: string): string {
    if (!tone) return 'neutral';
    const map: Record<string, string> = {
        primary: 'primary',
        secondary: 'neutral',
        success: 'success',
        danger: 'danger',
        neutral: 'neutral',
        link: 'link',
        light: 'light',
        dark: 'dark',
        'outline-primary': 'primary-outline',
        'outline-secondary': 'neutral-outline',
        'outline-dark': 'dark-outline',
    };
    return map[tone] ?? tone.replace(/^outline-/, '');
}

export function joinClasses(...parts: Array<string | false | null | undefined>): string {
    return parts.filter(Boolean).join(' ');
}
