/**
 * Maps API SimulatorTemplateDetail (and optional run/attempt ids) to SimulatorTemplatePayload.
 * Source of truth: backend resolves to full-device payload (simulator_json when set, else
 * derived from content_json/channel). API returns that as detail.simulator. This adapter
 * reads detail.simulator only; content_json is never used for session state. When simulator
 * is missing or has no entry_point, returns an empty payload so the shell does not crash.
 */

import type {
    SimulatorTemplatePayload,
    SimulatorChannel,
} from '../types/session';
import type { SimulatorApp, SimulatorEntryPoint, SimulatorTemplateDetail } from '../types/portableSimulator';
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
} from './fullDeviceToSession';

function stringOr(value: unknown, fallback = ''): string {
    return typeof value === 'string' ? value : fallback;
}

function normalizeTemplateName(detail: SimulatorTemplateDetail): string {
    return stringOr(detail.name, stringOr(detail.key, 'Simulator'));
}

function normalizeTopicTags(detail: SimulatorTemplateDetail): Array<{ key: string; name: string }> {
    return (detail.topics ?? []).map((t, index) => ({
        key: stringOr(t.key, `topic-${index}`),
        name: stringOr(t.name, stringOr(t.key, `Topic ${index + 1}`)),
    }));
}

function isSimulatorApp(value: unknown): value is SimulatorApp {
    return value === 'phone' || value === 'email' || value === 'messages' || value === 'internet' || value === 'home';
}

function normalizeEntryPoint(entryPoint: unknown): SimulatorEntryPoint | null {
    if (entryPoint == null || typeof entryPoint !== 'object') {
        return null;
    }
    const raw = entryPoint as { app?: unknown; screen?: unknown };
    if (!isSimulatorApp(raw.app)) {
        return null;
    }
    return {
        app: raw.app,
        screen: stringOr(raw.screen),
    };
}

/** Stable empty payload shape (all keys set, app slices null). */
function emptyPayload(
    templateId: number | null,
    templateKey: string,
    name: string,
    channel: SimulatorChannel,
    topicTags: Array<{ key: string; name: string }>,
    runId: number | null,
    attemptId: number | null
): SimulatorTemplatePayload {
    return {
        templateId,
        templateKey,
        name,
        channel,
        topicTags,
        runId,
        attemptId,
        entryPoint: null,
        device: null,
        email: null,
        sms: null,
        browser: null,
        phone: null,
        contacts: null,
        directory: null,
        home: null,
    };
}

function mapChannelFromLegacy(channel: string): SimulatorChannel {
    const c = (channel ?? '').toLowerCase();
    if (c === 'email') return 'email';
    if (c === 'sms') return 'sms';
    if (c === 'browser') return 'browser';
    if (c === 'phone') return 'phone';
    return 'email';
}

/** True if detail has a usable full-device simulator payload (entry_point present). */
function hasFullDevicePayload(detail: SimulatorTemplateDetail): boolean {
    const sim = detail.simulator;
    return (
        sim != null &&
        typeof sim === 'object' &&
        sim.entry_point != null &&
        typeof sim.entry_point === 'object' &&
        typeof sim.entry_point.app === 'string'
    );
}

/** Build payload from full-device simulator object (API shape from simulator_json or derived). */
function buildFromFullDevice(
    detail: SimulatorTemplateDetail,
    options: { runId?: number | null; attemptId?: number | null }
): SimulatorTemplatePayload {
    const sim = detail.simulator;
    if (sim == null || typeof sim !== 'object') {
        return emptyPayload(
            detail.id,
            stringOr(detail.key),
            normalizeTemplateName(detail),
            mapChannelFromLegacy(detail.channel),
            normalizeTopicTags(detail),
            options.runId ?? null,
            options.attemptId ?? null
        );
    }
    const topicTags = normalizeTopicTags(detail);
    const entryPoint = normalizeEntryPoint(sim.entry_point);
    const channel = getPayloadChannel(detail.channel, entryPoint);
    const base = emptyPayload(
        detail.id,
        stringOr(detail.key),
        normalizeTemplateName(detail),
        channel,
        topicTags,
        options.runId ?? null,
        options.attemptId ?? null
    );
    return {
        ...base,
        entryPoint,
        device: mapDevice(sim.device),
        email: mapEmail(sim.email),
        sms: mapMessages(sim.messages),
        browser: mapInternet(sim.internet),
        phone: mapPhone(sim.phone),
        contacts: (() => {
            const list = mapContacts(sim.contacts);
            return list.length > 0 ? list : null;
        })(),
        directory: mapDirectory((sim as { directory?: unknown }).directory),
        home: mapHome(sim.home),
    };
}

function getPayloadChannel(
    legacyChannel: string,
    entryPoint: SimulatorEntryPoint | null
): SimulatorChannel {
    if (entryPoint != null) {
        return appToChannel(entryPoint.app);
    }
    return mapChannelFromLegacy(legacyChannel);
}

/**
 * Build unified SimulatorTemplatePayload from API template detail.
 * Uses detail.simulator (always set by API via payload_resolution). When simulator is missing
 * or has no entry_point (e.g. bad or test data), returns an empty payload with channel from
 * detail.channel so the shell remains stable.
 */
export function templateDetailToPayload(
    detail: SimulatorTemplateDetail,
    options: { runId?: number | null; attemptId?: number | null } = {}
): SimulatorTemplatePayload {
    if (hasFullDevicePayload(detail)) {
        return buildFromFullDevice(detail, options);
    }
    const channel = mapChannelFromLegacy(detail.channel ?? 'email');
    return emptyPayload(
        detail.id,
        stringOr(detail.key),
        normalizeTemplateName(detail),
        channel,
        normalizeTopicTags(detail),
        options.runId ?? null,
        options.attemptId ?? null
    );
}
