import { SimulatorNavIcon } from './SimulatorNavIcon.js';
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
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    type?: 'button' | 'submit';
    form?: string;
    ariaLabel?: string;
    describedBy?: string;
    title?: string;
}

export function SimulatorAppNavItem({
    label,
    icon,
    active = false,
    disabled = false,
    onClick,
    type = 'button',
    form,
    ariaLabel,
    describedBy,
    title,
}: Readonly<SimulatorAppNavItemProps>) {
    return (
        <button
            type={type}
            form={form}
            disabled={disabled}
            aria-current={active ? 'page' : undefined}
            aria-label={ariaLabel ?? label}
            aria-describedby={describedBy}
            title={title}
            className={
                active
                    ? `${cls.navButton} ${cls.navButtonActive}`
                    : `${cls.navButton} ${cls.navButtonInactive}`
            }
            onClick={onClick}
        >
            {icon != null && icon !== '' && (
                <span className={cls.navIcon} aria-hidden="true">
                    <SimulatorNavIcon icon={icon} />
                </span>
            )}
            <span className={cls.navLabel}>{label}</span>
        </button>
    );
}
