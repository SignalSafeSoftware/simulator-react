import { describe, expect, it } from 'vitest';
import { isSimulatorDevicePayload } from '@signalsafe/simulator-core';
import type { SimulatorDevicePayload, SimulatorTemplateDetail } from '../src/types/portableSimulator.js';

describe('portableSimulator payload re-exports', () => {
    it('uses simulator-core guards against re-exported payload types', () => {
        const payload: SimulatorDevicePayload = {
            entry_point: { app: 'email', screen: 'list' },
        };

        expect(isSimulatorDevicePayload(payload)).toBe(true);
    });

    it('keeps API template detail types local to simulator-react', () => {
        const detail: SimulatorTemplateDetail = {
            id: 1,
            channel: 'email',
            key: 'k',
            name: 'Name',
            is_master: false,
            is_active: true,
            company: null,
            created_on: '',
            updated_on: '',
            description: '',
            content_json: {},
            simulator: { entry_point: { app: 'email', screen: 'list' } },
            thread_id: null,
            reply_to_message: null,
            attachment_name: '',
            attachment_type: '',
            attachment_behavior: '',
            messages: [],
        };

        expect(detail.simulator.entry_point?.app).toBe('email');
    });
});
