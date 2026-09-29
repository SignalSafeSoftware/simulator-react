const cls = {
    navButton: 'simulator-device-nav__button',
    navButtonActive: 'simulator-device-nav__button--active',
    navButtonInactive: 'simulator-device-nav__button--inactive',
    navIcon: 'simulator-device-nav__icon',
    navLabel: 'simulator-device-nav__label',
};

export interface SimulatorAppNavItemProps {
    label: string;
    icon?: string;
    active?: boolean;
    disabled?: boolean;
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
    ariaLabel?: string;
    describedBy?: string;
}

export function SimulatorAppNavItem({
    label,
    icon,
    active = false,
    disabled = false,
    onClick,
    ariaLabel,
    describedBy,
}: Readonly<SimulatorAppNavItemProps>) {
    return (
        <button
            type="button"
            disabled={disabled}
            aria-current={active ? 'page' : undefined}
            aria-label={ariaLabel ?? label}
            aria-describedby={describedBy}
            className={
                active
                    ? `${cls.navButton} ${cls.navButtonActive}`
                    : `${cls.navButton} ${cls.navButtonInactive}`
            }
            onClick={onClick}
        >
            {icon != null && icon !== '' && (
                <span className={cls.navIcon} aria-hidden="true">
                    {icon}
                </span>
            )}
            <span className={cls.navLabel}>{label}</span>
        </button>
    );
}
