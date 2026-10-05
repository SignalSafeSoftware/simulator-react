import type { SimulatorEntryPoint } from '@signalsafe/simulator-core/devicePayload';

/** An app and screen pair where the app is not narrowed to the closed app set. */
export interface AppScreenRef {
    app: string;
    screen: string;
}

/** An entry point whose app is a known simulator app. */
export type KnownAppScreenRef = SimulatorEntryPoint;

/** A link that may carry only an href. */
export interface HrefLink {
    href?: string;
}

/** A browser page reference used for link resolution. */
export interface PageRef {
    id?: string;
    url?: string;
}

/** A half-open character range inside a string. */
export interface TextSpan {
    start: number;
    end: number;
}

/** A topic tag attached to a scenario. */
export interface TopicTag {
    key: string;
    name: string;
}

/** A button on a mock browser page. */
export interface BrowserPageButton {
    label: string;
    href?: string;
    targetPageId?: string;
}

/** An id and label pair used for local navigation entries. */
export interface LabeledItem {
    id: string;
    label: string;
}
