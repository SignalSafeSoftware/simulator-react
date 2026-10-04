import { createContext, useContext } from 'react';

export interface EmailComposeDraft {
    to: string;
    bcc: string;
    subject: string;
    body: string;
}

export interface EmailComposeOptions {
    draft?: EmailComposeDraft;
    onDraftChange?: (draft: EmailComposeDraft) => void;
    /** Resolves only after the host accepts the send; rejection keeps the draft. */
    onSend?: (draft: EmailComposeDraft) => void | Promise<void>;
}

export const EmailComposeContext = createContext<EmailComposeOptions | undefined>(undefined);
export const useEmailComposeOptions = () => useContext(EmailComposeContext);
