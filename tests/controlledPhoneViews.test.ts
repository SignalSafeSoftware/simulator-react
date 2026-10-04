import { createElement } from 'react';
import { act, create } from 'react-test-renderer';
import { afterEach, expect, it, vi } from 'vitest';
import PhoneCallView from '../src/views/PhoneCallView.js';
import { formatPhoneCallDuration } from '../src/views/PhoneCallView.js';
import PhoneContactEditor from '../src/views/PhoneContactEditor.js';
import PhoneHistoryDetail from '../src/views/PhoneHistoryDetail.js';
import { PhoneHistoryPagination } from '../src/views/PhoneHistoryDetail.js';
import PhoneKeypad from '../src/views/PhoneKeypad.js';
afterEach(() => vi.useRealTimers());
it('delegates all call controls and cleans up its display clock', () => {
    vi.useFakeTimers();
    vi.setSystemTime(100000);
    const onAnswer = vi.fn(),
        onHangup = vi.fn(),
        onMute = vi.fn(),
        onDigit = vi.fn();
    const props = {
        callerName: 'Private caller',
        phase: 'ringing' as const,
        incoming: true,
        connectedAt: null,
        muted: false,
        digits: '',
        onAnswer,
        onHangup,
        onMute,
        onDigit,
    };
    let root: ReturnType<typeof create>;
    act(() => {
        root = create(createElement(PhoneCallView, props));
    });
    act(() => root.root.findByProps({ 'aria-label': 'Answer call' }).props.onClick());
    expect(onAnswer).toHaveBeenCalledOnce();
    act(() =>
        root.update(
            createElement(PhoneCallView, {
                ...props,
                phase: 'connected',
                connectedAt: 98000,
            }),
        ),
    );
    expect(root!.root.findByType('output').children.join('')).toBe('00:02');
    act(() => {
        vi.advanceTimersByTime(1000);
    });
    expect(root!.root.findByType('output').children.join('')).toBe('00:03');
    act(() => root.root.findByProps({ 'aria-label': 'Dial 5' }).props.onClick());
    expect(onDigit).toHaveBeenCalledWith('5');
    act(() => root.root.findByProps({ 'aria-label': 'Mute microphone' }).props.onClick());
    act(() => root.root.findByProps({ 'aria-label': 'End call' }).props.onClick());
    expect(onMute).toHaveBeenCalledOnce();
    expect(onHangup).toHaveBeenCalledOnce();
    act(() => root.unmount());
    expect(vi.getTimerCount()).toBe(0);
    expect(formatPhoneCallDuration(-2)).toBe('00:00');
    expect(formatPhoneCallDuration(3661)).toBe('61:01');
});
it('renders the same twelve keypad digits and explicit disabled state', () => {
    const root = create(createElement(PhoneKeypad, { onDigit: vi.fn(), disabled: true }));
    const buttons = root.root.findAllByType('button');
    expect(buttons).toHaveLength(12);
    expect(buttons.every((button) => button.props.disabled)).toBe(true);
    root.unmount();
});
it('keeps contact writes and history actions optional and host-owned', () => {
    const onSubmit = vi.fn(),
        onCancel = vi.fn();
    const root = create(
        createElement(PhoneContactEditor, {
            number: '',
            onNumberChange: vi.fn(),
            onSubmit,
            onCancel,
            saveDisabled: true,
        }),
    );
    expect(root.root.findByProps({ 'aria-label': 'Save contact' }).props.disabled).toBe(true);
    act(() => root.root.findByProps({ 'aria-label': 'Cancel' }).props.onClick());
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onSubmit).not.toHaveBeenCalled();
    root.unmount();
    const detail = create(
        createElement(PhoneHistoryDetail, {
            caller: 'Unknown',
            timestamp: 'Unknown date',
            description: 'Missed',
        }),
    );
    expect(detail.root.findAllByType('button')).toHaveLength(0);
    detail.unmount();
    const onLoadMore = vi.fn();
    const pagination = create(
        createElement(PhoneHistoryPagination, {
            hasMore: false,
            loading: false,
            onLoadMore,
        }),
    );
    expect(pagination.toJSON()).toBeNull();
    pagination.unmount();
});
it('supports host identity fields without duplicating the shared form or save controls', () => {
    const onSubmit = vi.fn(),
        onCancel = vi.fn();
    const props = {
        onSubmit,
        onCancel,
        identityContent: createElement(
            'label',
            {},
            'Company',
            createElement('input', { name: 'company' }),
        ),
        valueFields: createElement('input', { name: 'phoneNumbers' }),
        notice: createElement('output', {}, 'Review the current revision'),
    };
    const root = create(createElement(PhoneContactEditor, props));
    expect(root.root.findAllByType('form')).toHaveLength(1);
    expect(root.root.findAllByProps({ name: 'name' })).toHaveLength(0);
    expect(root.root.findByProps({ name: 'company' })).toBeDefined();
    expect(root.root.findByProps({ name: 'phoneNumbers' })).toBeDefined();
    expect(root.root.findByType('output').children).toEqual(['Review the current revision']);
    expect(root.root.findAllByProps({ 'aria-label': 'Save contact' })).toHaveLength(1);
    act(() => root.root.findByType('form').props.onSubmit({ preventDefault: vi.fn() }));
    expect(onSubmit).toHaveBeenCalledOnce();
    act(() => root.update(createElement(PhoneContactEditor, { ...props, saveDisabled: true })));
    expect(root.root.findByProps({ 'aria-label': 'Save contact' }).props.disabled).toBe(true);
    expect(root.root.findByProps({ 'aria-label': 'Cancel' }).props.disabled).toBe(false);
    act(() => root.root.findByProps({ 'aria-label': 'Cancel' }).props.onClick());
    expect(onCancel).toHaveBeenCalledOnce();
    act(() => root.update(createElement(PhoneContactEditor, { ...props, saving: true })));
    expect(root.root.findAllByType('button').every((button) => button.props.disabled)).toBe(true);
    root.unmount();
});
