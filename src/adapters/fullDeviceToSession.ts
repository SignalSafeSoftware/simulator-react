/**
 * Maps full-device payload (simulator) sections to unified session slice types.
 * App-specific sections live in `./device/*Mapper.ts`.
 */
import {
    SimulatorChannel,
    type SimulatorDirectoryEntry,
    type SimulatorSessionContact,
    type SimulatorSessionDevice,
} from '../types/session.js';
import { isRecord } from '@signalsafe/tree-spec';
import { ownValue } from '../utils/lookup.js';
import { SimulatorApp } from '@signalsafe/simulator-core/simulatorApp';
import type {
    SimulatorContact,
    SimulatorDevicePayload,
} from '@signalsafe/simulator-core/devicePayload';
import { nullableString, optionalString, stringOr } from './device/mapperValues.js';

/** Map backend app id to shell channel (messages→sms, internet→browser). */
const CHANNEL_BY_BACKEND_APP: Readonly<Record<SimulatorApp, SimulatorChannel>> = Object.freeze({
    [SimulatorApp.Messages]: SimulatorChannel.Sms,
    [SimulatorApp.Internet]: SimulatorChannel.Browser,
    [SimulatorApp.Phone]: SimulatorChannel.Phone,
    [SimulatorApp.Email]: SimulatorChannel.Email,
    [SimulatorApp.Home]: SimulatorChannel.Home,
});

export function appToChannel(app: SimulatorApp): SimulatorChannel {
    return ownValue(CHANNEL_BY_BACKEND_APP, app) ?? SimulatorChannel.Email;
}

/** Map device section to session device (main menu + secondary defaults). */
export function mapDevice(device: SimulatorDevicePayload['device']): SimulatorSessionDevice | null {
    if (device == null) {
        return null;
    }
    const mainMenuItems = (Array.isArray(device.main_menu_items) ? device.main_menu_items : [])
        .filter(
            (item): item is NonNullable<typeof item> =>
                item != null && typeof item === 'object' && typeof item.id === 'string',
        )
        .map((item) => ({
            ...item,
            id: stringOr(item.id),
            label: stringOr(item.label, stringOr(item.id)),
            app: typeof item.app === 'string' ? item.app : undefined,
        }));
    if (mainMenuItems.length === 0 && Object.keys(device.secondary_defaults ?? {}).length === 0)
        return null;
    return {
        mainMenuItems,
        secondaryDefaults: device.secondary_defaults ?? {},
    };
}

/** Map directory (official/trusted sources) to session directory entries. */
function mapDirectoryEntry(raw: unknown): SimulatorDirectoryEntry | null {
    if (!isRecord(raw)) {
        return null;
    }
    const o = raw;
    const id = optionalString(o.id);
    const label = optionalString(o.label);
    if (id == null || label == null) {
        return null;
    }
    return {
        id,
        label,
        contact_id: nullableString(o.contact_id),
        number: nullableString(o.number),
        url: nullableString(o.url),
        description: nullableString(o.description),
    };
}

export function mapDirectory(directory: unknown): SimulatorDirectoryEntry[] | null {
    if (directory == null || !Array.isArray(directory)) return null;
    const out: SimulatorDirectoryEntry[] = [];
    for (const raw of directory) {
        const entry = mapDirectoryEntry(raw);
        if (entry != null) {
            out.push(entry);
        }
    }
    return out.length > 0 ? out : null;
}

/** Map contacts array to session contacts (id, displayName, number, email). */
export function mapContacts(
    contacts: SimulatorDevicePayload['contacts'],
): SimulatorSessionContact[] {
    if (contacts == null || !Array.isArray(contacts)) {
        return [];
    }
    return contacts
        .filter(
            (c): c is SimulatorContact =>
                c != null && typeof c === 'object' && typeof c.display_name === 'string',
        )
        .map((c, index) => ({
            id: typeof c.id === 'string' ? c.id : `c-${index}`,
            displayName: c.display_name,
            phoneNumbers: c.phone_numbers,
            emailAddresses: c.email_addresses,
            number: typeof c.number === 'string' ? c.number : undefined,
            email: typeof c.email === 'string' ? c.email : undefined,
        }));
}
