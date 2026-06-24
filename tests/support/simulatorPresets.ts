/**
 * Partial-world presets for simulator-react package tests.
 * Not part of the `@signalsafe/simulator-react` published API.
 */

import type { SimulatorTemplatePayload, SimulatorChannel, SimulatorWorldPartial } from '@signalsafe/simulator-react';
import { applyPartials } from '@signalsafe/simulator-react';

export const PRESET_EMPLOYEE_CORPORATE_DEVICE: SimulatorWorldPartial = {
    device: {
        mainMenuItems: [
            { id: 'phone', label: 'Phone' },
            { id: 'email', label: 'Email' },
            { id: 'internet', label: 'Internet' },
            { id: 'messages', label: 'Messages' },
            { id: 'home', label: 'Home' },
        ],
        secondaryDefaults: {
            email: 'list',
            messages: 'threads',
            internet: 'landing',
            phone: 'history',
            home: 'home',
        },
    },
    entryPoint: { app: 'email', screen: 'list' },
    contacts: [
        { id: 'it-helpdesk', displayName: 'IT Helpdesk', number: '+15550001111', email: 'it@company.com' },
        { id: 'hr', displayName: 'HR', number: '+15550002222', email: 'hr@company.com' },
    ],
    directory: [
        { id: 'd-it', label: 'IT Helpdesk', number: '+15550001111', description: 'Verify support requests and password resets.' },
        { id: 'd-hr', label: 'HR', number: '+15550002222', url: 'https://hr.company.com', description: 'Benefits and policies.' },
    ],
};

export const PRESET_FAKE_BANK_CONSUMER: SimulatorWorldPartial = {
    device: {
        mainMenuItems: [
            { id: 'email', label: 'Email' },
            { id: 'phone', label: 'Phone' },
            { id: 'internet', label: 'Internet' },
        ],
        secondaryDefaults: { email: 'list', internet: 'landing', phone: 'history' },
    },
    entryPoint: { app: 'email', screen: 'list' },
    contacts: [
        { id: 'bank-official', displayName: 'Your Bank', number: '+18005550100', email: 'support@yourbank.com' },
    ],
    directory: [
        { id: 'bank', label: 'Bank customer service', number: '+18005550100', description: 'Call to verify any account or security emails.' },
    ],
};

export const PRESET_EXECUTIVE_IMPERSONATION: SimulatorWorldPartial = {
    device: {
        mainMenuItems: [
            { id: 'email', label: 'Email' },
            { id: 'phone', label: 'Phone' },
            { id: 'messages', label: 'Messages' },
            { id: 'internet', label: 'Internet' },
            { id: 'home', label: 'Home' },
        ],
        secondaryDefaults: { email: 'list', messages: 'threads', phone: 'history', internet: 'landing', home: 'home' },
    },
    entryPoint: { app: 'email', screen: 'list' },
    contacts: [
        { id: 'security', displayName: 'Security Team', number: '+15551110000', email: 'security@company.com' },
        { id: 'exec-assistant', displayName: "CEO's Office", number: '+15551110111', email: 'exec@company.com' },
    ],
    directory: [
        { id: 'sec', label: 'Security Team', number: '+15551110000', description: 'Verify executive or wire-transfer requests.' },
        { id: 'exec', label: "CEO's Office", number: '+15551110111', description: 'Official executive communications.' },
    ],
};

export const PRESET_HELPDESK_VERIFICATION: SimulatorWorldPartial = {
    device: {
        mainMenuItems: [
            { id: 'phone', label: 'Phone' },
            { id: 'email', label: 'Email' },
            { id: 'internet', label: 'Internet' },
        ],
        secondaryDefaults: { phone: 'directory', email: 'list', internet: 'landing' },
    },
    entryPoint: { app: 'phone', screen: 'directory' },
    contacts: [
        { id: 'it-helpdesk', displayName: 'IT Helpdesk', number: '+15550123456' },
    ],
    directory: [
        { id: 'helpdesk', label: 'IT Helpdesk', number: '+15550123456', description: 'Use this number to verify any support or password-reset calls.' },
    ],
};

export const PRESET_PACKAGE_DELIVERY_SCAM: SimulatorWorldPartial = {
    device: {
        mainMenuItems: [
            { id: 'email', label: 'Email' },
            { id: 'messages', label: 'Messages' },
            { id: 'phone', label: 'Phone' },
            { id: 'internet', label: 'Internet' },
        ],
        secondaryDefaults: { email: 'list', messages: 'threads', phone: 'history', internet: 'landing' },
    },
    entryPoint: { app: 'email', screen: 'list' },
    contacts: [
        { id: 'delivery-real', displayName: 'Delivery Co (official)', number: '+15558880000', email: 'support@delivery-real.com' },
        { id: 'delivery-fake', displayName: 'Delivery Alerts', number: '+15558881234' },
    ],
    directory: [
        { id: 'delivery', label: 'Delivery Co customer service', number: '+15558880000', description: 'Verify tracking or delivery messages.' },
    ],
};

export const SIMULATOR_PRESET_CATALOG = {
    employeeCorporateDevice: PRESET_EMPLOYEE_CORPORATE_DEVICE,
    fakeBankConsumer: PRESET_FAKE_BANK_CONSUMER,
    executiveImpersonation: PRESET_EXECUTIVE_IMPERSONATION,
    helpdeskVerification: PRESET_HELPDESK_VERIFICATION,
    packageDeliveryScam: PRESET_PACKAGE_DELIVERY_SCAM,
} as const;

export type SimulatorPresetId = keyof typeof SIMULATOR_PRESET_CATALOG;

export function getSimulatorPreset(id: SimulatorPresetId): SimulatorWorldPartial {
    return SIMULATOR_PRESET_CATALOG[id];
}

export interface SimulatorPresetMeta {
    templateKey: string;
    name: string;
    channel: SimulatorChannel;
    templateId?: number | null;
    runId?: number | null;
    attemptId?: number | null;
    topicTags?: Array<{ key: string; name: string }>;
}

const DEFAULT_META: SimulatorPresetMeta = {
    templateKey: 'preset-composed',
    name: 'Composed from presets',
    channel: 'email',
    templateId: null,
    runId: null,
    attemptId: null,
    topicTags: [],
};

export function buildPayloadFromPresets(
    meta: Partial<SimulatorPresetMeta> & { templateKey: string; name: string; channel: SimulatorChannel },
    presetIds: SimulatorPresetId[] = [],
    overlay?: SimulatorWorldPartial
): SimulatorTemplatePayload {
    const resolvedMeta = { ...DEFAULT_META, ...meta };
    const partials = presetIds.map((id) => getSimulatorPreset(id));
    const merged = applyPartials(partials, overlay);
    return {
        templateId: resolvedMeta.templateId ?? null,
        templateKey: resolvedMeta.templateKey,
        name: resolvedMeta.name,
        channel: resolvedMeta.channel,
        topicTags: resolvedMeta.topicTags ?? [],
        runId: resolvedMeta.runId ?? null,
        attemptId: resolvedMeta.attemptId ?? null,
        entryPoint: merged.entryPoint ?? null,
        device: merged.device ?? null,
        email: merged.email ?? null,
        sms: merged.sms ?? null,
        browser: merged.browser ?? null,
        phone: merged.phone ?? null,
        contacts: merged.contacts ?? null,
        directory: merged.directory ?? null,
        home: merged.home ?? null,
    };
}
