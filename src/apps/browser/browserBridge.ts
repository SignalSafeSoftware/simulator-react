import type {
    BROWSER_ACTION_TYPE,
    BROWSER_ACTION_VERSION,
} from '@signalsafe/simulator-core/apps/browserProtocol';
export interface BrowserBridgeConfig {
    type: typeof BROWSER_ACTION_TYPE;
    version: typeof BROWSER_ACTION_VERSION;
    pageId: string;
    session: string;
    parentOrigin: string;
}

/** Self-contained: serialized into the sandbox, so never close over host values. */
export function installBrowserBridge(config: BrowserBridgeConfig) {
    function emit(
        event: string,
        element: HTMLElement,
        values: Record<string, string | string[]> = {},
    ) {
        const action = element.dataset.simulatorAction;
        if (!action) return;
        window.parent.postMessage(
            {
                type: config.type,
                version: config.version,
                pageId: config.pageId,
                session: config.session,
                action,
                event,
                values,
            },
            config.parentOrigin,
        );
    }
    function capture(
        field: Element,
    ): field is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
        return (
            (field instanceof HTMLInputElement ||
                field instanceof HTMLSelectElement ||
                field instanceof HTMLTextAreaElement) &&
            field.dataset.simulatorCapture === 'true' &&
            !field.disabled &&
            field.type !== 'password' &&
            field.type !== 'hidden' &&
            field.type !== 'submit' &&
            field.type !== 'button' &&
            (!(field instanceof HTMLInputElement) ||
                !['radio', 'checkbox'].includes(field.type) ||
                field.checked)
        );
    }
    function valuesFor(
        field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
    ): string[] {
        return field instanceof HTMLSelectElement && field.multiple
            ? Array.from(field.selectedOptions, (option) => option.value)
            : [field.value];
    }
    function click(event: MouseEvent) {
        if (!(event.target instanceof Element)) return;
        if (event.target.closest('a')) event.preventDefault();
        const element = event.target.closest('[data-simulator-action]');
        if (!(element instanceof HTMLElement) || element instanceof HTMLFormElement) return;
        if (element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) return;
        if (element instanceof HTMLInputElement && !['button', 'submit'].includes(element.type))
            return;
        if (
            (element instanceof HTMLInputElement || element instanceof HTMLButtonElement) &&
            element.type === 'submit' &&
            element.closest('form')
        )
            return;
        emit('click', element);
    }
    function submit(event: SubmitEvent) {
        event.preventDefault();
        const form = event.target;
        if (!(form instanceof HTMLFormElement)) return;
        const values: Record<string, string | string[]> = {};
        for (const field of Array.from(form.elements)) {
            if (!capture(field) || !field.name) continue;
            for (const value of valuesFor(field)) {
                const previous = Object.prototype.hasOwnProperty.call(values, field.name)
                    ? values[field.name]
                    : undefined;
                if (previous === undefined) {
                    Object.defineProperty(values, field.name, {
                        value,
                        writable: true,
                        enumerable: true,
                        configurable: true,
                    });
                } else {
                    values[field.name] =
                        typeof previous === 'string' ? [previous, value] : [...previous, value];
                }
            }
        }
        emit('submit', form, values);
    }
    function change(event: Event) {
        const field = event.target;
        if (!(field instanceof HTMLElement)) return;
        const values = capture(field) ? valuesFor(field) : [];
        emit(
            'change',
            field,
            values.length ? { value: values.length === 1 ? values.join('') : values } : {},
        );
    }
    document.addEventListener('click', click);
    document.addEventListener('submit', submit);
    document.addEventListener('change', change);
    return () => {
        document.removeEventListener('click', click);
        document.removeEventListener('submit', submit);
        document.removeEventListener('change', change);
    };
}
