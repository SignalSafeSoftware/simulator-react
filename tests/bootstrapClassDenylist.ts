/**
 * Bootstrap CSS class strings that must not appear in runtime simulator markup.
 */
export const BOOTSTRAP_CLASS_DENYLIST = [
    'card-header',
    'card-body',
    'list-group',
    'list-group-item',
    'list-group-flush',
    'btn-group',
    'btn-light',
    'btn btn-',
    'btn-link',
    'badge bg-',
    'dropdown-menu',
    'dropdown-item',
    'form-control',
    'bg-primary-subtle',
    'bg-body-secondary',
    'bg-body-tertiary',
    'bg-light',
    'bg-white',
    'bg-primary',
    'bg-secondary',
    'bg-dark',
    'border-warning',
    'border-danger',
    'border-secondary',
    'd-flex',
    'text-muted',
    'text-body',
    'text-dark',
    'text-break',
    'fw-bold',
    'fw-semibold',
    'flex-grow-1',
    'flex-shrink-0',
    'min-h-0',
    'list-unstyled',
    'rounded-0',
    'shadow-sm',
    'visually-hidden',
] as const;

export function classNameContainsBootstrapToken(className: unknown): string | null {
    if (typeof className !== 'string') return null;
    const tokens = className.split(/\s+/);
    for (const token of tokens) {
        for (const denied of BOOTSTRAP_CLASS_DENYLIST) {
            if (denied.endsWith('-') || denied.includes(' ')) {
                if (className.includes(denied)) return denied;
                continue;
            }
            if (token === denied || token.startsWith(`${denied}-`)) {
                return denied;
            }
        }
        if (token === 'card' || token === 'badge' || token === 'btn' || token === 'rounded' || token === 'small') {
            return token;
        }
    }
    return null;
}

export function collectBootstrapViolations(node: {
    props?: { className?: unknown; children?: unknown };
    type?: unknown;
    children?: unknown;
}): string[] {
    const violations: string[] = [];
    const match = classNameContainsBootstrapToken(node.props?.className);
    if (match) {
        violations.push(String(match));
    }
    const childList = node.children ?? node.props?.children;
    if (Array.isArray(childList)) {
        for (const child of childList) {
            if (child && typeof child === 'object') {
                violations.push(...collectBootstrapViolations(child as typeof node));
            }
        }
    } else if (childList && typeof childList === 'object') {
        violations.push(...collectBootstrapViolations(childList as typeof node));
    }
    return violations;
}
