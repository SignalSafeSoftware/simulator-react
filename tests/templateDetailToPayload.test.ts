import { describe, expect, it } from 'vitest';
import { templateDetailToPayload } from '../src/adapters/templateToSession';
import type { SimulatorTemplateDetail } from '../src/types/portableSimulator';

describe('templateDetailToPayload', () => {
  it('sanitizes object-valued display fields that would otherwise crash preview rendering', () => {
    const detail = {
      id: 1,
      channel: 'browser',
      key: 'preview-template',
      name: { rich: 'Preview Template' },
      is_master: false,
      is_active: true,
      company: 1,
      topics: [],
      created_on: '2026-01-01T00:00:00Z',
      updated_on: '2026-01-01T00:00:00Z',
      description: '',
      content_json: {},
      simulator_json: null,
      simulator: {
        entry_point: { app: 'internet', screen: { nested: 'landing' } },
        device: {
          main_menu_items: [
            {
              id: 'browser',
              label: { app: 'email', screen: 'list' },
              app: 'internet',
            },
          ],
        },
        internet: {
          pages: [
            {
              id: 'landing',
              url: 'example.test',
              title: { rich: 'object' },
              layout: 'login',
            },
          ],
          forms: [
            {
              id: 'login-form',
              page_id: 'landing',
              fields: [
                {
                  name: 'username',
                  type: 'text',
                  label: { nested: 'label' },
                },
              ],
            },
          ],
        },
        email: {
          detail: {
            id: 'm1',
            subject: { nested: 'subject' },
            from: { nested: 'from' },
            body: { nested: 'body' },
            links: [
              {
                href: { nested: 'href' },
                text: { nested: 'text' },
              },
            ],
          },
        },
      },
      thread_id: null,
      reply_to_message: null,
      attachment_name: '',
      attachment_type: '',
      attachment_behavior: '',
      messages: [],
      browser_template: null,
    } as unknown as SimulatorTemplateDetail;

    const payload = templateDetailToPayload(detail);

    expect(payload.name).toBe('preview-template');
    expect(payload.entryPoint?.screen).toBe('');
    expect(payload.browser?.pages[0]?.title).toBe('Page');
    expect(payload.browser?.pages[0]?.formFields?.[0]?.label).toBe('Field');
    expect(payload.device?.mainMenuItems[0]?.label).toBe('browser');

    expect(payload.email?.selectedMessage?.subject).toBe('');
    expect(payload.email?.selectedMessage?.from).toBe('');
    expect(payload.email?.selectedMessage?.body).toBe('');
    expect(payload.email?.selectedMessage?.links).toBeUndefined();
  });

  it('falls back for missing simulator payloads, legacy channels, and topic names', () => {
    const detail = {
      id: 2,
      channel: 'phone',
      key: null,
      name: null,
      is_master: false,
      is_active: true,
      company: 1,
      topics: [{}, { key: 'topic-key' }],
      created_on: '2026-01-01T00:00:00Z',
      updated_on: '2026-01-01T00:00:00Z',
      description: '',
      content_json: {},
      simulator_json: null,
      simulator: null,
      thread_id: null,
      reply_to_message: null,
      attachment_name: '',
      attachment_type: '',
      attachment_behavior: '',
      messages: [],
      browser_template: null,
    } as unknown as SimulatorTemplateDetail;

    const payload = templateDetailToPayload(detail, { runId: 5, attemptId: 6 });

    expect(payload.name).toBe('Simulator');
    expect(payload.channel).toBe('phone');
    expect(payload.topicTags).toEqual([
      { key: 'topic-0', name: 'Topic 1' },
      { key: 'topic-key', name: 'topic-key' },
    ]);
    expect(payload.runId).toBe(5);
    expect(payload.attemptId).toBe(6);
    expect(payload.entryPoint).toBeNull();
  });

  it('covers sms legacy fallback, null channels, and null topic arrays', () => {
    const smsPayload = templateDetailToPayload({
      id: 5,
      channel: 'sms',
      key: 'sms-template',
      name: 'SMS Template',
      topics: null,
      simulator: null,
    } as never);

    expect(smsPayload.channel).toBe('sms');
    expect(smsPayload.topicTags).toEqual([]);

    const nullChannelPayload = templateDetailToPayload({
      id: 6,
      channel: null,
      key: 'null-channel',
      name: 'Null Channel',
      topics: [],
      simulator: { bad: true },
    } as never);

    expect(nullChannelPayload.channel).toBe('email');
    expect(nullChannelPayload.entryPoint).toBeNull();
  });

  it('treats an undefined legacy channel as email', () => {
    const payload = templateDetailToPayload({
      id: 7,
      key: 'undefined-channel',
      name: 'Undefined Channel',
      topics: [],
      simulator: null,
    } as never);

    expect(payload.channel).toBe('email');
    expect(payload.entryPoint).toBeNull();
  });

  it('maps a legacy browser channel when the full-device payload is missing', () => {
    const payload = templateDetailToPayload({
      id: 8,
      channel: 'browser',
      key: 'legacy-browser',
      name: 'Legacy Browser',
      topics: [],
      simulator: null,
    } as never);

    expect(payload.channel).toBe('browser');
    expect(payload.browser).toBeNull();
  });

  it('maps a legacy phone channel when the full-device payload is missing', () => {
    const payload = templateDetailToPayload({
      id: 9,
      channel: 'phone',
      key: 'legacy-phone',
      name: 'Legacy Phone',
      topics: [],
      simulator: null,
    } as never);

    expect(payload.channel).toBe('phone');
    expect(payload.phone).toBeNull();
  });

  it('defaults unknown legacy channels to email and keeps invalid full-device apps empty', () => {
    const detail = {
      id: 3,
      channel: 'pager',
      key: 'legacy-template',
      name: 'Legacy Template',
      is_master: false,
      is_active: true,
      company: 1,
      topics: [],
      created_on: '2026-01-01T00:00:00Z',
      updated_on: '2026-01-01T00:00:00Z',
      description: '',
      content_json: {},
      simulator_json: null,
      simulator: {
        entry_point: { app: 'not-real', screen: 'whatever' },
        contacts: [],
        directory: [{ bad: true }],
        home: {
          home: { widgets: {} },
          store: { featured_apps: {} },
          settings: { sections: {} },
        },
      },
      thread_id: null,
      reply_to_message: null,
      attachment_name: '',
      attachment_type: '',
      attachment_behavior: '',
      messages: [],
      browser_template: null,
    } as unknown as SimulatorTemplateDetail;

    const payload = templateDetailToPayload(detail);

    expect(payload.channel).toBe('email');
    expect(payload.entryPoint).toBeNull();
    expect(payload.contacts).toBeNull();
    expect(payload.directory).toBeNull();
    expect(payload.home).toEqual({
      widgets: [],
      featuredApps: [],
      settingsSections: [],
    });
  });

  it('defensively handles simulator payloads that change shape between guard and build steps', () => {
    const missingSimulatorDetail = {
      id: 4,
      channel: 'sms',
      key: 'dynamic-sim',
      name: 'Dynamic Simulator',
      is_master: false,
      is_active: true,
      company: 1,
      topics: [],
      created_on: '2026-01-01T00:00:00Z',
      updated_on: '2026-01-01T00:00:00Z',
      description: '',
      content_json: {},
      simulator_json: null,
      thread_id: null,
      reply_to_message: null,
      attachment_name: '',
      attachment_type: '',
      attachment_behavior: '',
      messages: [],
      browser_template: null,
    } as unknown as SimulatorTemplateDetail;
    let simulatorReads = 0;
    Object.defineProperty(missingSimulatorDetail, 'simulator', {
      configurable: true,
      get() {
        simulatorReads += 1;
        if (simulatorReads === 1) {
          return { entry_point: { app: 'messages', screen: 'threads' } };
        }
        return null;
      },
    });

    const missingSimulatorPayload = templateDetailToPayload(missingSimulatorDetail);
    expect(missingSimulatorPayload.channel).toBe('sms');
    expect(missingSimulatorPayload.entryPoint).toBeNull();
    expect(missingSimulatorPayload.sms).toBeNull();

    const invalidEntryDetail = {
      ...missingSimulatorDetail,
      channel: 'browser',
      key: 'dynamic-entry',
      name: 'Dynamic Entry',
    } as unknown as SimulatorTemplateDetail;
    let entryReads = 0;
    Object.defineProperty(invalidEntryDetail, 'simulator', {
      configurable: true,
      get() {
        entryReads += 1;
        if (entryReads === 1) {
          return { entry_point: { app: 'internet', screen: 'landing' } };
        }
        return {
          entry_point: null,
          internet: {
            pages: [{ id: 'landing', url: 'example.test', title: 'Landing', layout: 'content' }],
          },
        };
      },
    });

    const invalidEntryPayload = templateDetailToPayload(invalidEntryDetail);
    expect(invalidEntryPayload.channel).toBe('browser');
    expect(invalidEntryPayload.entryPoint).toBeNull();
    expect(invalidEntryPayload.browser?.defaultPageId).toBe('landing');
  });
});
