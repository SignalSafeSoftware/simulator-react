import { createContext, useContext } from 'react';

export interface MessageComposeDraft { phoneNumber: string; messageBody: string; }
export interface MessageComposeOptions {
    draft: MessageComposeDraft;
    onChange: (draft: MessageComposeDraft) => void;
    onSend?: (draft: MessageComposeDraft) => void | Promise<void>;
    onAccepted?: () => void;
}
export const MessageComposeContext = createContext<MessageComposeOptions | undefined>(undefined);
export const useMessageComposeOptions = () => useContext(MessageComposeContext);
