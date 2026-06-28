/**
 * Simulator styling tokens. Wireframe-aligned visual language across shell, local nav,
 * list rows, detail screens, and app chrome. UI-kit agnostic `simulator-*` class hooks.
 */

import {
    SIM_BADGE,
    SIM_BORDER,
    SIM_BORDER_BOTTOM,
    SIM_BORDER_SECONDARY,
    SIM_BORDER_TOP,
    SIM_FLEX,
    SIM_FLEX_BETWEEN,
    SIM_FLEX_CENTER,
    SIM_FLEX_COL,
    SIM_FLEX_GROW_1,
    SIM_FLEX_ROW,
    SIM_FLEX_SHRINK_0,
    SIM_INPUT,
    SIM_LIST_FLUSH,
    SIM_MIN_H_0,
    SIM_MUTED,
    SIM_OVERFLOW_AUTO,
    SIM_OVERFLOW_HIDDEN,
    SIM_ROUNDED_NONE,
    SIM_SHELL_BODY,
    SIM_SHELL_FRAME,
    SIM_SHELL_NAV,
    SIM_SURFACE_AVATAR,
    SIM_SURFACE_SELECTED,
    SIM_SURFACE_WHITE,
    SIM_TEXT_BODY,
    SIM_TEXT_SEMIBOLD,
    SIM_TEXT_SM,
    SIM_W_FULL,
    SIM_AVATAR,
    joinClasses,
} from './ui/simulatorClasses.js';

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
    mb0: 'simulator-spacing--mb-0',
    mb1: 'simulator-spacing--mb-1',
    mb2: 'simulator-spacing--mb-2',
    mb3: 'simulator-spacing--mb-3',
    mt1: 'simulator-spacing--mt-1',
    mt2: 'simulator-spacing--mt-2',
    mt3: 'simulator-spacing--mt-3',
    me1: 'simulator-spacing--me-1',
    me2: 'simulator-spacing--me-2',
    ms1: 'simulator-spacing--ms-1',
    ms2: 'simulator-spacing--ms-2',
    py1: 'simulator-spacing--py-1',
    py2: 'simulator-spacing--py-2',
    py3: 'simulator-spacing--py-3',
    px2: 'simulator-spacing--px-2',
    px1: 'simulator-spacing--px-1',
    px3: 'simulator-spacing--px-3',
    pt3: 'simulator-spacing--pt-3',
    pt2: 'simulator-spacing--pt-2',
    p2: 'simulator-spacing--p-2',
    p3: 'simulator-spacing--p-3',
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
    list: joinClasses(SIM_LIST_FLUSH, SIM_BORDER_SECONDARY),
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

/** Common layout patterns for screen bodies and scroll regions. */
export const simLayout = {
    screenColumn: joinClasses(SIM_FLEX_COL, SIM_FLEX_GROW_1, SIM_MIN_H_0),
    scrollBody: joinClasses(SIM_FLEX_GROW_1, SIM_MIN_H_0, 'simulator-overflow-auto'),
    row: joinClasses(SIM_FLEX_ROW, 'simulator-flex--align-center'),
    rowBetween: joinClasses(SIM_FLEX_BETWEEN, 'simulator-flex--align-center'),
    stack: joinClasses(SIM_FLEX_COL, simSpacing.stackGap),
    actionsRow: joinClasses(SIM_FLEX_ROW, simSpacing.gap2, 'simulator-flex--wrap', 'simulator-flex--align-center'),
    footerActions: joinClasses('simulator-spacing--p-2', SIM_FLEX_SHRINK_0, 'simulator-spacing--mt-auto', SIM_FLEX_COL, simSpacing.gap2),
    headerRowBetween: joinClasses(
        SIM_FLEX_BETWEEN,
        'simulator-flex--align-center',
        SIM_BORDER_BOTTOM,
        simSpacing.py2,
        simSpacing.sectionGap,
        SIM_TEXT_SM,
        SIM_TEXT_SEMIBOLD,
        SIM_TEXT_BODY,
    ),
    fieldLabel: joinClasses(SIM_TEXT_SM, 'simulator-text--medium', SIM_TEXT_BODY),
    blockFooterRow: joinClasses(SIM_FLEX_ROW, simSpacing.gap2, simSpacing.p2, SIM_FLEX_SHRINK_0, 'simulator-spacing--mt-auto', 'simulator-flex--wrap'),
    blockButton: joinClasses(SIM_ROUNDED_NONE, 'simulator-btn--block', simSpacing.py2, SIM_FLEX_GROW_1),
} as const;

