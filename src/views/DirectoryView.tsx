/**
 * Official directory / trusted sources in the Phone app.
 * When phoneLocalNavItems is provided, shows wireframe-style phone tabs above content.
 */
import { useState } from 'react';
import { Button, ListGroup } from 'react-bootstrap';
import type {
    SimulatorAction,
    SimulatorDirectoryEntry,
    SimulatorSessionContact,
} from '../types/session';
import { SimulatorActions } from '../actions';
import SimulatorLocalNav from '../components/SimulatorLocalNav';
import { SimulatorDetailBackBar } from '../components/SimulatorDetail';
import { simTypo } from '../simulatorStyles';

export interface DirectoryViewProps {
    directory: SimulatorDirectoryEntry[] | null;
    contacts: SimulatorSessionContact[] | null;
    onBack: () => void;
    onAction: (action: SimulatorAction) => void;
    /** Called when user opens an entry (before showing detail); emits directory_entry_viewed. */
    onViewEntry?: (entryId: string) => void;
    /** When set (phone app context), show phone secondary nav above content. */
    phoneLocalNavItems?: { id: string; label: string }[];
    phoneActiveId?: string;
    onPhoneNavSelect?: (id: string) => void;
    /** Open with this directory entry selected (README / harness screenshots). */
    initialSelectedDirectoryId?: string | null;
}

function findContact(contacts: SimulatorSessionContact[] | null, id: string | null | undefined): SimulatorSessionContact | null {
    if (!id || !contacts) return null;
    return contacts.find((c) => c.id === id) ?? null;
}

export default function DirectoryView({
    directory,
    contacts,
    onBack,
    onAction,
    onViewEntry,
    phoneLocalNavItems,
    phoneActiveId = 'directory',
    onPhoneNavSelect,
    initialSelectedDirectoryId = null,
}: Readonly<DirectoryViewProps>) {
    const [selectedId, setSelectedId] = useState<string | null>(() => initialSelectedDirectoryId ?? null);
    const entries = directory ?? [];
    const selected = entries.find((e) => e.id === selectedId);

    const handleSelect = (entry: SimulatorDirectoryEntry) => {
        setSelectedId(entry.id);
        onViewEntry?.(entry.id);
    };

    const handleCallContact = (contactId: string) => {
        onAction(SimulatorActions.openContact(contactId));
    };

    const handleDial = (number: string) => {
        onAction(SimulatorActions.dialPhone(number));
    };

    if (entries.length === 0) {
        return (
            <div className="d-flex flex-column small">
                {phoneLocalNavItems != null && phoneLocalNavItems.length > 0 && onPhoneNavSelect && (
                    <SimulatorLocalNav
                        items={phoneLocalNavItems}
                        activeId={phoneActiveId}
                        onSelect={onPhoneNavSelect}
                        aria-label="Phone tabs"
                    />
                )}
                <SimulatorDetailBackBar onBack={onBack} title="Directory" ariaLabel="Back" titleOnly />
                <p className="text-muted mb-0">No directory for this scenario.</p>
            </div>
        );
    }

    return (
        <div className="d-flex flex-column">
            {phoneLocalNavItems != null && phoneLocalNavItems.length > 0 && onPhoneNavSelect && (
                <SimulatorLocalNav
                    items={phoneLocalNavItems}
                    activeId={phoneActiveId}
                    onSelect={onPhoneNavSelect}
                    aria-label="Phone tabs"
                />
            )}
            <SimulatorDetailBackBar onBack={onBack} title="Directory" ariaLabel="Back" titleOnly />
            <p className={`${simTypo.secondary} mb-2`} style={{ fontSize: '0.8rem' }}>
                Use these numbers or links to verify information.
            </p>
            {selected ? (
                <div className="border rounded p-3 bg-light">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                        <strong>{selected.label}</strong>
                        <Button
                            variant="link"
                            size="sm"
                            className="p-0 text-secondary"
                            onClick={() => setSelectedId(null)}
                        >
                            Change
                        </Button>
                    </div>
                    {selected.description && (
                        <p className="small text-muted mb-2">{selected.description}</p>
                    )}
                    {selected.contact_id && (() => {
                        const contact = findContact(contacts, selected.contact_id);
                        if (contact) {
                            return (
                                <div className="mb-2">
                                    <span className="small text-muted">{contact.displayName}</span>
                                    {contact.number && (
                                        <span className="small ms-2">{contact.number}</span>
                                    )}
                                    <div className="mt-1">
                                        <Button
                                            size="sm"
                                            variant="primary"
                                            onClick={() => handleCallContact(contact.id)}
                                        >
                                            Call
                                        </Button>
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })()}
                    {!selected.contact_id && selected.number && (
                        <div className="mb-2">
                            <span className="small">{selected.number}</span>
                            <div className="mt-1">
                                <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() => handleDial(selected.number!)}
                                >
                                    Call
                                </Button>
                            </div>
                        </div>
                    )}
                    {selected.url && (
                        <p className="small mb-0 text-break">
                            <span className="text-muted">URL: </span>
                            {selected.url}
                        </p>
                    )}
                </div>
            ) : (
                <ListGroup as="ul" className="border rounded">
                    {entries.map((entry) => (
                        <ListGroup.Item
                            key={entry.id}
                            as="li"
                            action
                            onClick={() => handleSelect(entry)}
                            className="py-2"
                        >
                            {entry.label}
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            )}
        </div>
    );
}
