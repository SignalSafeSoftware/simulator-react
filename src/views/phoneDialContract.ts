import { createContext, useContext } from 'react';
/** Navigation and calling remain owned by the simulator host; this controls entry only. */
export interface PhoneDialDraft { value: string; onChange: (value: string) => void; }
export const PhoneDialDraftContext = createContext<PhoneDialDraft | undefined>(undefined);
export const usePhoneDialDraft = () => useContext(PhoneDialDraftContext);
