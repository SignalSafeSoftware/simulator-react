import { useState } from 'react';
import type { MailFolder } from './mailShared.js';

export function useMailNav(onBack: () => void) {
    const [source, setSource] = useState<string | null>(null);
    const [folder, setFolder] = useState<MailFolder | null>(null);
    const [selected, setSelected] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    function closeTo(next: MailFolder) {
        setSource(null);
        setSelected(null);
        setFolder(next);
    }
    function openFolder(next: MailFolder) {
        setFolder(next);
        setQuery('');
    }
    function back() {
        if (source) setSource(null);
        else if (selected) setSelected(null);
        else if (folder) {
            setFolder(null);
            setQuery('');
        } else onBack();
    }
    return {
        source,
        setSource,
        folder,
        selected,
        setSelected,
        query,
        setQuery,
        closeTo,
        openFolder,
        back,
    };
}
