// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { emptySimulatorStore, MAX_BACKUP_BYTES } from '@signalsafe/simulator-core/apps/contracts';
import DeviceBackup from '../src/apps/settings/DeviceBackup.js';
import { SimulatorAppsProvider } from '../src/apps/shared/SimulatorAppsHost.js';
import { downloadJsonFile } from '../src/utils/browser/browserEnvironment.js';
import { createTestStore } from './support/deviceStore.js';

vi.mock('../src/utils/browser/browserEnvironment.js', async (original) => ({
    ...(await original<typeof import('../src/utils/browser/browserEnvironment.js')>()),
    downloadJsonFile: vi.fn(),
}));
afterEach(() => vi.restoreAllMocks());
const lock = { salt: 'a'.repeat(32), digest: 'b'.repeat(64) };
function deferred<T>() {
    let resolve: (value: T) => void = () => {
        throw new Error('Uninitialized promise');
    };
    const promise = new Promise<T>((done) => {
        resolve = done;
    });
    return { promise, resolve };
}
function select(text: Promise<string>, size?: number) {
    const file = new File(['backup'], 'simulator.json', { type: 'application/json' });
    const read = vi.fn(() => text);
    Object.defineProperty(file, 'text', { value: read });
    if (size !== undefined) Object.defineProperty(file, 'size', { value: size });
    fireEvent.change(screen.getByLabelText('Preview simulator restore'), {
        target: { files: [file] },
    });
    return read;
}
function setup(store = createTestStore(), confirm = vi.fn(() => true)) {
    const view = render(
        <SimulatorAppsProvider value={{ confirm }}>
            <DeviceBackup store={store} />
        </SimulatorAppsProvider>,
    );
    return { ...view, store, confirm };
}

