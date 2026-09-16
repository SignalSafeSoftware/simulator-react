import { simulatorEnglish } from './i18n/catalog.js';
/**
 * Workspace simulator UI and behavior constants. Single place for magic values
 * used across shell, views, adapters, and debug/fallback UI.
 */

/** Default page id after browser form submit when payload does not specify submitTargetPageId. */
export const DEFAULT_BROWSER_SUBMIT_TARGET = 'result';

/** Default label for shell exit/cancel when in run or preview. */
export const SHELL_EXIT_LABEL = simulatorEnglish['fallback.shell_exit_label'];

/** Snapshot copy feedback duration (ms). */
export const SNAPSHOT_COPY_FEEDBACK_MS = 2000;

// ---------------------------------------------------------------------------
// Learner-safe fallback copy (default runtime UI)
// ---------------------------------------------------------------------------

/** Shown when simulator content fails to render (learner-facing default). */
export const LEARNER_SIMULATOR_ERROR_TITLE = simulatorEnglish['fallback.learner_simulator_error_title'];

/** Shown when simulator content fails to render (learner-facing default). */
export const LEARNER_SIMULATOR_ERROR_MESSAGE = simulatorEnglish['fallback.learner_simulator_error_message'];

/** Shown when the screen registry cannot resolve a screen (learner-facing default). */
export const LEARNER_UNSUPPORTED_SCREEN_TITLE = simulatorEnglish['fallback.learner_unsupported_screen_title'];

/** Shown when the screen registry cannot resolve a screen (learner-facing default). */
export const LEARNER_UNSUPPORTED_SCREEN_MESSAGE = simulatorEnglish['fallback.learner_unsupported_screen_message'];

// ---------------------------------------------------------------------------
// Unsupported screen fallback (author/dev diagnostics via showDiagnostics)
// ---------------------------------------------------------------------------

export const UNSUPPORTED_SCREEN_TITLE = simulatorEnglish['fallback.unsupported_screen_title'];
export const UNSUPPORTED_SCREEN_EMPTY_PLACEHOLDER = simulatorEnglish['fallback.unsupported_screen_empty_placeholder'];
export const UNSUPPORTED_SCREEN_HINT = simulatorEnglish['fallback.unsupported_screen_hint'];
