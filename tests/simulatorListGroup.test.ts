import { createElement } from 'react';
import { act, create } from 'react-test-renderer';
import { expect, it } from 'vitest';
import { SimulatorListGroup, SimulatorListLoadingContext } from '../src/components/SimulatorListGroup';

it('shows loading instead of an empty state, then publishes the empty message', () => {
    let view: ReturnType<typeof create>;
    act(() => { view = create(createElement(SimulatorListLoadingContext.Provider, { value: true }, createElement(SimulatorListGroup, { search: createElement('input'), empty: true, emptyMessage: 'No calls.' }))); });
    expect(view!.root.findAllByType('output')).toHaveLength(1);
    expect(view!.root.findAllByProps({ className: 'simulator-list-group__empty' })).toHaveLength(0);
    act(() => { view!.update(createElement(SimulatorListGroup, { search: createElement('input'), empty: true, emptyMessage: 'No calls.' })); });
    expect(view!.root.findByProps({ className: 'simulator-list-group__empty' }).children).toEqual(['No calls.']);
});
