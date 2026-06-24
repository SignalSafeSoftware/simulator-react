/**
 * Renders a single browser page by layout family. Wireframe: landing, login/form, content/download/result.
 * Uses SimulatorBrowserChrome (title above bar, back/forward/refresh/home, address bar).
 */
import { Button, Form } from 'react-bootstrap';
import SimulatorBrowserChrome from '../components/SimulatorBrowserChrome';
import type { SimulatorAction, SimulatorBrowserPage } from '../types/session';
import { SimulatorActions } from '../actions';
import { simTypo } from '../simulatorStyles';

export interface BrowserPageRendererProps {
    page: SimulatorBrowserPage;
    onAction: (action: SimulatorAction) => void;
    /** When set, chrome Back button is shown and calls this. */
    onBack?: () => void;
}

function urlHighlight(url: string): { start: number; end: number }[] | undefined {
    const suspicious = ['phish', 'evil', 'fake'];
    for (const s of suspicious) {
        const i = url.toLowerCase().indexOf(s);
        if (i >= 0) return [{ start: i, end: i + s.length }];
    }
    return undefined;
}

function getFieldInputType(fieldType: string | undefined): 'text' | 'password' | 'email' {
    if (fieldType === 'password') {
        return 'password';
    }
    if (fieldType === 'email') {
        return 'email';
    }
    return 'text';
}

function getStableKey(
    parts: Array<string | null | undefined>
): string {
    return parts.map((part) => part ?? '').join('|');
}

function withStableKeys<T>(
    items: T[],
    getBaseKey: (item: T) => string
): Array<{ key: string; item: T; index: number }> {
    const counts = new Map<string, number>();
    return items.map((item, index) => {
        const base = getBaseKey(item);
        const nextCount = (counts.get(base) ?? 0) + 1;
        counts.set(base, nextCount);
        return { key: `${base}-${nextCount}`, item, index };
    });
}

function normalizeBrowserLayout(layout: string | undefined): string {
    const layoutNorm = (layout ?? 'content').toLowerCase();
    // Master templates use page_layout "centered" / "split" for login gates; renderer uses "login".
    if (layoutNorm === 'centered' || layoutNorm === 'split') {
        return 'login';
    }
    return layoutNorm;
}

