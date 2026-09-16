import { createContext, useContext } from 'react';

/** Display-only formatting. Never use its result for dialing, matching or persistence. */
export type PhoneNumberFormatter = (original: string) => string;
export const PhoneNumberFormatContext = createContext<PhoneNumberFormatter>((original) => original);
export const usePhoneNumberFormatter = () => useContext(PhoneNumberFormatContext);

export function PhoneNumberText({ value }: { value: string }): string {
    return usePhoneNumberFormatter()(value);
}
