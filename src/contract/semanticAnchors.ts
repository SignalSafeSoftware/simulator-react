/** Stable semantic targets shared by simulator composition and host guidance overlays. */
export type SimulatorSemanticAnchor =
    | { kind: 'simulator'; anchor: 'screen' | 'home-control'; recordId?: never }
    | {
          kind: 'simulator';
          anchor:
              | 'email-row'
              | 'email-body'
              | 'conversation-row'
              | 'conversation-body'
              | 'contact-row'
              | 'contact-detail'
              | 'browser-page';
          recordId: string;
      };

/** The package owns these DOM hooks; hosts never depend on labels or presentation classes. */
export function simulatorAnchorAttributes(anchor: SimulatorSemanticAnchor): {
    'data-simulator-anchor': SimulatorSemanticAnchor['anchor'];
    'data-simulator-record-id'?: string;
} {
    return {
        'data-simulator-anchor': anchor.anchor,
        ...(anchor.recordId === undefined ? {} : { 'data-simulator-record-id': anchor.recordId }),
    };
}

/** Exact identity matching deliberately avoids selector interpolation and case normalization. */
export function simulatorAnchorElements(
    root: HTMLElement,
    anchor: SimulatorSemanticAnchor,
): HTMLElement[] {
    return [...root.querySelectorAll<HTMLElement>('[data-simulator-anchor]')].filter(
        (element) =>
            element.dataset.simulatorAnchor === anchor.anchor &&
            element.dataset.simulatorRecordId === anchor.recordId,
    );
}
