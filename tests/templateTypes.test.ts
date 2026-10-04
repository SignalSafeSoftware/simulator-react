import { describe, expect, it } from 'vitest';
import { isSimulatorDevicePayload } from '@signalsafe/simulator-core/devicePayloadGuards';
import type { SimulatorDevicePayload } from '@signalsafe/simulator-core/devicePayload';
import { type SimulatorTemplateDetail } from '../src/types/template.js';

describe('device payload and API template types', () => {
    it('uses canonical simulator-core payload types and guards', () => {
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
