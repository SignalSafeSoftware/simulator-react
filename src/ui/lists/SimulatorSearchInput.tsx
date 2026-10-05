/**
 * Search input for simulator list screens.
 */
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { INPUT_TYPE_SEARCH } from '../../constants.js';
import { SimulatorInput } from '../primitives.js';
import { simInput } from '../../simulatorStyles.js';
import { joinClasses } from '../styles/simulatorClasses.js';

export interface SimulatorSearchInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit?: (query: string) => void;
    placeholder?: string;
    ariaLabel?: string;
    className?: string;
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
}: Readonly<SimulatorSearchInputProps>) {
    const locale = useSimulatorLocale();
    return (
        <SimulatorInput
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
