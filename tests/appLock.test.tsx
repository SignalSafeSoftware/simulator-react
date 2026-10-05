// @vitest-environment jsdom
import { emptySimulatorStore } from '@signalsafe/simulator-core/apps/contracts';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, type Mock } from 'vitest';
import { LockScreen, LockSettings } from '../src/apps/lock/LockScreen';
import { DevicePage } from '../src/apps/shared/DevicePage';
import { SimulatorAppsProvider } from '../src/apps/shared/SimulatorAppsHost';
import { StoreHarness, flush } from './support/appHarness';

const lock = { salt: 'a'.repeat(32), digest: 'b'.repeat(64) };
const locked = () => ({ ...emptySimulatorStore(), lock });

const deferred = <T,>() => {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
};

const type = (label: string, value: string) =>
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
const submitForm = (button: string) => fireEvent.submit(screen.getByText(button).closest('form')!);

describe('DevicePage', () => {
    it('renders bare content without a back handler', () => {
        render(
            <DevicePage title='Plain' listLayout>
                <p>content</p>
            </DevicePage>,
        );
        expect(screen.getByText('Plain').tagName).toBe('H2');
        expect(screen.queryByRole('navigation')).toBeNull();
    });

    it('wraps content in the shell with default back navigation', () => {
        const onBack = vi.fn();
        render(
            <DevicePage title='Mail' icon='M' onBack={onBack}>
                <p>content</p>
            </DevicePage>,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Mail' }));
        fireEvent.click(screen.getByRole('button', { name: 'Back' }));
        expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('uses a custom default icon and navigation when provided', () => {
        render(
            <DevicePage title='Mail' onBack={() => {}} navigation={<nav>custom nav</nav>}>
                <p>content</p>
            </DevicePage>,
        );
        expect(screen.getByText('custom nav')).toBeInstanceOf(HTMLElement);
        expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
    });
});

describe('LockScreen', () => {
    const renderScreen = (
        checkLock: (password: string, lock: unknown) => Promise<boolean>,
        onUnlock = vi.fn(),
        ready = true,
    ) => {
        render(
            <SimulatorAppsProvider value={{ checkLock }}>
                <StoreHarness
                    initial={locked()}
                    prepare={(store) => {
                        if (!ready) Object.defineProperty(store, 'data', { value: null });
                    }}
                >
                    {(store) => <LockScreen store={store} onUnlock={onUnlock} />}
                </StoreHarness>
            </SimulatorAppsProvider>,
        );
        return onUnlock;
    };

    it('unlocks with the correct password and clears the field', async () => {
        const checkLock = vi.fn(async () => true);
        const onUnlock = renderScreen(checkLock);
        type('Screen password', 'right');
        submitForm('Unlock');
        await act(flush);
        expect(checkLock).toHaveBeenCalledWith('right', lock);
        expect(onUnlock).toHaveBeenCalledTimes(1);
        expect((screen.getByLabelText('Screen password') as HTMLInputElement).value).toBe('');
    });

    it('reports incorrect passwords and unavailable verification', async () => {
        const checkLock = vi.fn(async () => false);
        const onUnlock = renderScreen(checkLock);
        submitForm('Unlock');
        await act(flush);
        expect(screen.getByRole('alert').textContent).toBe('Incorrect screen password.');
        checkLock.mockRejectedValueOnce(new Error('boom'));
        submitForm('Unlock');
        await act(flush);
        expect(screen.getByRole('alert').textContent).toBe('Unlock is unavailable. Try again.');
        expect(onUnlock).not.toHaveBeenCalled();
    });

    it('ignores submissions while busy or before data is available', async () => {
        const pending = deferred<boolean>();
        const checkLock = vi.fn(() => pending.promise);
        renderScreen(checkLock);
        submitForm('Unlock');
        submitForm('Unlock');
        expect(checkLock).toHaveBeenCalledTimes(1);
        await act(async () => pending.resolve(true));
    });

    it('does nothing without loaded data', async () => {
        const checkLock = vi.fn(async () => true);
        renderScreen(checkLock, vi.fn(), false);
        submitForm('Unlock');
        await act(flush);
        expect(checkLock).not.toHaveBeenCalled();
    });
});

describe('LockSettings', () => {
    const setup = ({
        initial = emptySimulatorStore(),
        checkLock = vi.fn(async () => true),
        createLock = vi.fn(async () => lock),
        onLock = vi.fn(),
        prepare,
    }: {
        initial?: ReturnType<typeof emptySimulatorStore>;
        checkLock?: Mock<(...args: never[]) => Promise<boolean>>;
        createLock?: Mock<(...args: never[]) => Promise<typeof lock>>;
        onLock?: () => void;
        prepare?: Parameters<typeof StoreHarness>[0]['prepare'];
    } = {}) => {
        let current!: Parameters<Parameters<typeof StoreHarness>[0]['children']>[0];
        const view = render(
            <SimulatorAppsProvider value={{ checkLock, createLock } as never}>
                <StoreHarness initial={initial} prepare={prepare}>
                    {(store) => {
                        current = store;
                        return <LockSettings store={store} onLock={onLock} />;
                    }}
                </StoreHarness>
            </SimulatorAppsProvider>,
        );
        return { ...view, store: () => current, checkLock, createLock, onLock };
    };
    const fillNew = (password = 'secret', confirm = password) => {
        type('New password', password);
        type('Confirm password', confirm);
    };

    it('sets a first password without asking for the current one', async () => {
        const { store, createLock } = setup();
        expect(screen.queryByLabelText('Current password')).toBeNull();
        fillNew();
        submitForm('Save screen password');
        await act(flush);
        expect(createLock).toHaveBeenCalledWith('secret');
        expect(store().state().lock).toEqual(lock);
        expect(screen.getByText('Screen password saved.')).toBeInstanceOf(HTMLElement);
        expect((screen.getByLabelText('New password') as HTMLInputElement).value).toBe('');
    });

    it('requires the current password, matching new passwords and clears on cancel', async () => {
        const { checkLock } = setup({ initial: locked() });
        checkLock.mockResolvedValueOnce(false);
        type('Current password', 'wrong');
        fillNew();
        submitForm('Save screen password');
        await act(flush);
        expect(screen.getByText('Incorrect current screen password.')).toBeInstanceOf(HTMLElement);

        fillNew('secret', 'different');
        submitForm('Save screen password');
        await act(flush);
        expect(screen.getByText('The new passwords do not match.')).toBeInstanceOf(HTMLElement);

        fireEvent.click(screen.getByText('Cancel'));
        expect((screen.getByLabelText('New password') as HTMLInputElement).value).toBe('');
        expect(screen.queryByText('The new passwords do not match.')).toBeNull();
    });

    it('removes the password and can lock immediately', async () => {
        const { store, onLock } = setup({ initial: locked() });
        fireEvent.click(screen.getByText('Remove password'));
        await act(flush);
        expect(store().state().lock).toBeNull();
        expect(screen.getByText('Screen password removed.')).toBeInstanceOf(HTMLElement);
        expect(screen.queryByText('Lock now')).toBeNull();
        expect(onLock).not.toHaveBeenCalled();
    });

    it('offers locking while a password exists', () => {
        const { onLock } = setup({ initial: locked() });
        fireEvent.click(screen.getByText('Lock now'));
        expect(onLock).toHaveBeenCalledTimes(1);
    });

    it('stays silent when the store rejects the change', async () => {
        setup({
            prepare: (store) => {
                store.save = async () => false;
            },
        });
        fillNew();
        submitForm('Save screen password');
        await act(flush);
        expect(screen.queryByText('Screen password saved.')).toBeNull();
        expect((screen.getByLabelText('New password') as HTMLInputElement).value).toBe('secret');
    });

    it('reports unexpected failures, with a fallback for non-errors', async () => {
        const createLock = vi.fn(async () => {
            throw new Error('Too short');
        });
        setup({ createLock });
        fillNew();
        submitForm('Save screen password');
        await act(flush);
        expect(screen.getByText('Too short')).toBeInstanceOf(HTMLElement);
        createLock.mockImplementationOnce(() => Promise.reject('nope'));
        submitForm('Save screen password');
        await act(flush);
        expect(screen.getByText('Password could not be changed.')).toBeInstanceOf(HTMLElement);
    });

    it('ignores changes while busy or without data', async () => {
        const gate = deferred<boolean>();
        const checkLock = vi.fn(() => gate.promise);
        const { store } = setup({ checkLock });
        fillNew();
        submitForm('Save screen password');
        expect(screen.getByText('Saving screen password…')).toBeInstanceOf(HTMLElement);
        fireEvent.submit(screen.getByText('Save screen password').closest('form')!);
        expect(checkLock).toHaveBeenCalledTimes(1);
        await act(async () => gate.resolve(true));
        expect(store().state().lock).toEqual(lock);
    });

    it('does not apply changes when the store is busy or has no data', async () => {
        const checkLock = vi.fn(async () => true);
        setup({
            checkLock,
            prepare: (store) => {
                store.busy = true;
            },
        });
        fillNew();
        submitForm('Save screen password');
        await act(flush);
        expect(checkLock).not.toHaveBeenCalled();
    });

    it('does nothing without loaded data', async () => {
        const checkLock = vi.fn(async () => true);
        setup({
            checkLock,
            prepare: (store) => {
                Object.defineProperty(store, 'data', { value: null });
            },
        });
        fillNew();
        submitForm('Save screen password');
        await act(flush);
        expect(checkLock).not.toHaveBeenCalled();
    });

    describe('when unmounted mid-request', () => {
        it('discards a result after verification fails', async () => {
            const gate = deferred<boolean>();
            const { unmount, store } = setup({ checkLock: vi.fn(() => gate.promise) });
            fillNew();
            submitForm('Save screen password');
            unmount();
            await act(async () => gate.reject(new Error('late')));
            expect(store().state().lock).toBeNull();
        });

        it('discards a result after the lock is created', async () => {
            const gate = deferred<typeof lock>();
            const { unmount, store } = setup({ createLock: vi.fn(() => gate.promise) });
            fillNew();
            submitForm('Save screen password');
            await act(flush);
            unmount();
            await act(async () => gate.resolve(lock));
            expect(store().state().lock).toBeNull();
        });

        it('discards a result after the store saves', async () => {
            const gate = deferred<boolean>();
            const { unmount, store } = setup({
                prepare: (created) => {
                    created.save = () => gate.promise;
                },
            });
            fillNew();
            submitForm('Save screen password');
            await act(flush);
            unmount();
            await act(async () => gate.resolve(true));
            expect(store().state().lock).toBeNull();
        });
    });
});
