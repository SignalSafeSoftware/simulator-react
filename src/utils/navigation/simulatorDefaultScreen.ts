import {
    SimulatorEmailScreenId,
    SimulatorHomeScreenId,
    SimulatorMessagesScreenId,
    SimulatorPhoneScreenId,
} from '@signalsafe/simulator-core/devicePayload';
import { SimulatorApp } from '@signalsafe/simulator-core/simulatorApp';
import { DEFAULT_INTERNET_SCREEN, type SimulatorTemplatePayload } from '../../types/session.js';

type DefaultScreenResolver = (payload: SimulatorTemplatePayload) => string;

const RESOLVERS: Readonly<Record<SimulatorApp, DefaultScreenResolver>> = Object.freeze({
    [SimulatorApp.Email]: () => SimulatorEmailScreenId.List,
    [SimulatorApp.Messages]: () => SimulatorMessagesScreenId.Threads,
    [SimulatorApp.Phone]: () => SimulatorPhoneScreenId.History,
    [SimulatorApp.Internet]: (payload) =>
        payload.browser?.defaultPageId ??
        payload.browser?.pages?.[0]?.id ??
        DEFAULT_INTERNET_SCREEN,
    [SimulatorApp.Home]: () => SimulatorHomeScreenId.Home,
});

/** First screen an app shows for a payload, before any author-set secondary default. */
export function resolveDefaultEntryScreen(
    app: SimulatorApp,
    payload: SimulatorTemplatePayload,
): string {
    return (RESOLVERS[app] ?? RESOLVERS[SimulatorApp.Email])(payload);
}
