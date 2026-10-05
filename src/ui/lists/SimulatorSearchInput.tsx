/**
 * Search input for simulator list screens.
 */
import type { InputHTMLAttributes } from 'react';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { INPUT_TYPE_SEARCH } from '../../constants.js';
import { SimulatorInput } from '../primitives.js';
import { simInput } from '../../simulatorStyles.js';
import { joinClasses } from '../styles/simulatorClasses.js';

export interface SimulatorSearchInputProps extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'value' | 'onChange' | 'onSubmit' | 'type'
> {
    value: string;
    onChange: (value: string) => void;
    onSubmit?: (query: string) => void;
    ariaLabel?: string;
    /** Marks the field for simulator keyboard focus helpers. */
    dataSimulatorSearch?: boolean;
}

function SimulatorSearchInput({
    value,
    onChange,
    onSubmit,
    placeholder,
    ariaLabel,
    className = '',
    dataSimulatorSearch,
    ...rest
}: Readonly<SimulatorSearchInputProps>) {
    const locale = useSimulatorLocale();
    return (
        <SimulatorInput
            {...rest}
            type={INPUT_TYPE_SEARCH}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    onSubmit?.(value);
                }
            }}
            placeholder={placeholder ?? locale.t('list.search')}
            aria-label={ariaLabel ?? locale.t('list.search')}
            className={joinClasses(simInput.control, className)}
            data-simulator-search={dataSimulatorSearch ? true : undefined}
        />
    );
}

export { SimulatorSearchInput };
