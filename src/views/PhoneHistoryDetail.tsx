import { useSimulatorLocale } from '../i18n/SimulatorLocale.js';
import { usePhoneNumberFormatter } from '../contract/phonePresentation.js';
import type { ReactNode } from 'react';
export interface PhoneHistoryDetailProps {
    caller: string;
    number?: string;
    numberLabel?: string;
    photo?: ReactNode;
    timestamp: string;
    description?: string;
    actions?: ReactNode;
    children?: ReactNode;
}
/** Data-source independent detail layout; protected actions are supplied by the host. */
export default function PhoneHistoryDetail({
    caller,
    number,
    numberLabel,
    photo,
    timestamp,
    description,
    actions,
    children,
}: Readonly<PhoneHistoryDetailProps>) {
    const formatNumber = usePhoneNumberFormatter();
    return (
        <div className="simulator-history-detail">
            <div className="simulator-history-detail__body">
                <h3 className="simulator-history-detail__caller">{caller}</h3>
                {photo}
                {number && (
                    <p className="simulator-history-detail__number">
                        {numberLabel && <span>{numberLabel} · </span>}
                        {formatNumber(number)}
                    </p>
                )}
                <p className="simulator-history-detail__time">{timestamp}</p>
                {description && <p className="simulator-history-detail__metadata">{description}</p>}
            </div>
            {actions && <div className="simulator-history-actions">{actions}</div>}
            {children && <div className="simulator-history-detail__summary">{children}</div>}
        </div>
    );
}
export function PhoneHistoryPagination({
    hasMore,
    loading,
    disabled = false,
    onLoadMore,
}: Readonly<{
    hasMore: boolean;
    loading: boolean;
    disabled?: boolean;
    onLoadMore: () => void;
}>) {
    const screenLocale = useSimulatorLocale();

    return hasMore ? (
        <button
            type="button"
            className="simulator-history-load-more"
            disabled={loading || disabled}
            onClick={onLoadMore}
        >
            {screenLocale.t('screen.phoneHistoryDetail.load.older.calls')}
        </button>
    ) : null;
}
