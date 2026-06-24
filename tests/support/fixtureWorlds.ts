/**
 * Curated simulator fixture worlds for package tests and local QA.
 * Each world is a complete SimulatorTemplatePayload. Not part of the `@signalsafe/simulator-react` published API.
 */

import type {
    SimulatorTemplatePayload,
    SimulatorSessionDevice,
    SimulatorSessionContact,
    SimulatorDirectoryEntry,
    SimulatorEmailPayload,
    SimulatorInboxRow,
    SimulatorSmsPayload,
    SimulatorBrowserPayload,
    SimulatorBrowserPage,
    SimulatorPhonePayload,
    SimulatorChannel,
} from '@signalsafe/simulator-react';
import type {
    EmailTemplateContent,
    PhoneSimulatorContent,
    SimulatorEntryPoint,
    SmsThreadContent,
    SmsThreadMessage,
} from '@signalsafe/simulator-react/types/portableSimulator';

const BASE_META = {
    templateId: null as number | null,
    templateKey: 'fixture-world',
    name: 'Fixture World',
    channel: 'email' as SimulatorChannel,
    topicTags: [] as Array<{ key: string; name: string }>,
    runId: null as number | null,
    attemptId: null as number | null,
};

function basePayload(overrides: Partial<SimulatorTemplatePayload>): SimulatorTemplatePayload {
    return {
        ...BASE_META,
        entryPoint: null,
        device: null,
        email: null,
        sms: null,
        browser: null,
        phone: null,
        contacts: null,
        directory: null,
        home: null,
        ...overrides,
    };
}

export function minimalPhoneWorld(): SimulatorTemplatePayload {
    const entryPoint: SimulatorEntryPoint = { app: 'phone', screen: 'incoming_call' };
    const directory: SimulatorDirectoryEntry[] = [
        { id: 'dir-1', label: 'IT Helpdesk', number: '+15550001111', description: 'Use to verify support calls.' },
    ];
    const contacts: SimulatorSessionContact[] = [
        { id: 'c1', displayName: 'IT Helpdesk', number: '+15550001111' },
        { id: 'c2', displayName: 'HR', number: '+15550002222' },
    ];
    const phoneContent: PhoneSimulatorContent = {
        transcript: 'Incoming call from an unknown number.',
        choices: [
            { label: 'Ignore', correct: false },
            { label: 'Answer', correct: true },
        ],
        phone_number: '+15559999999',
        caller_name: 'Unknown',
    };
    const phone: SimulatorPhonePayload = {
        content: phoneContent,
        chosenIndex: null,
        callHistory: [],
    };
    const device: SimulatorSessionDevice = {
        mainMenuItems: [
            { id: 'phone', label: 'Phone' },
            { id: 'contacts', label: 'Contacts' },
        ],
        secondaryDefaults: {},
    };
    return basePayload({
        templateKey: 'fixture-minimal-phone',
        name: 'Minimal Phone World',
        channel: 'phone',
        entryPoint,
        device,
        phone,
        contacts,
        directory,
    });
}

export function verificationBusinessWorld(): SimulatorTemplatePayload {
    const entryPoint: SimulatorEntryPoint = { app: 'phone', screen: 'directory' };
    const directory: SimulatorDirectoryEntry[] = [
        { id: 'd1', label: 'Security Team', number: '+15551110000', description: 'Verify any security-related requests.' },
        { id: 'd2', label: 'HR', number: '+15551110222', url: 'https://hr.example.com', description: 'Benefits and policies.' },
    ];
    const contacts: SimulatorSessionContact[] = [
        { id: 'c1', displayName: 'Security Team', number: '+15551110000' },
        { id: 'c2', displayName: 'HR', number: '+15551110222' },
    ];
    const device: SimulatorSessionDevice = {
        mainMenuItems: [
            { id: 'phone', label: 'Phone' },
            { id: 'email', label: 'Email' },
            { id: 'internet', label: 'Internet' },
        ],
        secondaryDefaults: { phone: 'directory' },
    };
    return basePayload({
        templateKey: 'fixture-verification-business',
        name: 'Verification Business World',
        channel: 'contacts',
        entryPoint,
        device,
        contacts,
        directory,
    });
}

