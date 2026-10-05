import type {
    SimulatorHomePayload,
    SimulatorHomeSettingsSection,
    SimulatorHomeStoreApp,
    SimulatorHomeWidget,
} from '../../types/session.js';
import type { SimulatorDevicePayload } from '@signalsafe/simulator-core/devicePayload';

/** Map home app section to session home payload. */
export function mapHome(home: SimulatorDevicePayload['home']): SimulatorHomePayload | null {
    if (home == null || typeof home !== 'object') return null;
    const homeScreen = home.home;
    const widgets: SimulatorHomeWidget[] = Array.isArray(homeScreen?.widgets)
        ? homeScreen.widgets.map((w, i) => ({
              id: typeof w.id === 'string' ? w.id : `w-${i}`,
              type: typeof w.type === 'string' ? w.type : undefined,
              label: typeof w.label === 'string' ? w.label : 'Widget',
          }))
        : [];
    const store = home.store;
    const featuredApps: SimulatorHomeStoreApp[] = Array.isArray(store?.featured_apps)
        ? store.featured_apps.map((a, i) => ({
              id: typeof a.id === 'string' ? a.id : `app-${i}`,
              name: typeof a.name === 'string' ? a.name : 'App',
          }))
        : [];
    const settings = home.settings;
    const settingsSections: SimulatorHomeSettingsSection[] = Array.isArray(settings?.sections)
        ? settings.sections.map((s, i) => ({
              id: typeof s.id === 'string' ? s.id : `s-${i}`,
              title: typeof s.title === 'string' ? s.title : 'Section',
          }))
        : [];
    return { widgets, featuredApps, settingsSections };
}
