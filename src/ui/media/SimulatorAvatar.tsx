import { useState, type HTMLAttributes } from 'react';
import { UserRound } from 'lucide-react';

/** Shared identity treatment for simulator lists, conversations, and calls. */
export function SimulatorAvatar({
    avatarUrl,
    className = '',
    ...rest
}: Readonly<{ avatarUrl?: string } & HTMLAttributes<HTMLSpanElement>>) {
    const [failedUrl, setFailedUrl] = useState<string>();
    return (
        <span
            aria-hidden='true'
            {...rest}
            className={`simulator-avatar simulator-profile-avatar ${className}`}
        >
            {avatarUrl && avatarUrl !== failedUrl ? (
                <img src={avatarUrl} alt='' onError={() => setFailedUrl(avatarUrl)} />
            ) : (
                <UserRound strokeWidth={1.5} aria-hidden='true' />
            )}
        </span>
    );
}
