import type {
    ButtonHTMLAttributes,
    InputHTMLAttributes,
    LabelHTMLAttributes,
    ReactNode,
    TextareaHTMLAttributes,
} from 'react';

import {
    SIM_ALERT,
    SIM_BTN,
    SIM_CARD,
    SIM_CARD_BODY,
    SIM_CARD_HEADER,
    SIM_FIELD,
    SIM_FIELD_LABEL,
    SIM_INPUT,
    SIM_LIST,
    SIM_LIST_ITEM,
    SIM_LIST_ITEM_ACTION,
    SIM_LIST_ITEM_ACTIVE,
    SIM_MODAL,
    SIM_MODAL_BODY,
    SIM_MODAL_DIALOG,
    joinClasses,
    simAlertToneClass,
    simBtnToneClass,
} from './simulatorClasses';

export function SimulatorButton({
    tone,
    className,
    children,
    ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: string }) {
    return (
        <button type="button" className={joinClasses(simBtnToneClass(tone), className)} {...rest}>
            {children}
        </button>
    );
}

export function SimulatorInput({
    className,
    ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
    return <input className={joinClasses(SIM_INPUT, className)} {...rest} />;
}

export function SimulatorTextarea({
    className,
    ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return <textarea className={joinClasses(SIM_INPUT, className)} {...rest} />;
}

export function SimulatorField({
    className,
    children,
}: {
    className?: string;
    children: ReactNode;
}) {
    return <div className={joinClasses(SIM_FIELD, className)}>{children}</div>;
}

export function SimulatorLabel({
    className,
    children,
    ...rest
}: LabelHTMLAttributes<HTMLLabelElement>) {
    return (
        <label className={joinClasses(SIM_FIELD_LABEL, className)} {...rest}>
            {children}
        </label>
    );
}

export function SimulatorCard({
    className,
    children,
    ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={joinClasses(SIM_CARD, className)} {...rest}>
            {children}
        </div>
    );
}

export function SimulatorCardHeader({
    className,
    children,
    ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={joinClasses(SIM_CARD_HEADER, className)} {...rest}>
            {children}
        </div>
    );
}

export function SimulatorCardBody({
    className,
    children,
    id,
    ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div id={id} className={joinClasses(SIM_CARD_BODY, className)} {...rest}>
            {children}
        </div>
    );
}

export function SimulatorAlert({
    tone = 'warning',
    className,
    children,
    ...rest
}: React.HTMLAttributes<HTMLDivElement> & { tone?: 'warning' | 'danger' | 'info' }) {
    return (
        <div className={joinClasses(simAlertToneClass(tone), className)} role="alert" {...rest}>
            {children}
        </div>
    );
}

export interface SimulatorCollapseProps {
    open: boolean;
    id?: string;
    className?: string;
    children: ReactNode;
}

export function SimulatorCollapse({ open, id, className, children }: Readonly<SimulatorCollapseProps>) {
    if (!open) return null;
    return (
        <div id={id} className={className}>
            {children}
        </div>
    );
}

export function SimulatorList({
    className,
    children,
    ...rest
}: React.HTMLAttributes<HTMLUListElement>) {
    return (
        <ul className={joinClasses(SIM_LIST, className)} {...rest}>
            {children}
        </ul>
    );
}

export interface SimulatorListItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
    action?: boolean;
    active?: boolean;
}

export function SimulatorListItem({
    action,
    active,
    className,
    children,
    onClick,
    ...rest
}: SimulatorListItemProps) {
    return (
        <li
            className={joinClasses(
                SIM_LIST_ITEM,
                action && SIM_LIST_ITEM_ACTION,
                active && SIM_LIST_ITEM_ACTIVE,
                className,
            )}
            onClick={onClick}
            {...rest}
        >
            {children}
        </li>
    );
}

export function SimulatorDialog({
    open,
    onClose,
    className,
    children,
    'aria-label': ariaLabel,
}: {
    open: boolean;
    onClose?: () => void;
    className?: string;
    children: ReactNode;
    'aria-label'?: string;
}) {
    if (!open) return null;
    return (
        <dialog
            className={joinClasses(SIM_MODAL, 'simulator-modal--open', className)}
            open
            aria-label={ariaLabel}
            onCancel={(event) => {
                event.preventDefault();
                onClose?.();
            }}
        >
            <div className={SIM_MODAL_DIALOG}>
                <div className={SIM_MODAL_BODY}>{children}</div>
            </div>
        </dialog>
    );
}

export { SIM_ALERT, SIM_BTN, SIM_CARD, SIM_INPUT };
