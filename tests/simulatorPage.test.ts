import { createElement, useState } from 'react';
import { act, create } from 'react-test-renderer';
import { expect, it } from 'vitest';
import { SimulatorPage } from '../src/components/SimulatorPage';
import { SimulatorLocaleProvider } from '../src/i18n/SimulatorLocale';

it('keeps page slots ordered and preserves content state when headers change', () => {
    function Counter() {
        const [count, setCount] = useState(0);
        return createElement('button', { onClick: () => setCount(value => value + 1) }, String(count));
    }
    const page = (title: string) => createElement(SimulatorLocaleProvider, {
        locale: 'en-GB',
        children: createElement(SimulatorPage, {
            as: 'section',
            header: createElement('header', null, title),
            footer: createElement('nav', null, 'Back'),
            children: createElement(Counter),
        }),
    });
    const view = create(page('First'));
    act(() => view.root.findByType('button').props.onClick());
    act(() => view.update(page('A much longer replacement heading')));
    expect(view.root.findByType('button').children).toEqual(['1']);
    const root = view.root.findByType('section');
    expect(root.props.lang).toBe('en-GB');
    expect(root.findAllByType('div')).toHaveLength(0);
    expect(root.findAllByType('header')).toHaveLength(1);
    expect(root.findAllByType('nav')).toHaveLength(1);
    act(() => view.unmount());
});
