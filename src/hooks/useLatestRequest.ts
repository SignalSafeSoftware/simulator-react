import { useEffect, useRef } from 'react';

/** Hands out an `isLatest` check per request so superseded or unmounted work can drop its result. */
export function useLatestRequest() {
    const generation = useRef(0);
    useEffect(
        () => () => {
            generation.current += 1;
        },
        [],
    );
    const begin = () => {
        const request = ++generation.current;
        return () => request === generation.current;
    };
    const cancel = () => {
        generation.current += 1;
    };
    return { begin, cancel };
}
