/**
 * Workspace simulator UI and behavior constants. Single place for magic values
 * used across shell, views, adapters, and debug/fallback UI.
 */

/** Default page id after browser form submit when payload does not specify submitTargetPageId. */
export const DEFAULT_BROWSER_SUBMIT_TARGET = 'result';

/** Default label for shell exit/cancel when in run or preview. */
export const SHELL_EXIT_LABEL = 'Exit';

/** Snapshot copy feedback duration (ms). */
export const SNAPSHOT_COPY_FEEDBACK_MS = 2000;

// ---------------------------------------------------------------------------
// Unsupported screen fallback (dev/admin)
// ---------------------------------------------------------------------------

export const UNSUPPORTED_SCREEN_TITLE = 'Unsupported screen';
export const UNSUPPORTED_SCREEN_EMPTY_PLACEHOLDER = '(empty)';
export const UNSUPPORTED_SCREEN_HINT =
    'Use the tabs above to switch app, or check template configuration.';
