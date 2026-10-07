import { useState, type HTMLAttributes, type ReactNode } from 'react';
import { UserRound } from 'lucide-react';

/** Shared identity treatment for simulator lists, conversations, and calls. */
export function SimulatorAvatar({
    avatarUrl,
    className = '',
    children,
    renderImage,
    ...rest
}: Readonly<
    {
        avatarUrl?: string;
        renderImage?: (fallback: ReactNode) => ReactNode;
    } & HTMLAttributes<HTMLSpanElement>
>) {
    const [failedUrl, setFailedUrl] = useState<string>();
    const fallback = <UserRound strokeWidth={1.5} aria-hidden='true' />;
    return (
        <span
            aria-hidden='true'
            {...rest}
            className={`simulator-avatar simulator-profile-avatar ${className}`}
        >
            {children ??
                renderImage?.(fallback) ??
                (avatarUrl && avatarUrl !== failedUrl ? (
                    <img src={avatarUrl} alt='' onError={() => setFailedUrl(avatarUrl)} />
                ) : (
                    fallback
                ))}
        </span>
    );
}
