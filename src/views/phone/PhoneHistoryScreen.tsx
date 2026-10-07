import { useState } from 'react';
import { usePhoneNumberFormatter } from '../../contract/phonePresentation.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import type { SimulatorPhonePayload, SimulatorSessionContact } from '../../types/session.js';
import { normalizePhoneForMatch } from '../../utils/payload/contactNormalization.js';
import PhoneHistoryCallButton from './PhoneHistoryCallButton.js';
import PhoneHistoryLayout from './PhoneHistoryLayout.js';
import PhoneHistorySummaryTitle from './PhoneHistorySummaryTitle.js';
import { phoneHistoryContact, relatedPhoneHistoryEntries } from './phoneHistorySelection.js';

export interface PhoneHistoryScreenProps {
    payload: SimulatorPhonePayload;
    contacts: readonly SimulatorSessionContact[];
    selectedEntryId: string | null;
    hasVoicemail: boolean;
    onSelectEntry: (id: string) => void;
    onSelectIncoming: () => void;
    onSelectVoicemail: () => void;
    onCall?: (number: string) => void;
}

/** Shared history list and nested call details. Related calls are informational rows. */
export default function PhoneHistoryScreen({
    payload,
    contacts,
    selectedEntryId,
    hasVoicemail,
    onSelectEntry,
    onSelectIncoming,
    onSelectVoicemail,
    onCall,
}: Readonly<PhoneHistoryScreenProps>) {
    const { t } = useSimulatorLocale();
    const formatNumber = usePhoneNumberFormatter();
    const [query, setQuery] = useState('');
    const [detailQuery, setDetailQuery] = useState('');
    const entries = payload.callHistory ?? [];
    const selected = entries.find((entry) => entry.id === selectedEntryId);
    const contact = selected ? phoneHistoryContact(selected, contacts) : undefined;
    const caller =
        contact?.name ||
        selected?.name ||
        (selected?.number
            ? formatNumber(selected.displayNumber || selected.number)
            : t('value.unknown'));
    const select = (id: string) => {
        setDetailQuery('');
        onSelectEntry(id);
    };
    return (
        <PhoneHistoryLayout
            detail={
                selected && {
                    caller,
                    number: selected.displayNumber || selected.number || undefined,
                    numberLabel: selected.numberLabel || contact?.numberLabel,
                    timestamp: selected.timestamp ?? t('calls.dateUnknown'),
                    description: selected.label,
                    actions:
                        onCall && normalizePhoneForMatch(selected.number) ? (
                            <PhoneHistoryCallButton onCall={() => onCall(selected.number)} />
                        ) : undefined,
                    children: <PhoneHistorySummaryTitle caller={caller} />,
                }
            }
            list={{
                entries: selected ? relatedPhoneHistoryEntries(entries, selected) : entries,
                incomingCallContent: selected ? undefined : payload.content,
                hasVoicemail: !selected && hasVoicemail,
                onSelectIncoming,
                onSelectVoicemail,
                onSelectEntry: select,
                selectedEntryId: selected?.id,
                searchQuery: selected ? detailQuery : query,
                onSearchQueryChange: selected ? setDetailQuery : setQuery,
            }}
        />
    );
}
