import { useState } from 'react';
import { UserRound } from 'lucide-react';

/** Shared identity treatment for simulator lists, conversations, and calls. */
export default function SimulatorAvatar({
    avatarUrl,
    className = '',
}: Readonly<{ avatarUrl?: string; className?: string }>) {
    const [failedUrl, setFailedUrl] = useState<string>();
    return (
        <span
            className={`simulator-avatar simulator-profile-avatar ${className}`}
            aria-hidden="true"
        >
            {avatarUrl && avatarUrl !== failedUrl ? (
                <img src={avatarUrl} alt="" onError={() => setFailedUrl(avatarUrl)} />
            ) : (
                <UserRound strokeWidth={1.5} aria-hidden="true" />
            )}
        </span>
    );
}
