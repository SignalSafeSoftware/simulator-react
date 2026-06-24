/**
 * Device shell: frame, bottom nav, optional secondary menu, exit slot.
 * No react-router — pass `exitSlot` for client-side navigation (e.g. <Link>) or rely on `exitTo` as a plain anchor.
 */
import type { CSSProperties, ReactNode } from 'react';
import { memo } from 'react';

export interface SecondaryMenuItem {
    id: string;
    label: string;
    icon?: string;
}

export interface PhoneSimulatorShellProps {
    title?: string;
    activeChannel: string;
    onChannelChange: (channel: string) => void;
    children?: ReactNode;
    className?: string;
    /** When set, rendered in the header instead of exitTo/exitLabel (e.g. react-router Link). */
    exitSlot?: ReactNode;
    /** Plain URL/path for exit when exitSlot is not provided. */
    exitTo?: string;
    exitLabel?: string;
    compact?: boolean;
    secondaryMenu?: {
        items: SecondaryMenuItem[];
        activeId: string;
        onSelect: (id: string) => void;
        onSecondaryBack: () => void;
    };
    hideBottomNav?: boolean;
}

const PRIMARY_CHANNELS: { id: string; label: string; icon: string }[] = [
    { id: 'contacts', label: 'Phone', icon: '📞' },
    { id: 'email', label: 'Email', icon: '📧' },
    { id: 'browser', label: 'Internet', icon: '🌐' },
    { id: 'sms', label: 'Messages', icon: '💬' },
    { id: 'home', label: 'Home', icon: '🏠' },
];

function getHeaderClass(hasTitle: boolean): string {
    return `d-flex align-items-center px-2 py-2 bg-white border-bottom border-secondary small ${
        hasTitle ? 'justify-content-between' : 'justify-content-end'
    }`;
}

function getSecondaryButtonClass(isLast: boolean, isBack: boolean, isActive: boolean): string {
    const borderClass = isLast ? '' : 'border-end border-secondary';
    const stateClass = isBack || !isActive ? 'bg-light text-body' : 'bg-secondary text-white';
    return `flex-grow-1 py-2 border-0 d-flex flex-column align-items-center justify-content-center gap-0 small ${borderClass} ${stateClass}`;
}

function getPrimaryButtonClass(isLast: boolean, isActive: boolean): string {
    const borderClass = isLast ? '' : 'border-end border-secondary';
    const stateClass = isActive ? 'bg-secondary text-white' : 'bg-light text-body';
    return `flex-grow-1 py-2 border-0 d-flex flex-column align-items-center justify-content-center gap-0 small ${borderClass} ${stateClass}`;
}

function PhoneSimulatorShell({
    title,
    activeChannel,
    onChannelChange,
    children,
    className,
    exitSlot,
    exitTo,
    exitLabel = 'Exit',
    compact = false,
    secondaryMenu,
    hideBottomNav = false,
}: Readonly<PhoneSimulatorShellProps>) {
    const deviceFrameStyle: CSSProperties = compact
        ? {
              width: '100%',
              minWidth: 0,
              maxWidth: '100%',
              flexShrink: 1,
              maxHeight: 1000,
              aspectRatio: '9 / 19.5',
          }
        : {
              width: 460,
              minWidth: 460,
              maxWidth: 460,
              flexShrink: 0,
              maxHeight: 1000,
              aspectRatio: '9 / 19.5',
          };

    const showSecondary = !hideBottomNav && secondaryMenu != null && secondaryMenu.items.length > 0;
    const showPrimary = !hideBottomNav && !showSecondary;
    const resolvedSecondaryMenu = showSecondary ? secondaryMenu : undefined;

    const exitArea =
        exitSlot ??
        (exitTo ? (
            <a href={exitTo} className="text-decoration-underline text-body">
                {exitLabel}
            </a>
        ) : null);

    const hasTitle = title != null && title !== '';

    const showHeader = hasTitle || exitArea != null;
    let navigation: ReactNode = null;
    if (resolvedSecondaryMenu) {
        navigation = (
            <div className="d-flex border-top border-secondary" role="tablist" aria-label="App secondary menu">
                {resolvedSecondaryMenu.items.map((item, idx) => {
                    const isBack = item.id === 'back';
                    const isActive = !isBack && resolvedSecondaryMenu.activeId === item.id;
                    const isLast = idx === resolvedSecondaryMenu.items.length - 1;
                    return (
                        <button
                            key={item.id}
                            type="button"
                            role="tab"
                            aria-selected={isBack ? undefined : isActive}
                            aria-label={item.label}
                            className={getSecondaryButtonClass(isLast, isBack, isActive)}
                            style={{ minWidth: 0 }}
                            onClick={() =>
                                isBack ? resolvedSecondaryMenu.onSecondaryBack() : resolvedSecondaryMenu.onSelect(item.id)
                            }
                        >
                            {item.icon != null && item.icon !== '' && (
                                <span className="opacity-90" aria-hidden>
                                    {item.icon}
                                </span>
                            )}
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </div>
        );
    } else if (showPrimary) {
        navigation = (
            <div className="d-flex border-top border-secondary" role="tablist" aria-label="Simulator channels">
                {PRIMARY_CHANNELS.map((ch, idx) => {
                    const isActive = activeChannel === ch.id;
                    const isLast = idx === PRIMARY_CHANNELS.length - 1;
                    return (
                        <button
                            key={ch.id}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            aria-label={ch.label}
                            className={getPrimaryButtonClass(isLast, isActive)}
                            style={{ minWidth: 0 }}
                            onClick={() => onChannelChange(ch.id)}
                        >
                            <span className="opacity-90" aria-hidden>
                                {ch.icon}
                            </span>
                            <span>{ch.label}</span>
                        </button>
                    );
                })}
            </div>
        );
    }

    return (
        <div className={className}>
            {showHeader && (
                <div className={getHeaderClass(hasTitle)}>
                    {hasTitle && <span className="fw-semibold text-body">{title}</span>}
                    {exitArea}
                </div>
            )}
            <div
                className={`${compact ? 'px-0' : 'px-3'} pb-3 pt-1 bg-body-tertiary d-flex flex-column ${compact ? '' : 'min-vh-100'}`}
            >
                <div
                    className={`d-flex flex-column overflow-hidden bg-white border border-dark ${compact ? 'w-100 align-self-stretch' : 'mx-auto'}`}
                    style={deviceFrameStyle}
                >
                    <div className="flex-grow-1 min-h-0 d-flex flex-column overflow-auto p-3">{children}</div>
                    {navigation}
                </div>
            </div>
        </div>
    );
}

export default memo(PhoneSimulatorShell);
