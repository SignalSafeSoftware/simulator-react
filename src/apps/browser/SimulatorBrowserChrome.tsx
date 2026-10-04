/**
 * Wireframe-style browser chrome: page title above, then nav bar (back, forward, refresh, home)
 * and address/search bar (simulator UI chrome, not app routing).
 */
import {
    SIM_BORDER_BOTTOM,
    SIM_BTN_PLAIN,
    SIM_BTN_SM,
    SIM_FLEX_COL,
    SIM_FLEX_GROW_1,
    SIM_MUTED,
    SIM_OVERFLOW_HIDDEN,
    SIM_SURFACE_LIGHT,
    SIM_SURFACE_WHITE,
    SIM_TEXT_BODY,
    SIM_TEXT_SM,
    SIM_TEXT_TRUNCATE,
    SimulatorButtonTone,
    joinClasses,
    simBtnToneClass,
} from '../../ui/styles/simulatorClasses.js';
import { ArrowLeft, ArrowRight, Home, RotateCw } from 'lucide-react';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { type ReactNode } from 'react';
import { withStableKeys } from '../../utils/lists/stableKeys.js';

import { simBorder, simLayout, simScreen, simSpacing } from '../../simulatorStyles.js';

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

function renderUrlWithHighlights(
    url: string,
    segments: { start: number; end: number }[] | undefined,
    fallback: string,
): React.ReactNode {
    const s = url || fallback;
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
    const keyedParts = withStableKeys(
        parts,
        (p) => `${p.highlight ? 'highlight' : 'plain'}:${p.text}`,
    );
    return (
        <>
            {keyedParts.map(({ item: p, key }) =>
                p.highlight ? (
                    <span
                        key={key}
                        style={{ backgroundColor: 'rgba(220, 53, 69, 0.25)', borderRadius: 2 }}
                    >
                        {p.text}
                    </span>
                ) : (
                    p.text
                ),
            )}
        </>
    );
}

const chromeNavBtnClass = joinClasses(
    simBtnToneClass(SimulatorButtonTone.Link),
    SIM_BTN_SM,
    SIM_BTN_PLAIN,
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
    const screenLocale = useSimulatorLocale();

    return (
        <div
            className={joinClasses('simulator-browser', SIM_FLEX_COL, SIM_SURFACE_LIGHT, className)}
        >
            <div className={joinClasses(simScreen.header, SIM_SURFACE_WHITE)}>
                {title || screenLocale.t('screen.simulatorBrowserChrome.web.page.title')}
            </div>
            <div
                className={joinClasses(
                    'simulator-browser__toolbar',
                    simLayout.row,
                    simSpacing.gap2,
                    simSpacing.px2,
                    simSpacing.py2,
                    SIM_BORDER_BOTTOM,
                    'simulator-surface--secondary-muted',
                )}
                style={{ minHeight: 40 }}
            >
                <button
                    type="button"
                    className={chromeNavBtnClass}
                    onClick={onBack}
                    aria-label={screenLocale.t('screen.simulatorBrowserChrome.back')}
                >
                    <ArrowLeft size={18} aria-hidden="true" />
                </button>
                <button
                    type="button"
                    className={chromeNavBtnClass}
                    onClick={onForward}
                    aria-label={screenLocale.t('screen.simulatorBrowserChrome.forward')}
                >
                    <ArrowRight size={18} aria-hidden="true" />
                </button>
                <button
                    type="button"
                    className={chromeNavBtnClass}
                    onClick={onRefresh}
                    aria-label={screenLocale.t('screen.simulatorBrowserChrome.refresh')}
                >
                    <RotateCw size={18} aria-hidden="true" />
                </button>
                <button
                    type="button"
                    className={chromeNavBtnClass}
                    onClick={onHome}
                    aria-label={screenLocale.t('screen.simulatorBrowserChrome.home')}
                >
                    <Home size={18} aria-hidden="true" />
                </button>
                <div
                    className={joinClasses(
                        'simulator-browser__address',
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
                    <span className={SIM_TEXT_TRUNCATE}>
                        {renderUrlWithHighlights(
                            url,
                            urlHighlightSegments,
                            screenLocale.t('app.browser.pageTitle'),
                        )}
                    </span>
                </div>
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
