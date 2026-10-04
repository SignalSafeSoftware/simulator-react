import { useEffect, useRef, useState } from 'react';

export interface ComposerSubmitOptions {
    canSend: boolean;
    send: () => void | Promise<void>;
    onSent: () => void;
    failureMessage: string;
}

/** Guards a compose form against double submit and updates after unmount. */
export function useComposerSubmit({
    canSend,
    send,
    onSent,
    failureMessage,
}: Readonly<ComposerSubmitOptions>) {
    const [pending, setPending] = useState(false);
    const [error, setError] = useState('');
    const sending = useRef(false);
    const mounted = useRef(true);
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);
    const submit = async () => {
        if (!canSend || sending.current) return;
        sending.current = true;
        setPending(true);
        setError('');
        try {
            await send();
            if (!mounted.current) return;
            onSent();
        } catch (error_) {
            if (!mounted.current) return;
            setError(error_ instanceof Error ? error_.message : failureMessage);
        } finally {
            sending.current = false;
            setPending(false);
        }
    };
    return { pending, error, submit };
}