/** Device shell chrome (PhoneSimulatorShell). */
export const simShell = {
    header: joinClasses(
        SIM_FLEX,
        'simulator-flex--align-center',
        simSpacing.px2,
        simSpacing.py2,
        SIM_SURFACE_WHITE,
        SIM_BORDER_BOTTOM,
        SIM_TEXT_SM,
    ),
    headerBetween: joinClasses(
        SIM_FLEX,
        SIM_FLEX_BETWEEN,
        'simulator-flex--align-center',
        simSpacing.px2,
        simSpacing.py2,
        SIM_SURFACE_WHITE,
        SIM_BORDER_BOTTOM,
        SIM_TEXT_SM,
    ),
    headerEnd: joinClasses(
        SIM_FLEX,
        'simulator-flex--end',
        'simulator-flex--align-center',
        simSpacing.px2,
        simSpacing.py2,
        SIM_SURFACE_WHITE,
        SIM_BORDER_BOTTOM,
        SIM_TEXT_SM,
    ),
    headerTitle: joinClasses(SIM_TEXT_SEMIBOLD, SIM_TEXT_BODY),
    exitLink: joinClasses('simulator-text--link', SIM_TEXT_BODY),
    outerColumn: joinClasses(
        SIM_FLEX_COL,
        'simulator-spacing--px-0',
        'simulator-spacing--pb-3',
        'simulator-spacing--pt-1',
        'simulator-surface--body-tertiary',
    ),
    outerColumnPadded: joinClasses(
        SIM_FLEX_COL,
        simSpacing.px3,
        'simulator-spacing--pb-3',
        'simulator-spacing--pt-1',
        'simulator-surface--body-tertiary',
    ),
    frame: joinClasses(
        SIM_FLEX_COL,
        SIM_OVERFLOW_HIDDEN,
        SIM_SURFACE_WHITE,
        'simulator-border simulator-border--dark',
        SIM_SHELL_FRAME,
    ),
    frameCentered: joinClasses(
        SIM_FLEX_COL,
        SIM_OVERFLOW_HIDDEN,
        SIM_SURFACE_WHITE,
        'simulator-border simulator-border--dark',
        SIM_SHELL_FRAME,
        'simulator-flex--center',
    ),
    frameStretch: joinClasses(
        SIM_FLEX_COL,
        SIM_OVERFLOW_HIDDEN,
        SIM_SURFACE_WHITE,
        'simulator-border simulator-border--dark',
        SIM_SHELL_FRAME,
        SIM_W_FULL,
        'simulator-flex--stretch',
    ),
    body: joinClasses(
        SIM_FLEX_GROW_1,
        SIM_MIN_H_0,
        SIM_FLEX_COL,
        SIM_OVERFLOW_AUTO,
        simSpacing.p3,
        SIM_SHELL_BODY,
    ),
    nav: joinClasses(SIM_FLEX, SIM_BORDER_TOP, SIM_SHELL_NAV),
    navTab: 'simulator-shell__nav-tab',
    navTabBorderEnd: 'simulator-shell__nav-tab--border-end',
    navTabActive: 'simulator-shell__nav-tab--active',
    navTabInactive: 'simulator-shell__nav-tab--inactive',
    navTabLabel: joinClasses('simulator-opacity--90'),
} as const;

/** Profile / list avatar placeholder. */
export const simAvatar = {
    icon: joinClasses(SIM_AVATAR, SIM_SURFACE_AVATAR, SIM_FLEX_CENTER, SIM_FLEX_SHRINK_0),
} as const;

/** Selectable inbox/thread row surfaces. */
export const simRowSurface = {
    selectable: joinClasses(SIM_FLEX, SIM_W_FULL, 'simulator-flex--align-start', simSpacing.gap2, 'simulator-spacing--py-3', 'simulator-spacing--px-2', SIM_BORDER_SECONDARY, SIM_ROUNDED_NONE, 'simulator-text--start'),
    selected: SIM_SURFACE_SELECTED,
    default: SIM_SURFACE_WHITE,
} as const;
