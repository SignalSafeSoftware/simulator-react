/**
 * Simulator styling tokens. Wireframe-aligned visual language across shell, local nav,
 * list rows, detail screens, and app chrome. UI-kit agnostic `simulator-*` class hooks.
 */

import {
    SIM_BADGE,
    SIM_BORDER,
    SIM_BORDER_SECONDARY,
    SIM_FLEX,
    SIM_FLEX_ROW,
    SIM_INPUT,
    SIM_LIST,
    SIM_MUTED,
    joinClasses,
} from './ui/simulatorClasses';

/** Spacing: section gaps, block padding, action bar. */
export const simSpacing = {
    sectionGap: 'simulator-spacing--section',
    sectionGapTight: 'simulator-spacing--section-tight',
    blockPadding: 'simulator-spacing--block',
    blockPaddingCompact: 'simulator-spacing--block-compact',
    actionsBarTop: 'simulator-spacing--actions-top',
    dividerTop: 'simulator-spacing--divider-top',
    gap2: 'simulator-spacing--gap',
    stackGap: 'simulator-spacing--stack-gap',
} as const;

/**
 * Wireframe screen chrome: centered screen header (Calls, Inbox, Store, etc.).
 */
export const simScreen = {
    header: joinClasses(
        'simulator-text--center',
        SIM_BORDER_SECONDARY,
        'simulator-screen__header',
        'simulator-text--sm',
        'simulator-text--semibold',
    ),
} as const;

/** Borders and containers. Wireframe: rectangular for list rows, tiles, and blocks. */
export const simBorder = {
    block: joinClasses(SIM_BORDER, SIM_BORDER_SECONDARY, 'simulator-surface--light'),
    card: joinClasses(SIM_BORDER, SIM_BORDER_SECONDARY, 'simulator-surface--card'),
    list: joinClasses(SIM_LIST, SIM_BORDER_SECONDARY, 'simulator-list--flush'),
    tile: joinClasses(SIM_BORDER, SIM_BORDER_SECONDARY),
} as const;

/** Typography: aligned with wireframe labels and hierarchy. */
export const simTypo = {
    sectionHeading: 'simulator-heading simulator-heading--section',
    subheading: 'simulator-heading simulator-heading--sub',
    secondary: joinClasses('simulator-text--sm', SIM_MUTED),
    secondaryTight: joinClasses('simulator-text--sm', SIM_MUTED, 'simulator-spacing--section-tight'),
    bodySmall: joinClasses('simulator-text--sm', 'simulator-text--body'),
    emptyState: joinClasses(SIM_MUTED, 'simulator-text--sm', 'simulator-text--empty'),
    emptyStateNoResultsMessage: (query: string): string => `No results for "${query}".`,
    backBarTitle: joinClasses('simulator-text--medium', SIM_MUTED, 'simulator-text--sm'),
    rowPrimary: joinClasses('simulator-text--semibold', 'simulator-text--body'),
    rowPrimaryEmphasis: joinClasses('simulator-text--bold', 'simulator-text--body'),
} as const;

/** Back bar (detail views). */
export const simBackBar = {
    container: joinClasses(SIM_FLEX, 'simulator-flex--align-center', simSpacing.gap2, simSpacing.sectionGap),
    title: simTypo.backBarTitle,
} as const;

/** Action bar (flex row for Report, Check contact, links). */
export const simActionsBar = joinClasses(SIM_FLEX_ROW, 'simulator-flex--wrap', simSpacing.gap2, 'simulator-flex--align-center');

/** Combined: actions bar with top spacing. */
export const simActionsBarWithTop = `${simSpacing.actionsBarTop} ${simActionsBar}`;

/** List row density. */
export const simListRow = {
    base: joinClasses(SIM_FLEX, 'simulator-list__row', SIM_BORDER_SECONDARY),
    default: 'simulator-list__row--default',
    compact: 'simulator-list__row--compact',
} as const;

/** Shared input/chrome. */
export const simInput = {
    control: joinClasses(SIM_INPUT, SIM_BORDER_SECONDARY),
} as const;

/** Status and badges. */
export const simBadge = {
    tag: joinClasses(SIM_BADGE, 'simulator-badge--tag'),
} as const;

/** Local app nav (Phone tabs, Email Inbox/Outbox/Trash, etc.). */
export const simLocalNav = {
    container: joinClasses(SIM_FLEX, SIM_BORDER_SECONDARY, 'simulator-local-nav'),
    inactive: 'simulator-local-nav__segment simulator-local-nav__segment--inactive',
    active: 'simulator-local-nav__segment simulator-local-nav__segment--active',
} as const;

/** Status/emphasis (error/warning fallbacks). */
export const simStatus = {
    errorBox: joinClasses(SIM_BORDER, 'simulator-border--danger', 'simulator-surface--light', 'simulator-text--sm'),
    warningBox: joinClasses(SIM_BORDER, 'simulator-border--warning', 'simulator-surface--light', 'simulator-text--sm'),
} as const;
