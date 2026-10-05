import type { SimulatorDevicePayload } from '@signalsafe/simulator-core/devicePayload';
import type { TopicTag } from '../types/shapes.js';
import { isSimulatorApp } from '@signalsafe/simulator-core/simulatorApp';
import type { SimulatorTemplatePayload } from '../types/session.js';
import {
    appToChannel,
    mapDevice,
    mapContacts,
    mapDirectory,
    mapEmail,
    mapMessages,
    mapPhone,
    mapInternet,
    mapHome,
} from './fullDeviceToSession.js';

/** Optional template/session identity supplied by the host transport adapter. */
export interface SimulatorPayloadMetadata {
    templateId?: number | null;
    templateKey?: string;
    name?: string;
    topicTags?: TopicTag[];
    runId?: number | null;
    attemptId?: number | null;
}

/** Convert full-device content directly, independently of any API template DTO. */
export function fullDeviceToPayload(
    value: SimulatorDevicePayload,
    metadata: SimulatorPayloadMetadata = {},
): SimulatorTemplatePayload {
    const entry = value?.entry_point;
    if (!entry || !isSimulatorApp(entry.app)) {
        throw new Error('Invalid simulator entry_point: a supported app is required.');
    }
    const contacts = mapContacts(value.contacts);
    return {
        templateId: metadata.templateId ?? null,
        templateKey: metadata.templateKey ?? 'simulator-device',
        name: metadata.name ?? 'Simulator',
        topicTags: metadata.topicTags ?? [],
        runId: metadata.runId ?? null,
        attemptId: metadata.attemptId ?? null,
        channel: appToChannel(entry.app),
        entryPoint: {
            app: entry.app,
            screen: typeof entry.screen === 'string' ? entry.screen : '',
        },
        device: mapDevice(value.device),
        email: mapEmail(value.email),
        sms: mapMessages(value.messages),
        browser: mapInternet(value.internet),
        phone: mapPhone(value.phone),
        contacts: contacts.length ? contacts : null,
        directory: mapDirectory(value.directory),
        home: mapHome(value.home),
    };
}
