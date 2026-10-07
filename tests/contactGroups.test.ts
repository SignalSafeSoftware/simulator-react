import { createElement } from 'react';
import { act, create } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';
import { ContactValuesEditor } from '../src/ui/contacts/ContactValuesEditor.js';
import { ContactPhotoControls } from '../src/ui/contacts/ContactPhotoControls.js';
import { CapabilityButton } from '../src/ui/controls/CapabilityButton.js';
import { SIM_ACTION_REASON } from '../src/ui/styles/semanticSimulatorClasses.js';
import { SIM_VISUALLY_HIDDEN } from '../src/ui/styles/simulatorClasses.js';
describe('controlled contact groups', () => {
    it('preserves stable IDs and metadata while editing and clears a removed preference', () => {
        const onChange = vi.fn();
        const view = create(
            createElement(ContactValuesEditor, {
                kind: 'phone',
                values: [
                    { id: 'one', label: 'Mobile', value: '+12025550123', number: '+12025550123' },
                ],
                preferredId: 'one',
                createId: () => 'two',
                onChange,
            }),
        );
        act(() =>
            view.root.findByType('textarea').props.onChange({ target: { value: '+12025550124' } }),
        );
        expect(onChange).toHaveBeenLastCalledWith(
            [{ id: 'one', label: 'Mobile', value: '+12025550124', number: null }],
            'one',
        );
        act(() =>
            view.root
                .findAllByType('button')
                .find((button) => button.props['aria-label'] === 'Remove phone 1')!
                .props.onClick(),
        );
        expect(onChange).toHaveBeenLastCalledWith([], null);
    });
    it('shows selected image and delegates photo actions without persistence', () => {
        const remove = vi.fn();
        const view = create(
            createElement(ContactPhotoControls, {
                selectedImageUrl: 'blob:preview',
                onSelect: vi.fn(),
                onRemove: remove,
                onRestore: vi.fn(),
                capability: { state: 'enabled' },
            }),
        );
        expect(view.root.findByType('img').props.src).toBe('blob:preview');
        const group = view.root.findByType('fieldset');
        expect(group.props['aria-label']).toBe('Contact image');
        expect(group.findAllByType('button').map((button) => button.props['aria-label'])).toEqual([
            'Change image',
            'Remove image',
            'Restore original image',
        ]);
        act(() =>
            view.root
                .findAllByType('button')
                .find((button) => button.props['aria-label'] === 'Remove image')!
                .props.onClick(),
        );
        expect(remove).toHaveBeenCalledOnce();
    });
    it.each(['unsupported', 'unavailable'] as const)(
        'exposes a visible %s reason associated with its control',
        (state) => {
            const view = create(
                createElement(CapabilityButton, {
                    capability: { state, reason: 'Waiting for permission' },
                    children: 'Save',
                }),
            );
            const button = view.root.findByType('button');
            expect(button.props.disabled).toBe(true);
            expect(button.props['aria-describedby']).toBe(view.root.findByType('small').props.id);
            expect(view.root.findByType('small').children).toEqual(['Waiting for permission']);
            expect(view.root.findByType('small').props.className).toBe(SIM_ACTION_REASON);
        },
    );
    it.each(['unsupported', 'unavailable'] as const)(
        'keeps a hidden %s reason accessible without exposing presentation props on the button',
        (state) => {
            const view = create(
                createElement(CapabilityButton, {
                    capability: { state, reason: 'A country code is required.' },
                    showReason: false,
                    'aria-describedby': 'contact-help',
                    children: 'Call',
                }),
            );
            const button = view.root.findByType('button');
            const reason = view.root.findByType('small');
            expect(button.props.disabled).toBe(true);
            expect(reason.props.className).toBe(SIM_VISUALLY_HIDDEN);
            expect(reason.children).toEqual(['A country code is required.']);
            expect(button.props['aria-describedby']).toBe(`contact-help ${reason.props.id}`);
            expect(button.props.showReason).toBeUndefined();
            act(() =>
                view.update(
                    createElement(CapabilityButton, {
                        capability: { state: 'enabled' },
                        disabled: true,
                        showReason: false,
                        'aria-describedby': 'contact-help',
                        children: 'Call',
                    }),
                ),
            );
            expect(view.root.findAllByType('small')).toHaveLength(0);
            expect(button.props.disabled).toBe(true);
            expect(button.props['aria-describedby']).toBe('contact-help');
            expect(button.props.showReason).toBeUndefined();
            view.unmount();
        },
    );
});
it('keeps the underlying photo picker unavailable and rejects a late selection after disabling', () => {
    const onSelect = vi.fn();
    const view = create(
        createElement(ContactPhotoControls, {
            onSelect,
            onRemove: vi.fn(),
            onRestore: vi.fn(),
            capability: { state: 'unavailable', reason: 'A save is pending.' },
        }),
    );
    const picker = view.root.findByType('input');
    expect(picker.props.hidden).toBe(true);
    expect(picker.props.disabled).toBe(true);
    picker.props.onChange({
        target: { files: [{ name: 'late-selection.png' }], value: 'late-selection.png' },
    });
    expect(onSelect).not.toHaveBeenCalled();
});
