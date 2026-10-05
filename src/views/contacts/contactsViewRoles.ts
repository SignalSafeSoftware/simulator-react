import type { LabeledItem } from '../../types/shapes.js';
import type { SimulatorSessionContact } from '../../types/session.js';

/** Search state and callbacks for the contacts list. */
export interface ContactsSearchProps {
    /** Optional initial search query (e.g. from deep-link). When provided with onSearchChange, search is controlled (state stored in shell). */
    initialSearch?: string;
    /** Controlled search query (e.g. from view state); when set, use with onSearchChange. */
    searchQuery?: string;
    /** Called when search input changes (for controlled state restoration). */
    onSearchChange?: (query: string) => void;
    /** Called when user performs a search (e.g. Enter in search field). Emits search_performed when provided. */
    onSearchSubmit?: (query: string) => void;
}

/** Phone secondary navigation shown above the contacts content. */
export interface ContactsPhoneNavProps {
    /** When set (phone app context), show phone secondary nav above content. */
    phoneLocalNavItems?: LabeledItem[];
    /** Active phone tab id (e.g. "contacts"). */
    phoneActiveId?: string;
    /** When user selects a phone tab (e.g. History, Dial). */
    onPhoneNavSelect?: (id: string) => void;
}

/** Host ownership of the contact detail screen. */
export interface ContactsHostDetailProps {
    /** When true, row clicks invoke {@link onPhoneContactOpen} instead of internal detail view. */
    hostOwnsPhoneContactDetail?: boolean;
    /** Called when host owns contact detail; shell injects state/dispatch before invoking host callback. */
    onPhoneContactOpen?: (contactId: string, contact: SimulatorSessionContact) => void;
}
