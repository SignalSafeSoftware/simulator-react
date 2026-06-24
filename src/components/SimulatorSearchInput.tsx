/**
 * Shared search input for simulator screens. Wireframe: rectangular bar, consistent with app chrome.
 */
import type { ChangeEvent, KeyboardEvent } from 'react';
import { Form } from 'react-bootstrap';
import { simInput } from '../simulatorStyles';

export interface SimulatorSearchInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit?: (value: string) => void;
    placeholder?: string;
    ariaLabel: string;
    className?: string;
    dataSimulatorSearch?: boolean;
}

export function SimulatorSearchInput({
    value,
    onChange,
    onSubmit,
    placeholder = 'Search',
    ariaLabel,
    className = '',
    dataSimulatorSearch = false,
}: Readonly<SimulatorSearchInputProps>) {
    return (
        <Form.Control
            type="search"
            placeholder={placeholder}
            value={value}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    onSubmit?.(value);
                }
            }}
            className={`${simInput.control} ${className}`.trim()}
            aria-label={ariaLabel}
            {...(dataSimulatorSearch ? { 'data-simulator-search': '' } : {})}
        />
    );
}