export default function BrowserPageRenderer({ page, onAction, onBack }: Readonly<BrowserPageRendererProps>) {
    const { url, title, layout, content, buttons, formFields, logoUrl, warningBanner, showMediaPlaceholder } = page;
    const layoutNorm = normalizeBrowserLayout(layout);
    const displayTitle = title || 'Web Page Title';
    const downloadButtons = buttons ?? [];
    const keyedFormFields = withStableKeys(
        formFields ?? [],
        (field) => getStableKey([field.name, field.label, field.type])
    );
    const keyedButtons = withStableKeys(
        buttons ?? [],
        (button) => getStableKey([button.label, button.href, button.targetPageId])
    );
    const keyedDownloadButtons = withStableKeys(
        downloadButtons,
        (button) => getStableKey([button.label, button.href, button.targetPageId])
    );

    return (
        <SimulatorBrowserChrome
            title={displayTitle}
            url={url || displayTitle}
            urlHighlightSegments={urlHighlight(url)}
            onBack={onBack}
        >
            {/* Landing / generic page: optional logo, content area, buttons */}
            {(layoutNorm === 'landing' || layoutNorm === 'content') && (
                <>
                    {logoUrl != null && logoUrl !== '' && (
                        <div className="mb-3 text-center">
                            <img src={logoUrl} alt="" style={{ maxHeight: 48 }} />
                        </div>
                    )}
                    {layoutNorm === 'content' && warningBanner != null && warningBanner !== '' && (
                        <div className="alert alert-warning rounded-0 border-0 mb-3 small" role="alert">
                            {warningBanner}
                        </div>
                    )}
                    {layoutNorm === 'content' && showMediaPlaceholder === true && (
                        <div className="mb-3 border border-secondary rounded-0 bg-dark bg-opacity-10 d-flex align-items-center justify-content-center" style={{ minHeight: 160 }}>
                            <span className="text-secondary" style={{ fontSize: '2.5rem' }} aria-hidden>▶</span>
                        </div>
                    )}
                    {layoutNorm === 'content' && showMediaPlaceholder === true && (
                        <div className="d-flex align-items-center gap-2 mb-3 small text-muted">
                            <span aria-hidden>⏮</span>
                            <div className="flex-grow-1 bg-secondary bg-opacity-25 rounded-0" style={{ height: 6 }} />
                            <span aria-hidden>🔊</span>
                            <span aria-hidden>⛶</span>
                        </div>
                    )}
                    {content != null && content !== '' && (
                        <p className="mb-3 small text-secondary" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
                            {content}
                        </p>
                    )}
                    {layoutNorm === 'landing' && formFields != null && formFields.length > 0 && (
                        <Form
                            onSubmit={(e) => {
                                e.preventDefault();
                                onAction(SimulatorActions.submitForm({}));
                            }}
                        >
                            {keyedFormFields.map(({ item: field, key }) => (
                                <Form.Group key={key} className="mb-2">
                                    <Form.Label className="small fw-medium text-body">{field.label}</Form.Label>
                                    <Form.Control
                                        type={getFieldInputType(field.type)}
                                        className="rounded-0"
                                        autoComplete="off"
                                        aria-label={field.label}
                                    />
                                </Form.Group>
                            ))}
                            <Button type="submit" variant="primary" className="rounded-0">
                                Submit
                            </Button>
                        </Form>
                    )}
                    {buttons != null && buttons.length > 0 && (
                        <div className="d-flex flex-wrap gap-2 mt-2">
                            {keyedButtons.map(({ item: btn, key, index }) => (
                                <Button
                                    key={key}
                                    variant="primary"
                                    size="sm"
                                    className="rounded-0"
                                    onClick={() =>
                                        onAction(
                                            SimulatorActions.clickLink({
                                                href: btn.href ?? url,
                                                linkIndex: index,
                                                pageId: btn.targetPageId,
                                            })
                                        )
                                    }
                                >
                                    {btn.label}
                                </Button>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Login / form page: centered modal-like form, Submit (blue), Cancel (gray) */}
            {layoutNorm === 'login' && (
                <div className="d-flex justify-content-center align-items-start">
                    <div className="border border-secondary rounded-0 bg-white p-3 shadow-sm" style={{ maxWidth: 320 }}>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <span className="small fw-semibold text-body">
                                {displayTitle} Login
                            </span>
                            {onBack != null && (
                                <button
                                    type="button"
                                    className="btn btn-link btn-sm p-0 text-body"
                                    onClick={onBack}
                                    aria-label="Close"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                        {content != null && content !== '' && (
                            <p className="mb-2 small text-muted">{content}</p>
                        )}
                        {formFields != null && formFields.length > 0 && (
                            <Form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    onAction(SimulatorActions.submitForm({}));
                                }}
                            >
                                {keyedFormFields.map(({ item: field, key }) => (
                                    <Form.Group key={key} className="mb-2">
                                        <Form.Label className="small fw-medium text-body">{field.label}</Form.Label>
                                        <Form.Control
                                            type={getFieldInputType(field.type)}
                                            className="rounded-0"
                                            autoComplete="off"
                                            aria-label={field.label}
                                        />
                                    </Form.Group>
                                ))}
                                <div className="d-flex gap-2 mt-3">
                                    <Button type="submit" variant="primary" className="rounded-0 flex-grow-1">
                                        Submit
                                    </Button>
                                    {onBack != null && (
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            className="rounded-0 flex-grow-1"
                                            onClick={onBack}
                                        >
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </Form>
                        )}
                    </div>
                </div>
            )}

            {/* Result page: post-submit message */}
            {layoutNorm === 'result' && (
                <p className={simTypo.emptyState}>
                    {content ?? 'Simulation complete. You submitted credentials on a simulated page.'}
                </p>
            )}

            {/* Download page: optional warning, media placeholder, content, download buttons */}
            {layoutNorm === 'download' && (
                <>
                    {warningBanner != null && warningBanner !== '' && (
                        <div className="alert alert-warning rounded-0 border-0 mb-3 small" role="alert">
                            {warningBanner}
                        </div>
                    )}
                    {showMediaPlaceholder === true && (
                        <div className="mb-3 border border-secondary rounded-0 bg-dark bg-opacity-10 d-flex align-items-center justify-content-center" style={{ minHeight: 140 }}>
                            <span className="text-secondary" style={{ fontSize: '2rem' }} aria-hidden>▶</span>
                        </div>
                    )}
                    {content != null && content !== '' && (
                        <p className="mb-3 small text-secondary" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
                            {content}
                        </p>
                    )}
                    {downloadButtons.length > 0 ? (
                        <div className="d-flex flex-wrap gap-2">
                            {keyedDownloadButtons.map(({ item: btn, key }) => (
                                <Button
                                    key={key}
                                    variant="outline-secondary"
                                    size="sm"
                                    className="rounded-0"
                                    onClick={() => onAction(SimulatorActions.downloadClick(btn.href ?? btn.label))}
                                >
                                    {btn.label}
                                </Button>
                            ))}
                        </div>
                    ) : (
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            className="rounded-0"
                            onClick={() => onAction(SimulatorActions.downloadClick(page.id))}
                        >
                            Download
                        </Button>
                    )}
                </>
            )}

            {/* Fallback for unknown layout: render content + buttons */}
            {layoutNorm !== 'landing' && layoutNorm !== 'content' && layoutNorm !== 'login' && layoutNorm !== 'result' && layoutNorm !== 'download' && (
                <>
                    {warningBanner != null && warningBanner !== '' && (
                        <div className="alert alert-warning rounded-0 border-0 mb-3 small" role="alert">
                            {warningBanner}
                        </div>
                    )}
                    {content != null && content !== '' && (
                        <p className="mb-3 small text-secondary" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
                            {content}
                        </p>
                    )}
                    {buttons != null && buttons.length > 0 && (
                        <div className="d-flex flex-wrap gap-2">
                            {keyedButtons.map(({ item: btn, key, index }) => (
                                <Button
                                    key={key}
                                    variant="primary"
                                    size="sm"
                                    className="rounded-0"
                                    onClick={() =>
                                        onAction(
                                            SimulatorActions.clickLink({
                                                href: btn.href ?? url,
                                                linkIndex: index,
                                                pageId: btn.targetPageId,
                                            })
                                        )
                                    }
                                >
                                    {btn.label}
                                </Button>
                            ))}
                        </div>
                    )}
                </>
            )}
        </SimulatorBrowserChrome>
    );
}
