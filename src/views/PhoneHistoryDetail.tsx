import type { ReactNode } from 'react';
export interface PhoneHistoryDetailProps {
  caller: string;
  number?: string;
  timestamp: string;
  description: string;
  actions?: ReactNode;
  children?: ReactNode;
}
/** Data-source independent detail layout; protected actions are supplied by the host. */
export default function PhoneHistoryDetail({
  caller,
  number,
  timestamp,
  description,
  actions,
  children,
}: Readonly<PhoneHistoryDetailProps>) {
  return (
    <div className="simulator-history-detail">
      <h3>{caller}</h3>
      {number && <p>{number}</p>}
      <p>{timestamp}</p>
      <p>{description}</p>
      {actions && <div className="simulator-history-actions">{actions}</div>}
      {children}
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
  return hasMore ? (
    <button
      type="button"
      className="simulator-history-load-more"
      disabled={loading || disabled}
      onClick={onLoadMore}
    >
      Load older calls
    </button>
  ) : null;
}
