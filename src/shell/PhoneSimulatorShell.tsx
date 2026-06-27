/**
 * Device shell: frame, bottom nav, optional secondary menu, exit slot.
 * No react-router — pass `exitSlot` for client-side navigation (e.g. <Link>) or rely on `exitTo` as a plain anchor.
 */
import type { CSSProperties, ReactNode } from 'react';
import { memo } from 'react';

import { simShell } from '../simulatorStyles';
import {
    joinClasses,
    SIM_FLEX_COL,
    SIM_FLEX_CENTER,
    SIM_FLEX_GROW_1,
    SIM_TEXT_SM,
} from '../ui/simulatorClasses';

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
    return hasTitle ? simShell.headerBetween : simShell.headerEnd;
}

function getNavTabClass(isLast: boolean, inactive: boolean): string {
    return joinClasses(
        simShell.navTab,
        SIM_FLEX_GROW_1,
        'simulator-spacing--py-2',
        SIM_FLEX_COL,
        SIM_FLEX_CENTER,
        'simulator-spacing--gap',
        SIM_TEXT_SM,
        !isLast && simShell.navTabBorderEnd,
        inactive ? simShell.navTabInactive : simShell.navTabActive,
    );
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
            <a href={exitTo} className={simShell.exitLink}>
                {exitLabel}
            </a>
        ) : null);

    const hasTitle = title != null && title !== '';

    const showHeader = hasTitle || exitArea != null;
    let navigation: ReactNode = null;
    if (resolvedSecondaryMenu) {
        navigation = (
            <div className={simShell.nav} role="tablist" aria-label="App secondary menu">
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
                            className={getNavTabClass(isLast, isBack || !isActive)}
                            style={{ minWidth: 0 }}
                            onClick={() =>
                                isBack ? resolvedSecondaryMenu.onSecondaryBack() : resolvedSecondaryMenu.onSelect(item.id)
                            }
                        >
                            {item.icon != null && item.icon !== '' && (
                                <span className={simShell.navTabLabel} aria-hidden>
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
            <div className={simShell.nav} role="tablist" aria-label="Simulator channels">
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
                            className={getNavTabClass(isLast, !isActive)}
                            style={{ minWidth: 0 }}
                            onClick={() => onChannelChange(ch.id)}
                        >
                            <span className={simShell.navTabLabel} aria-hidden>
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
                    {hasTitle && <span className={simShell.headerTitle}>{title}</span>}
                    {exitArea}
                </div>
            )}
            <div className={compact ? simShell.outerColumn : joinClasses(simShell.outerColumnPadded, 'simulator-min-vh-100')}>
                <div
                    className={compact ? simShell.frameStretch : simShell.frameCentered}
                    style={deviceFrameStyle}
                >
                    <div className={simShell.body}>{children}</div>
                    {navigation}
                </div>
            </div>
        </div>
    );
}

export default memo(PhoneSimulatorShell);
