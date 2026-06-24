/**
 * Simulator styling tokens. Wireframe-aligned visual language across shell, local nav,
 * list rows, detail screens, and app chrome. Bootstrap-based; simulator-scoped only.
 */

/** Spacing: section gaps, block padding, action bar. */
export const simSpacing = {
    sectionGap: 'mb-3',
    sectionGapTight: 'mb-2',
    blockPadding: 'p-3',
    blockPaddingCompact: 'p-2',
    actionsBarTop: 'mt-3 pt-2 border-top',
    dividerTop: 'mt-3 pt-3 border-top',
    gap2: 'gap-2',
    stackGap: 'gap-2',
} as const;

/**
 * Wireframe screen chrome: centered screen header (Calls, Inbox, Store, etc.).
 * Use above content or local nav for consistent app headers.
 */
export const simScreen = {
    /** Centered header bar: border-bottom, small fw-semibold. */
    header: 'text-center border-bottom border-secondary py-2 mb-2 small fw-semibold text-body',
} as const;

/**
 * Borders and containers. Wireframe: rectangular (rounded-0) for list rows, tiles, and blocks.
 */
export const simBorder = {
    /** Bordered content block (metadata, transcript). Rectangular. */
    block: 'border border-secondary rounded-0 bg-light',
    /** Card-style container. Rectangular. */
    card: 'border border-secondary rounded-0 shadow-sm',
    /** List container (SimulatorList). Flat, rectangular rows. */
    list: 'list-group-flush rounded-0 overflow-hidden border border-secondary',
    /** Tile or launcher. Slightly rounded for tap targets. */
    tile: 'border border-secondary rounded-0',
} as const;

/** Typography: aligned with wireframe labels and hierarchy. */
export const simTypo = {
    /** Section heading; prefer simScreen.header for app screens. */
    sectionHeading: 'h6 mb-3 text-secondary',
    subheading: 'h6 mb-2',
    secondary: 'small text-muted',
    secondaryTight: 'small text-muted mb-2',
    bodySmall: 'small text-dark',
    emptyState: 'text-muted small mb-0',
    emptyStateNoResultsMessage: (query: string): string => `No results for "${query}".`,
    backBarTitle: 'fw-medium text-secondary small',
    rowPrimary: 'fw-semibold text-dark',
    rowPrimaryEmphasis: 'fw-bold text-dark',
} as const;

/** Back bar (detail views). Wireframe: simple link-style back. */
export const simBackBar = {
    container: 'd-flex align-items-center gap-2 mb-3',
    title: simTypo.backBarTitle,
} as const;

/** Action bar (flex row for Report, Check contact, links). */
export const simActionsBar = 'd-flex flex-wrap gap-2 align-items-center';

/** Combined: actions bar with top spacing. */
export const simActionsBarWithTop = `${simSpacing.actionsBarTop} ${simActionsBar}`;

/** List row density. Wireframe: flat rows, clear separation. */
export const simListRow = {
    base: 'd-flex border-0 border-bottom border-secondary',
    default: 'align-items-start py-3 px-3',
    compact: 'align-items-center py-2 px-2',
} as const;

/**
 * Shared input/chrome. Wireframe: rectangular inputs and search bars.
 */
export const simInput = {
    /** Search and text inputs: rectangular, consistent with chrome. */
    control: 'rounded-0 border border-secondary',
} as const;

/**
 * Status and badges. Wireframe: rectangular tags (e.g. Read/Unread, Incoming).
 */
export const simBadge = {
    tag: 'badge rounded-0',
} as const;

/**
 * Local app nav (Phone tabs, Email Inbox/Outbox/Trash, etc.). Wireframe: single rectangular bar.
 */
export const simLocalNav = {
    /** Container: full-width bar, segment dividers. */
    container: 'd-flex border-bottom border-secondary',
    /** Inactive segment. */
    inactive: 'bg-light text-body',
    /** Active segment. */
    active: 'bg-secondary text-white',
} as const;

/** Status/emphasis (error/warning fallbacks). */
export const simStatus = {
    errorBox: 'border border-danger rounded-0 bg-light small',
    warningBox: 'border border-warning rounded-0 bg-light small',
} as const;
