import type {
    ButtonHTMLAttributes,
    InputHTMLAttributes,
    LabelHTMLAttributes,
    MouseEventHandler,
    ReactNode,
    TextareaHTMLAttributes,
} from 'react';

import {
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
    SIM_LIST_ITEM_BUTTON,
    SIM_MODAL,
    SIM_MODAL_BODY,
    SIM_MODAL_DIALOG,
    joinClasses,
    simAlertToneClass,
    simBtnToneClass,
} from './simulatorClasses.js';

export function SimulatorButton({
    tone,
    className,
    children,
    ...rest
}: Readonly<ButtonHTMLAttributes<HTMLButtonElement> & { tone?: string }>) {
    return (
        <button type="button" className={joinClasses(simBtnToneClass(tone), className)} {...rest}>
            {children}
        </button>
    );
}

export function SimulatorInput({
    className,
    ...rest
}: Readonly<InputHTMLAttributes<HTMLInputElement>>) {
    return <input className={joinClasses(SIM_INPUT, className)} {...rest} />;
}

export function SimulatorTextarea({
    className,
    ...rest
}: Readonly<TextareaHTMLAttributes<HTMLTextAreaElement>>) {
    return <textarea className={joinClasses(SIM_INPUT, className)} {...rest} />;
}

export function SimulatorField({
    className,
    children,
}: Readonly<{
    className?: string;
    children: ReactNode;
}>) {
    return <div className={joinClasses(SIM_FIELD, className)}>{children}</div>;
}

export function SimulatorLabel({
    className,
    children,
    ...rest
}: Readonly<LabelHTMLAttributes<HTMLLabelElement>>) {
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
}: Readonly<React.HTMLAttributes<HTMLDivElement>>) {
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
}: Readonly<React.HTMLAttributes<HTMLDivElement>>) {
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
}: Readonly<React.HTMLAttributes<HTMLDivElement>>) {
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
}: Readonly<React.HTMLAttributes<HTMLDivElement> & { tone?: 'warning' | 'danger' | 'info' }>) {
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
}: Readonly<React.HTMLAttributes<HTMLUListElement>>) {
    return (
        <ul className={joinClasses(SIM_LIST, className)} {...rest}>
            {children}
        </ul>
    );
}

export interface SimulatorListItemProps extends Omit<React.LiHTMLAttributes<HTMLLIElement>, 'onClick'> {
    action?: boolean;
    active?: boolean;
    onClick?: MouseEventHandler<HTMLButtonElement>;
}

export function SimulatorListItem({
    action,
    active,
    className,
    children,
    onClick,
    ...rest
}: Readonly<SimulatorListItemProps>) {
    const itemClassName = joinClasses(
        SIM_LIST_ITEM,
        action && SIM_LIST_ITEM_ACTION,
        active && SIM_LIST_ITEM_ACTIVE,
        className,
    );

    if (onClick != null) {
        return (
            <li className={itemClassName} {...rest}>
                <button type="button" className={SIM_LIST_ITEM_BUTTON} onClick={onClick}>
                    {children}
                </button>
            </li>
        );
    }

    return (
        <li className={itemClassName} {...rest}>
            {children}
        </li>
    );
}

export interface SimulatorDialogProps {
    open: boolean;
    onClose?: () => void;
    className?: string;
    children: ReactNode;
    'aria-label'?: string;
}

export function SimulatorDialog({
    open,
    onClose,
    className,
    children,
    'aria-label': ariaLabel,
}: Readonly<SimulatorDialogProps>) {
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

export { SIM_ALERT, SIM_BTN, SIM_CARD, SIM_INPUT } from './simulatorClasses.js';
