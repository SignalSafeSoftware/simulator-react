import {
    BrowserLayout,
    type SimulatorBrowserPage,
    type SimulatorBrowserPayload,
} from '../../types/session.js';
import { DEFAULT_BROWSER_SUBMIT_TARGET } from '../../constants.js';
import { englishLocale } from '../../i18n/englishLocale.js';
import { FieldInputType, getFieldInputType } from '../../utils/payload/browserFieldType.js';
import type { SimulatorDevicePayload } from '@signalsafe/simulator-core/devicePayload';
import { optionalString, stringOr } from './mapperValues.js';

function normalizePageUrl(url: string | undefined): string {
    const u = stringOr(url, 'page');
    return u.startsWith('http') ? u : `https://${u}/`;
}

function mapFormFields(
    fields: Array<{ name?: string; type?: string; label?: string }> | undefined,
): NonNullable<SimulatorBrowserPage['formFields']> {
    if (fields == null || fields.length === 0) {
        return [
            { name: 'username', type: FieldInputType.Text, label: 'Username' },
            { name: 'password', type: FieldInputType.Password, label: 'Password' },
        ];
    }
    return fields.map((f) => ({
        name: stringOr(f.name, 'field'),
        type: getFieldInputType(f.type),
        label: stringOr(f.label, 'Field'),
    }));
}

/** Map internet app section to session internet (browser) payload (page-based). */
export function mapInternet(
    internet: SimulatorDevicePayload['internet'],
): SimulatorBrowserPayload | null {
    if (internet == null) return null;
    const rawPages = internet.pages ?? [];
    const forms = internet.forms ?? [];

    const pages: SimulatorBrowserPage[] = rawPages.map((p) => {
        const pageId = stringOr(p.id, 'page');
        const form = forms.find((f: { page_id?: string }) => f.page_id === pageId) ?? forms[0];
        const rawFields = form?.fields ?? [];
        const formFields = mapFormFields(rawFields);
        const submitTargetPageId =
            typeof p.submit_target_page_id === 'string' && p.submit_target_page_id !== ''
                ? p.submit_target_page_id
                : undefined;
        const content = typeof p.content === 'string' && p.content !== '' ? p.content : undefined;
        return {
            id: pageId,
            url: normalizePageUrl(p.url),
            title: stringOr(p.title, 'Page'),
            layout: stringOr(p.layout, BrowserLayout.Content),
            content,
            buttons: p.buttons?.map((button) => {
                if (Object.hasOwn(button, 'targetPageId')) {
                    throw new Error(
                        'Removed simulator button field targetPageId; migrate it to target_page_id.',
                    );
                }
                return {
                    label: stringOr(button.label),
                    href: optionalString(button.href),
                    targetPageId: optionalString(button.target_page_id),
                };
            }),
            logoUrl: p.logo_url,
            warningBanner: p.warning_banner,
            showMediaPlaceholder: p.show_media_placeholder,
            formFields,
            submitTargetPageId: submitTargetPageId ?? undefined,
        };
    });

    const [firstPage] = pages;
    if (!firstPage) return null;
    if (!pages.some((p) => p.id === DEFAULT_BROWSER_SUBMIT_TARGET)) {
        pages.push({
            id: DEFAULT_BROWSER_SUBMIT_TARGET,
            url: firstPage.url + DEFAULT_BROWSER_SUBMIT_TARGET,
            title: 'Result',
            layout: DEFAULT_BROWSER_SUBMIT_TARGET,
            content: englishLocale.t('copy.fullDeviceToSession.simulation.complete'),
        });
    }

    return {
        pages,
        defaultPageId: firstPage.id,
    };
}
