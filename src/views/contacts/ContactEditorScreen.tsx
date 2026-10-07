import type { ReactNode } from 'react';

/** Page frame for adding or editing a contact: title, host notices, then the form. */
export default function ContactEditorScreen({
    title,
    notices,
    children,
}: Readonly<{ title: string; notices?: ReactNode; children?: ReactNode }>) {
    return (
        <section className='simulator-app-page'>
            <div className='simulator-screen__header-row'>
                <h2>{title}</h2>
            </div>
            {notices}
            {children ? <div className='simulator-contact-editor-layout'>{children}</div> : null}
        </section>
    );
}
