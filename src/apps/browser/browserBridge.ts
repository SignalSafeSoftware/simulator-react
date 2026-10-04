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

type CaptureField = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type FormValues = Record<string, string | string[]>;

/* The helpers below are serialized into the sandbox, so none may close over host values. */
function capture(field: Element): field is CaptureField {
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

function valuesFor(field: CaptureField): string[] {
    return field instanceof HTMLSelectElement && field.multiple
        ? Array.from(field.selectedOptions, (option) => option.value)
        : [field.value];
}

function appendFormValue(values: FormValues, name: string, value: string): void {
    const previous = Object.hasOwn(values, name) ? values[name] : undefined;
    if (previous === undefined) {
        Object.defineProperty(values, name, {
            value,
            writable: true,
            enumerable: true,
            configurable: true,
        });
    } else {
        values[name] = typeof previous === 'string' ? [previous, value] : [...previous, value];
    }
}

function collectFormValues(form: HTMLFormElement): FormValues {
    const values: FormValues = {};
    for (const field of Array.from(form.elements)) {
        if (!capture(field) || !field.name) continue;
        for (const value of valuesFor(field)) appendFormValue(values, field.name, value);
    }
    return values;
}

/** Self-contained: serialized into the sandbox together with the helpers above. */
export function installBrowserBridge(config: BrowserBridgeConfig) {
    function emit(event: string, element: HTMLElement, values: FormValues = {}) {
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
        if (form instanceof HTMLFormElement) emit('submit', form, collectFormValues(form));
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

/** Script text for the sandboxed page: the helpers and installer, run once with the page config. */
export function browserBridgeSource(config: string): string {
    const helpers = [capture, valuesFor, appendFormValue, collectFormValues].join('\n');
    return `(function(){${helpers}\nreturn (${installBrowserBridge})(${config});})();`;
}
