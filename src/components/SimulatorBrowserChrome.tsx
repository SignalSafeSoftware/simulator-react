/**
 * Wireframe-style browser chrome: page title above, then nav bar (back, forward, refresh, home)
 * and address/search bar (simulator UI chrome, not app routing).
 */
import type { ReactNode } from 'react';

import { simBorder, simLayout, simScreen, simSpacing } from '../simulatorStyles';
import {
    joinClasses,
    SIM_FLEX_COL,
    SIM_FLEX_GROW_1,
    SIM_MUTED,
    SIM_OVERFLOW_HIDDEN,
    SIM_SURFACE_LIGHT,
    SIM_SURFACE_WHITE,
    SIM_TEXT_BODY,
    SIM_TEXT_SM,
    simBtnToneClass,
} from '../ui/simulatorClasses';

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

const chromeNavBtnClass = joinClasses(
    simBtnToneClass('link'),
    'simulator-btn--sm',
    'simulator-btn--plain',
    simSpacing.p2,
    SIM_TEXT_BODY,
);

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
        <div
            className={joinClasses(SIM_FLEX_COL, SIM_SURFACE_LIGHT, className)}
            style={{ border: '1px solid #dee2e6' }}
        >
            <div className={joinClasses(simScreen.header, SIM_SURFACE_WHITE)}>{title || 'Web Page Title'}</div>
            <div
                className={joinClasses(
                    simLayout.row,
                    simSpacing.gap2,
                    simSpacing.px2,
                    simSpacing.py2,
                    'simulator-border simulator-border--bottom',
                    'simulator-surface--secondary-muted',
                )}
                style={{ minHeight: 40 }}
            >
                <button type="button" className={chromeNavBtnClass} onClick={onBack} aria-label="Back">
                    ←
                </button>
                <button type="button" className={chromeNavBtnClass} onClick={onForward} aria-label="Forward">
                    →
                </button>
                <button type="button" className={chromeNavBtnClass} onClick={onRefresh} aria-label="Refresh">
                    ↻
                </button>
                <button type="button" className={chromeNavBtnClass} onClick={onHome} aria-label="Home">
                    ⌂
                </button>
                <div
                    className={joinClasses(
                        SIM_FLEX_GROW_1,
                        simLayout.row,
                        simSpacing.px2,
                        SIM_SURFACE_WHITE,
                        simBorder.tile,
                        SIM_TEXT_SM,
                        SIM_MUTED,
                        SIM_OVERFLOW_HIDDEN,
                    )}
                    style={{ minHeight: 32 }}
                >
                    <span className="simulator-text--truncate">
                        {renderUrlWithHighlights(url, urlHighlightSegments)}
                    </span>
                </div>
                <span className={joinClasses('simulator-text--secondary', SIM_TEXT_SM, simSpacing.ms1)} aria-hidden>Q</span>
            </div>
            <div
                className={joinClasses(
                    SIM_SURFACE_WHITE,
                    simSpacing.p3,
                    SIM_FLEX_GROW_1,
                    'simulator-min-vh-0',
                )}
                style={{ minHeight: 120 }}
            >
                {children}
            </div>
        </div>
    );
}
