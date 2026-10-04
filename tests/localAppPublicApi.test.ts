import React from 'react';
import { act, create } from 'react-test-renderer';
import { expect, it, vi } from 'vitest';
import PhoneHistoryDetail from '../src/views/phone/PhoneHistoryDetail.js';
import {
    SimulatorAppsProvider,
    useSimulatorAppsHost,
} from '../src/apps/shared/SimulatorAppsHost.js';
import SimulatorPhotoLocation from '../src/apps/photos/PhotoLocation.js';

it('renders call media and labeled numbers inside the body without optional metadata', () => {
    const view = create(
        React.createElement(PhoneHistoryDetail, {
            caller: 'Synthetic contact',
            number: '+12025550100',
            numberLabel: 'Mobile',
            timestamp: 'Today',
            photo: React.createElement('img', {
                alt: 'Contact',
                src: 'data:image/png;base64,AA==',
            }),
        }),
    );
    const body = view.root.findByProps({ className: 'simulator-history-detail__body' });
    expect(body.findByType('img').props.alt).toBe('Contact');
    expect(
        body.findByProps({ className: 'simulator-history-detail__number' }).findByType('span')
            .children,
    ).toEqual(['Mobile', ' · ']);
    expect(
        view.root.findAllByProps({ className: 'simulator-history-detail__metadata' }),
    ).toHaveLength(0);
    view.unmount();
});
it('inherits host adapters through nested providers and supplies an editable default notes field', () => {
    const changed = vi.fn();
    function Probe() {
        const { Shell, NotesEditor, formatDate, formatCaptureDate } = useSimulatorAppsHost();
        return React.createElement(Shell, {
            nav: 'Navigation',
            children: React.createElement(
                'section',
                null,
                formatDate(new Date(0)),
                formatCaptureDate({
                    capturedAt: '',
                    timeZone: '',
                    latitude: null,
                    longitude: null,
                }),
                React.createElement(NotesEditor, {
                    label: 'Notes',
                    placeholder: 'Write notes',
                    markdown: 'Draft',
                    readOnly: false,
                    onChange: changed,
                }),
            ),
        });
    }
    const view = create(
        React.createElement(SimulatorAppsProvider, {
            value: { formatDate: () => 'Host date' },
            children: React.createElement(SimulatorAppsProvider, {
                value: {},
                children: React.createElement(Probe),
            }),
        }),
    );
    expect(JSON.stringify(view.toJSON())).toContain('Host date');
    expect(JSON.stringify(view.toJSON())).toContain('Unknown capture date');
    act(() => view.root.findByType('textarea').props.onChange({ target: { value: 'Edited' } }));
    expect(changed).toHaveBeenCalledWith('Edited');
    view.unmount();
});
it('renders zero coordinates and delegates maps only when a host supplies one', () => {
    const map = vi.fn((latitude: number, longitude: number) =>
        React.createElement('p', null, `${latitude},${longitude}`),
    );
    const view = create(
        React.createElement(SimulatorAppsProvider, {
            value: { renderPhotoMap: map },
            children: React.createElement(SimulatorPhotoLocation, { latitude: 0, longitude: 0 }),
        }),
    );
    expect(map).toHaveBeenCalledWith(0, 0);
    view.update(React.createElement(SimulatorPhotoLocation, { latitude: null, longitude: null }));
    expect(JSON.stringify(view.toJSON())).toContain('No location recorded');
    view.unmount();
});
