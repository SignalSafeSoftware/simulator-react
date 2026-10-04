import { usePhoneNumberFormatter } from '../../contract/phonePresentation.js';

export function PhoneNumberText({ value }: { value: string }): string {
    return usePhoneNumberFormatter()(value);
}
