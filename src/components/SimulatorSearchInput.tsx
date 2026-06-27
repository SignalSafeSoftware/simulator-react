/**
 * Search input for simulator list screens.
 */
import { SimulatorInput } from '../ui/primitives';
import { simInput } from '../simulatorStyles';
import { joinClasses } from '../ui/simulatorClasses';

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
    placeholder = 'Search',
    ariaLabel = 'Search',
    className = '',
    dataSimulatorSearch,
}: Readonly<SimulatorSearchInputProps>) {
    return (
        <SimulatorInput
            type="search"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    onSubmit?.(value);
                }
            }}
            placeholder={placeholder}
            aria-label={ariaLabel}
            className={joinClasses(simInput.control, className)}
            data-simulator-search={dataSimulatorSearch ? true : undefined}
        />
    );
}

export { SimulatorSearchInput };
export default SimulatorSearchInput;