export function fakeBankWorld(): SimulatorTemplatePayload {
    const entryPoint: SimulatorEntryPoint = { app: 'email', screen: 'list' };
    const inbox: SimulatorInboxRow[] = [
        {
            id: 'e1',
            subject: 'Action required on your account',
            from: 'no-reply@bank-phish.example',
            from_display_name: 'Security Center',
            snippet: 'Please verify your identity...',
            unread: true,
        },
    ];
    const selectedMessage: EmailTemplateContent = {
        subject: 'Action required on your account',
        from: 'no-reply@bank-phish.example',
        body: 'We noticed unusual activity. Click here to secure your account.',
        links: [{ href: 'https://fake-bank.example.com/login', text: 'Secure your account' }],
    };
    const email: SimulatorEmailPayload = {
        inbox,
        selectedMessage,
        selectedMessageId: 'e1',
    };
    const loginPage: SimulatorBrowserPage = {
        id: 'login',
        url: 'https://fake-bank.example.com/login',
        title: 'Sign in',
        layout: 'login',
        formFields: [
            { name: 'username', label: 'Email', type: 'text' },
            { name: 'password', label: 'Password', type: 'password' },
        ],
        submitTargetPageId: 'result',
    };
    const landingPage: SimulatorBrowserPage = {
        id: 'landing',
        url: 'https://fake-bank.example.com/',
        title: 'Welcome',
        layout: 'landing',
        buttons: [{ label: 'Log in', targetPageId: 'login' }],
    };
    const resultPage: SimulatorBrowserPage = {
        id: 'result',
        url: 'https://fake-bank.example.com/result',
        title: 'Submission',
        layout: 'result',
        content: 'Thank you.',
    };
    const browser: SimulatorBrowserPayload = {
        pages: [landingPage, loginPage, resultPage],
        defaultPageId: 'landing',
    };
    const directory: SimulatorDirectoryEntry[] = [
        { id: 'bank', label: 'Bank customer service', number: '+15551234567', description: 'Call to verify any account emails.' },
    ];
    const contacts: SimulatorSessionContact[] = [
        { id: 'bank-official', displayName: 'Your Bank', number: '+15551234567', email: 'support@yourbank.com' },
        { id: 'it-helpdesk', displayName: 'IT Helpdesk', number: '+15550123456' },
    ];
    const device: SimulatorSessionDevice = {
        mainMenuItems: [
            { id: 'email', label: 'Email' },
            { id: 'phone', label: 'Phone' },
            { id: 'internet', label: 'Internet' },
        ],
        secondaryDefaults: {},
    };
    return basePayload({
        templateKey: 'fixture-fake-bank',
        name: 'Fake Bank World',
        channel: 'email',
        entryPoint,
        device,
        email,
        browser,
        directory,
        contacts,
    });
}

export function employeeDeviceWorld(): SimulatorTemplatePayload {
    const entryPoint: SimulatorEntryPoint = { app: 'email', screen: 'list' };
    const inbox: SimulatorInboxRow[] = [
        { id: 'e1', subject: 'Your delivery is on the way', from: 'alerts@delivery.example', snippet: 'Track your package...', unread: true },
        { id: 'e2', subject: 'Team standup', from: 'team@company.com', snippet: 'Reminder: 10am tomorrow.' },
    ];
    const email: SimulatorEmailPayload = {
        inbox,
        selectedMessage: null,
        selectedMessageId: null,
    };
    const smsThread: SmsThreadContent = {
        messages: [
            { from: 'them', text: 'Your package will arrive today. Reply STOP to opt out.' } as SmsThreadMessage,
            { from: 'me', text: 'Who is this?' } as SmsThreadMessage,
        ],
        sender_display_name: 'Delivery Alerts',
        sender_number: '+15558881234',
    };
    const sms: SimulatorSmsPayload = {
        thread: smsThread,
        visibleMessageCount: 2,
    };
    const contacts: SimulatorSessionContact[] = [
        { id: 'delivery', displayName: 'Delivery Alerts', number: '+15558881234' },
        { id: 'hr', displayName: 'HR', number: '+15550002222', email: 'hr@company.com' },
    ];
    const device: SimulatorSessionDevice = {
        mainMenuItems: [
            { id: 'email', label: 'Email' },
            { id: 'messages', label: 'Messages' },
            { id: 'phone', label: 'Phone' },
        ],
        secondaryDefaults: {},
    };
    return basePayload({
        templateKey: 'fixture-employee-device',
        name: 'Employee Device World',
        channel: 'email',
        entryPoint,
        device,
        email,
        sms,
        contacts,
    });
}

export function browserCredentialWorld(): SimulatorTemplatePayload {
    const entryPoint: SimulatorEntryPoint = { app: 'internet', screen: 'landing' };
    const landing: SimulatorBrowserPage = {
        id: 'landing',
        url: 'https://secure.example.com/',
        title: 'Welcome',
        layout: 'landing',
        content: 'Sign in to continue.',
        buttons: [{ label: 'Log in', targetPageId: 'login' }],
    };
    const login: SimulatorBrowserPage = {
        id: 'login',
        url: 'https://secure.example.com/login',
        title: 'Sign in',
        layout: 'login',
        formFields: [
            { name: 'email', label: 'Email', type: 'text' },
            { name: 'password', label: 'Password', type: 'password' },
        ],
        submitTargetPageId: 'result',
    };
    const result: SimulatorBrowserPage = {
        id: 'result',
        url: 'https://secure.example.com/result',
        title: 'Done',
        layout: 'result',
        content: 'Submission received.',
    };
    const browser: SimulatorBrowserPayload = {
        pages: [landing, login, result],
        defaultPageId: 'landing',
    };
    const device: SimulatorSessionDevice = {
        mainMenuItems: [
            { id: 'internet', label: 'Internet' },
            { id: 'email', label: 'Email' },
        ],
        secondaryDefaults: { internet: 'landing' },
    };
    return basePayload({
        templateKey: 'fixture-browser-credential',
        name: 'Browser Credential World',
        channel: 'browser',
        entryPoint,
        device,
        browser,
    });
}

export const FIXTURE_WORLD_CATALOG = {
    minimalPhone: minimalPhoneWorld,
    verificationBusiness: verificationBusinessWorld,
    fakeBank: fakeBankWorld,
    employeeDevice: employeeDeviceWorld,
    browserCredential: browserCredentialWorld,
} as const;

export type FixtureWorldId = keyof typeof FIXTURE_WORLD_CATALOG;

export function getFixtureWorld(id: FixtureWorldId): SimulatorTemplatePayload {
    return FIXTURE_WORLD_CATALOG[id]();
}
