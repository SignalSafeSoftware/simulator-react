/** Add API template identity to the canonical full-device session conversion. */
import type { SimulatorTemplatePayload } from '../types/session.js';
import type { SimulatorTemplateDetail } from '../types/template.js';
import { fullDeviceToPayload } from './deviceToSession.js';

function stringOr(value: unknown, fallback = ''): string {
    return typeof value === 'string' ? value : fallback;
}

export function templateDetailToPayload(
    detail: SimulatorTemplateDetail,
    options: { runId?: number | null; attemptId?: number | null } = {},
): SimulatorTemplatePayload {
    return fullDeviceToPayload(detail.simulator, {
        templateId: detail.id,
        templateKey: stringOr(detail.key),
        name: stringOr(detail.name, stringOr(detail.key, 'Simulator')),
        topicTags: (detail.topics ?? []).map((topic, index) => ({
            key: stringOr(topic.key, `topic-${index}`),
            name: stringOr(topic.name, stringOr(topic.key, `Topic ${index + 1}`)),
        })),
        ...options,
    });
}
