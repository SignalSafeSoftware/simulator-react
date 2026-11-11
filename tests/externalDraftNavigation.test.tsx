// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import {
    emptySimulatorStore,
    photoSchema,
    secretSchema,
} from '@signalsafe/simulator-core/apps/contracts';
import Photos from '../src/apps/photos/Photos';
import Vault from '../src/apps/vault/Vault';
import { SimulatorAppsProvider } from '../src/apps/shared/SimulatorAppsHost';
import { StoreHarness, settle } from './support/appHarness';
afterEach(cleanup);
const stamp = '2026-11-11T00:00:00Z';
const meta = { capturedAt: '', timeZone: '', latitude: null, longitude: null };
const photo = photoSchema.parse({
    id: 'one',
    title: 'Example',
    caption: '',
    asset: { name: 'one.png', mime: 'image/png', data: 'data:image/png;base64,AAAA' },
    original: meta,
    metadata: meta,
    createdAt: stamp,
    updatedAt: stamp,
});
const secret = secretSchema.parse({
    id: 'one',
    title: 'Example',
    folder: 'Work',
    username: '',
    value: 'fictional',
    site: '',
    notes: '',
    createdAt: stamp,
    updatedAt: stamp,
});
it('rejects external photo navigation while unsaved edits are retained', async () => {
    const confirm = vi.fn(() => false),
        selected = vi.fn();
    const initial = { ...emptySimulatorStore(), photos: [photo] };
    const component = (revision: number) => (
        <SimulatorAppsProvider value={{ confirm }}>
            <StoreHarness initial={initial}>
                {(store) => (
                    <Photos
                        store={store}
                        onBack={() => {}}
                        navigation={{ revision, photo }}
                        onSelectedPhotoChange={selected}
                    />
                )}
            </StoreHarness>
        </SimulatorAppsProvider>
    );
    const view = render(component(1));
    await settle();
    fireEvent.click(screen.getByRole('button', { name: 'Edit photo' }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Unsaved' } });
    view.rerender(component(2));
    await settle();
    expect(confirm).toHaveBeenCalled();
    expect(screen.getByLabelText('Title')).toHaveProperty('value', 'Unsaved');
    expect(selected).toHaveBeenLastCalledWith('one');
});
it('rejects external vault navigation until drafts are discarded, and supports controlled draft ownership', async () => {
    const confirm = vi.fn(() => false),
        selected = vi.fn();
    const initial = { ...emptySimulatorStore(), secrets: [secret], vaultFolders: ['Work'] };
    const component = (revision: number, folder: string | null = 'Work') => (
        <SimulatorAppsProvider value={{ confirm }}>
            <StoreHarness initial={initial}>
                {(store) => (
                    <Vault
                        store={store}
                        onBack={() => {}}
                        navigation={{ revision, folder, secret }}
                        onSelectedSecretChange={selected}
                    />
                )}
            </StoreHarness>
        </SimulatorAppsProvider>
    );
    const view = render(component(1));
    await settle();
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Unsaved' } });
    view.rerender(component(2));
    await settle();
    expect(confirm).toHaveBeenCalled();
    expect(selected).toHaveBeenLastCalledWith('one');
    confirm.mockReturnValue(true);
    view.rerender(component(3, null));
    await settle();
    expect(screen.getByLabelText('Title')).toHaveProperty('value', 'Example');
    cleanup();
    render(
        <StoreHarness initial={initial}>
            {(store) => (
                <Vault
                    store={store}
                    secretDraft={secret}
                    onSecretDraftChange={() => {}}
                    onBack={() => {}}
                />
            )}
        </StoreHarness>,
    );
    await settle();
    expect(screen.getByLabelText('Title')).toHaveProperty('value', 'Example');
});
it('returns to root when a selected vault folder is removed externally and ignores missing folder requests', async () => {
    let current: import('./support/appHarness').HarnessStore | undefined;
    const initial = { ...emptySimulatorStore(), secrets: [secret], vaultFolders: ['Work'] };
    const selected = vi.fn();
    const component = (revision: number, folder: string | null) => (
        <StoreHarness initial={initial}>
            {(store) => {
                current = store;
                return (
                    <Vault
                        store={store}
                        onBack={() => {}}
                        navigation={{ revision, folder }}
                        onSelectedFolderChange={selected}
                    />
                );
            }}
        </StoreHarness>
    );
    const view = render(component(1, 'Work'));
    await settle();
    await import('@testing-library/react').then(({ act }) =>
        act(async () => {
            if (!current) throw new Error('Store missing');
            await current.folder('Work', 'Other', 'Unfiled');
        }),
    );
    await settle();
    expect(selected).toHaveBeenLastCalledWith(null);
    view.rerender(component(2, 'missing'));
    await settle();
    expect(screen.getByLabelText('Search folders')).toBeTruthy();
});
