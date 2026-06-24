/**
 * Wireframe-style browser chrome: page title above, then nav bar (back, forward, refresh, home)
 * and address/search bar (simulator UI chrome, not app routing).
 */
import type { ReactNode } from 'react';

export interface SimulatorBrowserChromeProps {
    /** Page title shown centered above the chrome bar. */
    title: string;
    /** URL or placeholder shown in the address bar. */
    url: string;
    /** Optional segments to highlight in the URL (e.g. suspicious domain). */
    urlHighlightSegments?: { start: number; end: number }[];
    /** Called when user taps Back. */
    onBack?: () => void;
    /** Optional forward; no-op if not provided. */
    onForward?: () => void;
    /** Optional refresh; no-op if not provided. */
    onRefresh?: () => void;
    /** Optional home; no-op if not provided. */
    onHome?: () => void;
    children?: ReactNode;
    className?: string;
}

function getHighlightedSegmentKey(
    part: { text: string; highlight: boolean },
    counts: Map<string, number>
): string {
    const base = `${part.highlight ? 'highlight' : 'plain'}:${part.text}`;
    const nextCount = (counts.get(base) ?? 0) + 1;
    counts.set(base, nextCount);
    return `${base}-${nextCount}`;
}

function renderUrlWithHighlights(
    url: string,
    segments: { start: number; end: number }[] | undefined
): React.ReactNode {
    const s = url || 'Web Page Title';
    if (segments == null || segments.length === 0) return s;
    const parts: Array<{ text: string; highlight: boolean }> = [];
    let lastEnd = 0;
    const sorted = [...segments].sort((a, b) => a.start - b.start);
    for (const seg of sorted) {
        const start = Math.max(seg.start, lastEnd);
        const end = Math.min(seg.end, s.length);
        if (start < end) {
            if (start > lastEnd) parts.push({ text: s.slice(lastEnd, start), highlight: false });
            parts.push({ text: s.slice(start, end), highlight: true });
            lastEnd = end;
        }
    }
    if (lastEnd < s.length) parts.push({ text: s.slice(lastEnd), highlight: false });
    if (parts.length === 0) return s;
    const counts = new Map<string, number>();
    return (
        <>
            {parts.map((p) =>
                p.highlight ? (
                    <span
                        key={getHighlightedSegmentKey(p, counts)}
                        style={{ backgroundColor: 'rgba(220, 53, 69, 0.25)', borderRadius: 2 }}
                    >
                        {p.text}
                    </span>
                ) : (
                    p.text
                )
            )}
        </>
    );
}

export default function SimulatorBrowserChrome({
    title,
    url,
    urlHighlightSegments,
    onBack,
    onForward,
    onRefresh,
    onHome,
    children,
    className = '',
}: Readonly<SimulatorBrowserChromeProps>) {
    return (
        <div className={`d-flex flex-column bg-light ${className}`.trim()} style={{ border: '1px solid #dee2e6' }}>
            <div className="text-center py-2 border-bottom border-secondary small fw-semibold text-body bg-white">
                {title || 'Web Page Title'}
            </div>
            <div
                className="d-flex align-items-center gap-1 px-2 py-2 border-bottom border-secondary bg-secondary bg-opacity-10"
                style={{ minHeight: 40 }}
            >
                <button
                    type="button"
                    className="btn btn-link btn-sm p-1 text-body"
                    onClick={onBack}
                    aria-label="Back"
                >
                    ←
                </button>
                <button
                    type="button"
                    className="btn btn-link btn-sm p-1 text-body"
                    onClick={onForward}
                    aria-label="Forward"
                >
                    →
                </button>
                <button
                    type="button"
                    className="btn btn-link btn-sm p-1 text-body"
                    onClick={onRefresh}
                    aria-label="Refresh"
                >
                    ↻
                </button>
                <button
                    type="button"
                    className="btn btn-link btn-sm p-1 text-body"
                    onClick={onHome}
                    aria-label="Home"
                >
                    ⌂
                </button>
                <div
                    className="flex-grow-1 d-flex align-items-center px-2 bg-white border border-secondary rounded-0 small text-muted overflow-hidden"
                    style={{ minHeight: 32 }}
                >
                    <span className="text-truncate">
                        {renderUrlWithHighlights(url, urlHighlightSegments)}
                    </span>
                </div>
                <span className="text-secondary small ms-1" aria-hidden>Q</span>
            </div>
            <div className="bg-white p-3 flex-grow-1 min-vh-0" style={{ minHeight: 120 }}>
                {children}
            </div>
        </div>
    );
}
