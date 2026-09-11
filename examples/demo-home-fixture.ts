import type { SimulatorHomePayload } from '../src/types/session.js';

/**
 * Explicit authoring fixture for demos and screenshots. Reusable screens do not
 * inject these labels or values when a host supplies no scenario content.
 */
export const demoHomeFixture: SimulatorHomePayload = {
    widgets: [{ id: 'demo-queue', label: 'Q Test queue' }],
    featuredApps: [{ id: 'demo-quality-app', name: 'Q Test' }],
    settingsSections: [{ id: 'demo-general', title: 'Demo configuration' }],
};
