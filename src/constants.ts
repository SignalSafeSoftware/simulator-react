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
// Learner-safe fallback copy (default runtime UI)
// ---------------------------------------------------------------------------

/** Shown when simulator content fails to render (learner-facing default). */
export const LEARNER_SIMULATOR_ERROR_TITLE =
    'This part of the simulation could not be displayed.';

/** Shown when simulator content fails to render (learner-facing default). */
export const LEARNER_SIMULATOR_ERROR_MESSAGE =
    'The simulation encountered a problem. Please continue or ask your trainer.';

/** Shown when the screen registry cannot resolve a screen (learner-facing default). */
export const LEARNER_UNSUPPORTED_SCREEN_TITLE =
    'This part of the simulation could not be displayed.';

/** Shown when the screen registry cannot resolve a screen (learner-facing default). */
export const LEARNER_UNSUPPORTED_SCREEN_MESSAGE =
    'Try another section of the simulation or ask your trainer for help.';

// ---------------------------------------------------------------------------
// Unsupported screen fallback (author/dev diagnostics via showDiagnostics)
// ---------------------------------------------------------------------------

export const UNSUPPORTED_SCREEN_TITLE = 'Unsupported screen';
export const UNSUPPORTED_SCREEN_EMPTY_PLACEHOLDER = '(empty)';
export const UNSUPPORTED_SCREEN_HINT =
    'Use the tabs above to switch app, or check template configuration.';