it('keeps the newest selection when an older read completes last', async () => {
    const { store } = setup();
    const pending = deferred<string>();
    select(pending.promise);
    select(
        Promise.resolve(JSON.stringify({ ...emptySimulatorStore(), identity: 'new@example.test' })),
    );
    await screen.findByRole('button', { name: 'Restore simulator data' });
    await act(async () => pending.resolve('invalid JSON'));
    expect(screen.queryByText('Invalid or oversized simulator backup.')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Restore simulator data' }));
    await waitFor(() => expect(store.state().identity).toBe('new@example.test'));
});

it('cancels pending reads and ignores their completion after unmount', async () => {
    const pending = deferred<string>();
    const { unmount } = setup();
    select(pending.promise);
    expect(
        screen.getByRole('button', { name: 'Reset simulated records' }).matches(':disabled'),
    ).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel backup preview' }));
    await act(async () => pending.resolve(JSON.stringify(emptySimulatorStore())));
    expect(screen.queryByRole('button', { name: 'Restore simulator data' })).toBeNull();
    const late = deferred<string>();
    select(late.promise);
    unmount();
    await act(async () => late.resolve(JSON.stringify(emptySimulatorStore())));
    expect(screen.queryByRole('button', { name: 'Restore simulator data' })).toBeNull();
});

it('rejects oversized files without reading them and validates their contents', async () => {
    setup();
    const read = select(Promise.resolve('ignored'), MAX_BACKUP_BYTES + 1);
    expect(read).not.toHaveBeenCalled();
    expect(screen.getByText('Invalid or oversized simulator backup.')).toBeTruthy();
    select(Promise.resolve('{"version":1}'));
    await screen.findByText('Invalid or oversized simulator backup.');
    expect(screen.queryByRole('button', { name: 'Restore simulator data' })).toBeNull();
});

it('asks before restore and reset and retains the current screen password', async () => {
    const store = createTestStore(() => {}, { ...emptySimulatorStore(), lock });
    const confirm = vi.fn(() => false);
    setup(store, confirm);
    select(
        Promise.resolve(
            JSON.stringify({ ...emptySimulatorStore(), identity: 'restored@example.test' }),
        ),
    );
    const restore = await screen.findByRole('button', { name: 'Restore simulator data' });
    fireEvent.click(restore);
    await waitFor(() => expect(restore.matches(':disabled')).toBe(false));
    expect(store.state().identity).toBe(emptySimulatorStore().identity);
    confirm.mockReturnValue(true);
    fireEvent.click(restore);
    await waitFor(() => expect(store.state().identity).toBe('restored@example.test'));
    expect(store.state().lock).toEqual(lock);
    fireEvent.click(screen.getByRole('button', { name: 'Reset simulated records' }));
    await screen.findByText('Simulated records reset.');
    expect(store.state().identity).toBe(emptySimulatorStore().identity);
    expect(store.state().lock).toEqual(lock);
    expect(confirm).toHaveBeenCalledTimes(3);
});

it('exports full records while excluding screen passwords and blocks duplicate exports', async () => {
    const data = { ...emptySimulatorStore(), lock, identity: 'owner@example.test' };
    const store = createTestStore(() => {}, data);
    const pending = deferred<typeof data>();
    const exportBackup = vi.spyOn(store, 'exportBackup').mockReturnValue(pending.promise);
    setup(store);
    const button = screen.getByRole('button', { name: 'Download simulator backup' });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(exportBackup).toHaveBeenCalledOnce();
    await act(async () => pending.resolve(data));
    expect(downloadJsonFile).toHaveBeenCalledWith(
        JSON.stringify({ ...data, lock: null }),
        'simulator-backup.json',
    );
});

it('does not download an export that finishes after leaving the settings page', async () => {
    vi.mocked(downloadJsonFile).mockClear();
    const store = createTestStore();
    const pending = deferred<ReturnType<typeof emptySimulatorStore>>();
    vi.spyOn(store, 'exportBackup').mockReturnValue(pending.promise);
    const { unmount } = setup(store);
    fireEvent.click(screen.getByRole('button', { name: 'Download simulator backup' }));
    unmount();
    await act(async () => pending.resolve(emptySimulatorStore()));
    expect(downloadJsonFile).not.toHaveBeenCalled();
});

it('validates email identity and retains a failed restore preview for retry', async () => {
    const { store } = setup();
    const save = vi.spyOn(store, 'save');
    fireEvent.change(screen.getByLabelText('Simulated email address'), {
        target: { value: 'bad' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save email identity' }));
    await screen.findByText('Enter a valid email address.');
    expect(save).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Simulated email address'), {
        target: { value: 'good@example.test' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save email identity' }));
    await screen.findByText('Email identity saved.');
    expect(store.state().identity).toBe('good@example.test');
    select(Promise.resolve(JSON.stringify(emptySimulatorStore())));
    const restore = vi.spyOn(store, 'restore').mockRejectedValueOnce(new Error('Unavailable'));
    fireEvent.click(await screen.findByRole('button', { name: 'Restore simulator data' }));
    await screen.findByText(
        'The simulator data operation failed. Your changes have not been confirmed. Try again.',
    );
    expect(restore).toHaveBeenCalledOnce();
    expect(
        screen.getByRole('button', { name: 'Restore simulator data' }).matches(':disabled'),
    ).toBe(false);
});

it('disables every control and shows the default identity while store data is unavailable', () => {
    setup({ ...createTestStore(), data: null });
    expect((screen.getByLabelText('Simulated email address') as HTMLInputElement).value).toBe(
        emptySimulatorStore().identity,
    );
    expect(screen.getByRole('button', { name: 'Save email identity' }).matches(':disabled')).toBe(
        true,
    );
});

it('ignores a click that races a busy or unavailable store', () => {
    const store = createTestStore();
    const exportBackup = vi.spyOn(store, 'exportBackup');
    setup(store);
    const button = screen.getByRole('button', { name: 'Download simulator backup' });
    Object.defineProperty(store, 'busy', { value: true });
    fireEvent.click(button);
    Object.defineProperty(store, 'busy', { value: false });
    Object.defineProperty(store, 'data', { value: null });
    fireEvent.click(button);
    expect(exportBackup).not.toHaveBeenCalled();
});

it('settles quietly when an operation rejects after unmount', async () => {
    vi.mocked(downloadJsonFile).mockClear();
    const store = createTestStore();
    let fail: (reason: Error) => void = () => {};
    vi.spyOn(store, 'exportBackup').mockReturnValue(
        new Promise((_, reject) => {
            fail = reject;
        }),
    );
    const { unmount } = setup(store);
    fireEvent.click(screen.getByRole('button', { name: 'Download simulator backup' }));
    unmount();
    await act(async () => fail(new Error('Unavailable')));
    expect(downloadJsonFile).not.toHaveBeenCalled();
});

it('does not report an identity save that the store declines', async () => {
    const { store } = setup();
    const save = vi.spyOn(store, 'save').mockResolvedValue(false);
    fireEvent.click(screen.getByRole('button', { name: 'Save email identity' }));
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    await waitFor(() =>
        expect(
            screen.getByRole('button', { name: 'Save email identity' }).matches(':disabled'),
        ).toBe(false),
    );
    expect(screen.queryByText('Email identity saved.')).toBeNull();
});

it('treats an empty file selection as clearing the preview', () => {
    setup();
    fireEvent.change(screen.getByLabelText('Preview simulator restore'), {
        target: { files: [] },
    });
    expect(screen.queryByText('Reading simulator backup…')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Restore simulator data' })).toBeNull();
});

it('ignores read failures from a superseded selection', async () => {
    setup();
    let fail: (reason: Error) => void = () => {};
    select(
        new Promise<string>((_, reject) => {
            fail = reject;
        }),
    );
    select(Promise.resolve(JSON.stringify(emptySimulatorStore())));
    await screen.findByRole('button', { name: 'Restore simulator data' });
    await act(async () => fail(new Error('read failed')));
    expect(screen.queryByText('Invalid or oversized simulator backup.')).toBeNull();
});

it('keeps records when the learner declines the reset confirmation', async () => {
    const data = { ...emptySimulatorStore(), identity: 'keep@example.test' };
    const store = createTestStore(() => {}, data);
    const restore = vi.spyOn(store, 'restore');
    const confirm = vi.fn(() => false);
    setup(store, confirm);
    fireEvent.click(screen.getByRole('button', { name: 'Reset simulated records' }));
    await waitFor(() => expect(confirm).toHaveBeenCalledOnce());
    await waitFor(() =>
        expect(
            screen.getByRole('button', { name: 'Reset simulated records' }).matches(':disabled'),
        ).toBe(false),
    );
    expect(restore).not.toHaveBeenCalled();
    expect(screen.queryByText('Simulated records reset.')).toBeNull();
});
