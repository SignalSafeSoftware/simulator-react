import type { ReactNode } from 'react';
import PhoneHistoryDetail, { type PhoneHistoryDetailProps } from './PhoneHistoryDetail.js';
import PhoneHistoryHeader from './PhoneHistoryHeader.js';
import PhoneHistoryList, { type PhoneHistoryListProps } from './PhoneHistoryList.js';
import { usePhoneHistoryFocus } from './usePhoneHistoryFocus.js';

/**
 * The shared call-history page: banner, optional call details, then the searchable list.
 * Hosts supply the data and slots; the layout, focus handling and styling stay here.
 */
export default function PhoneHistoryLayout({
    detail,
    list,
    children,
}: Readonly<{
    detail?: PhoneHistoryDetailProps;
    list: PhoneHistoryListProps;
    /** Host content after the list, such as paging controls or confirmations. */
    children?: ReactNode;
}>) {
    const { rootRef, titleRef } = usePhoneHistoryFocus(detail ? list.selectedEntryId : null);
    return (
        <div ref={rootRef} className='simulator-phone-history-screen'>
            <PhoneHistoryHeader ref={titleRef} detail={detail != null} />
            {detail && <PhoneHistoryDetail {...detail} />}
            <PhoneHistoryList {...list} entriesSelectable={detail == null} />
            {children}
        </div>
    );
}
