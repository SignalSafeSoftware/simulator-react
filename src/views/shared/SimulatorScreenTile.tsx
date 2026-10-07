import type { ReactNode } from 'react';
/** Shared Home launcher; absent host capabilities remain visibly unavailable. */
export default function SimulatorScreenTile({
    label,
    icon,
    onClick,
    title,
}: Readonly<{ label: string; icon?: ReactNode; onClick?: () => void; title?: string }>) {
    return (
        <button
            type='button'
            className='simulator-screen-tile'
            aria-label={label}
            onClick={onClick}
            disabled={!onClick}
            title={title}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
}
