// @vitest-environment jsdom
import {
    emptySimulatorStore,
    type Secret,
    type SimulatorStore,
} from '@signalsafe/simulator-core/apps/contracts';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    SimulatorAppsProvider,
    type SimulatorAppNotesProps,
} from '../src/apps/shared/SimulatorAppsHost';
import Vault from '../src/apps/vault/Vault';
import { StoreHarness, flush, type HarnessStore } from './support/appHarness';

const stamp = '2024-01-02T03:04:05.000Z';

const secret = (id: string, overrides: Partial<Secret> = {}): Secret => ({
    id,
    title: `Secret ${id}`,
    type: 'secret',
    folder: 'Work',
    username: '',
    value: 'hunter2',
    site: '',
    notes: '',
    createdAt: stamp,
    updatedAt: stamp,
    ...overrides,
});

interface Options {
    secrets?: Secret[];
    folders?: string[];
    onBack?: () => void;
    prepare?: (store: HarnessStore) => void;
    host?: Record<string, unknown>;
}

function setup({
    secrets = [],
    folders = ['Unfiled', 'Work'],
    onBack = vi.fn(),
    prepare,
    host = {},
}: Options = {}) {
    let current!: HarnessStore;
    const initial: SimulatorStore = { ...emptySimulatorStore(), secrets, vaultFolders: folders };
    const view = render(
        <SimulatorAppsProvider value={host as never}>
            <StoreHarness initial={initial} prepare={prepare}>
                {(store) => {
                    current = store;
                    return <Vault store={store} onBack={onBack} />;
                }}
            </StoreHarness>
        </SimulatorAppsProvider>,
    );
    return { ...view, store: () => current, onBack };
}

const settle = () => act(flush);
const nav = (name: string) => fireEvent.click(screen.getByRole('button', { name }));
const openFolder = async (name: string) => {
    fireEvent.click(screen.getByText(name).closest('button')!);
    await settle();
};
const field = (label: string, value: string) =>
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
const message = () => document.querySelector('output')?.textContent;

afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(navigator, 'clipboard');
});

describe('Vault folders', () => {
    it('renders nothing until the store has data', () => {
        const { container } = setup({
            prepare: (store) => Object.defineProperty(store, 'data', { value: null }),
        });
        expect(container.firstChild).toBeNull();
    });

    it('lists folders from the store and from secret counts, filtered by search', () => {
        setup({ secrets: [secret('1', { folder: 'Orphan' })], folders: ['Work', 'Unfiled'] });
        const labels = Array.from(
            document.querySelectorAll('.vault-folder-name'),
            (node) => node.textContent,
        );
        expect(labels).toEqual(['Orphan', 'Unfiled', 'Work']);
        field('Search folders', 'wor');
        expect(screen.queryByText('Orphan')).toBeNull();
        field('Search folders', 'zzz');
        expect(screen.getByText('No matching folders.')).toBeTruthy();
    });

    it('treats missing counts as empty', () => {
        setup({ prepare: (store) => Object.defineProperty(store, 'counts', { value: undefined }) });
        expect(screen.getByText('Work')).toBeTruthy();
        expect(document.querySelectorAll('.vault-folder-count')[0]!.textContent).toBe('0');
    });

    it('leaves the app from the folder list', () => {
        const { onBack } = setup();
        nav('Back');
        expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('creates a folder and opens it', async () => {
        const { store } = setup();
        nav('New folder');
        expect(screen.getByRole('heading', { name: 'Create folder' })).toBeTruthy();
        field('Folder name', 'Banking');
        nav('Save folder');
        await settle();
        expect(store().state().vaultFolders).toContain('Banking');
        expect(screen.getByRole('heading', { name: 'Banking' })).toBeTruthy();
    });

    it('validates folder names', async () => {
        setup();
        nav('New folder');
        const form = screen.getByLabelText('Folder name').closest('form')!;
        fireEvent.submit(form);
        expect(message()).toBe('Enter a folder name up to 200 characters.');
        field('Folder name', 'x'.repeat(201));
        fireEvent.submit(form);
        expect(message()).toBe('Enter a folder name up to 200 characters.');
        field('Folder name', 'WORK');
        fireEvent.submit(form);
        expect(message()).toBe('A folder with that name already exists.');
    });

    it('stays on the form when the store rejects folder changes', async () => {
        setup({
            prepare: (store) => {
                store.folder = async () => false;
            },
        });
        nav('New folder');
        field('Folder name', 'Rejected');
        nav('Save folder');
        await settle();
        expect(screen.getByRole('heading', { name: 'Create folder' })).toBeTruthy();
    });

    it('returns from the create page to the folder list', () => {
        setup();
        nav('New folder');
        field('Folder name', 'Draft');
        nav('Back');
        expect(screen.getByLabelText('Search folders')).toBeTruthy();
    });

    it('renames a folder, allowing its own name, and rejects duplicates', async () => {
        const { store } = setup({ secrets: [secret('1')] });
        await openFolder('Work');
        const rename = () => screen.getByLabelText('Folder name').closest('form')!;
        fireEvent.submit(rename());
        await settle();
        expect(store().state().vaultFolders).toContain('Work');

        field('Folder name', 'unfiled');
        fireEvent.submit(rename());
        expect(message()).toBe('A folder with that name already exists.');

        field('Folder name', 'Renamed');
        fireEvent.click(screen.getByRole('button', { name: 'Save folder' }));
        await settle();
        expect(screen.getByRole('heading', { name: 'Renamed' })).toBeTruthy();
        expect(store().state().secrets[0]!.folder).toBe('Renamed');
    });

    it('deletes a folder and moves its secrets to Unfiled', async () => {
        const { store } = setup({ secrets: [secret('1')] });
        await openFolder('Work');
        fireEvent.click(screen.getByRole('button', { name: 'Delete folder' }));
        expect(screen.getByRole('heading', { name: 'Delete folder' })).toBeTruthy();
        expect(document.querySelector('p')!.textContent).toContain('Work');
        nav('Back');
        expect(screen.getByRole('heading', { name: 'Work' })).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: 'Delete folder' }));
        nav('Delete folder');
        await settle();
        expect(store().state().secrets[0]!.folder).toBe('Unfiled');
        expect(screen.getByLabelText('Search folders')).toBeTruthy();
    });

    it('recovers secrets from a deleted default folder into a new folder', async () => {
        const { store } = setup({ secrets: [secret('1', { folder: 'Unfiled' })] });
        await openFolder('Unfiled');
        fireEvent.click(screen.getByRole('button', { name: 'Delete folder' }));
        expect(document.querySelector('p')!.textContent).toContain('Recovered secrets');
        nav('Delete folder');
        await settle();
        expect(store().state().secrets[0]!.folder).toBe('Recovered secrets');
    });

    it('keeps the folder when the store rejects deletion', async () => {
        setup({
            prepare: (store) => {
                store.folder = async () => false;
            },
        });
        await openFolder('Work');
        fireEvent.click(screen.getByRole('button', { name: 'Delete folder' }));
        nav('Delete folder');
        await settle();
        expect(screen.getByRole('heading', { name: 'Delete folder' })).toBeTruthy();
    });

    it('returns from a folder to the folder list', async () => {
        setup();
        await openFolder('Work');
        field('Search secrets', 'abc');
        nav('Back');
        expect(screen.getByLabelText('Search folders')).toBeTruthy();
        await openFolder('Work');
        expect((screen.getByLabelText('Search secrets') as HTMLInputElement).value).toBe('');
    });

    it('disables navigation while the store is busy', () => {
        setup({ prepare: (store) => void (store.busy = true) });
        expect((screen.getByRole('button', { name: 'Back' }) as HTMLButtonElement).disabled).toBe(
            true,
        );
    });
});

describe('Vault secrets', () => {
    const setupFolder = async (options: Options = {}) => {
        const view = setup({ secrets: [secret('1')], ...options });
        await openFolder('Work');
        return view;
    };

    it('lists secrets with their type and searches them', async () => {
        await setupFolder({
            secrets: [
                secret('1', { type: 'note' }),
                secret('2', { title: 'Bank', type: 'credentials' }),
            ],
        });
        expect(screen.getByText('Note')).toBeTruthy();
        expect(screen.getByText('Credentials')).toBeTruthy();
        field('Search secrets', 'bank');
        await settle();
        expect(screen.queryByText('Secret 1')).toBeNull();
        field('Search secrets', 'nothing-here');
        await settle();
        expect(screen.getByText('No matching secrets.')).toBeTruthy();
    });

    it('shows an empty folder message', async () => {
        setup({ secrets: [] });
        await openFolder('Work');
        expect(screen.getByText('No secrets in this folder.')).toBeTruthy();
    });

    it('pages long folders and retries failed loads', async () => {
        setup({
            secrets: Array.from({ length: 25 }, (_, index) => secret(`s${index}`)),
            prepare: (store) => {
                const page = store.page;
                let failed = false;
                store.page = (collection, query) => {
                    if (!failed && query.offset === 20) {
                        failed = true;
                        return Promise.reject(new Error('offline'));
                    }
                    return page(collection, query);
                };
            },
        });
        await openFolder('Work');
        expect(screen.getAllByText(/^Secret s/)).toHaveLength(20);
        fireEvent.click(screen.getByText('Load more secrets'));
        await settle();
        expect(screen.getByRole('alert').textContent).toBe('offline');
        fireEvent.click(screen.getByText('Retry'));
        await settle();
        expect(screen.getAllByText(/^Secret s/)).toHaveLength(25);
    });

    it('creates a secret in the current folder', async () => {
        const { store } = await setupFolder();
        nav('New secret');
        expect(screen.getByRole('heading', { name: 'New secret' })).toBeTruthy();
        field('Title', 'Wi-Fi');
        field('Secret', 'swordfish');
        field('Folder', 'Unfiled');
        nav('Save secret');
        await settle();
        expect(store().state().secrets.at(-1)).toMatchObject({
            title: 'Wi-Fi',
            value: 'swordfish',
            folder: 'Unfiled',
        });
        expect(screen.getByRole('heading', { name: 'Unfiled' })).toBeTruthy();
    });

    it('does not offer deletion for a new secret', async () => {
        await setupFolder();
        nav('New secret');
        expect(screen.queryByRole('button', { name: 'Delete secret' })).toBeNull();
    });

    it('adapts fields to the secret type', async () => {
        await setupFolder();
        nav('New secret');
        expect(screen.queryByLabelText('Username')).toBeNull();
        fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'credentials' } });
        field('Username', 'ada');
        field('Site', 'https://example.test');
        expect(screen.getByLabelText('Secret')).toBeTruthy();
        fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'note' } });
        expect(screen.queryByLabelText('Secret')).toBeNull();
        expect(screen.queryByLabelText('Site')).toBeNull();
    });

    it('saves notes without a secret value and reports invalid secrets', async () => {
        const { store } = await setupFolder();
        nav('New secret');
        fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'note' } });
        const form = screen.getByLabelText('Title').closest('form')!;
        fireEvent.submit(form);
        expect(message()).toBe('Add a title and secret; keep fields within their size limits.');
        field('Title', 'My note');
        field('Notes', 'remember');
        fireEvent.submit(form);
        await settle();
        expect(store().state().secrets.at(-1)).toMatchObject({
            title: 'My note',
            notes: 'remember',
            type: 'note',
        });
    });

    it('keeps the draft when the store rejects a save', async () => {
        await setupFolder({
            prepare: (store) => {
                store.put = async () => false;
            },
        });
        nav('New secret');
        field('Title', 'Rejected');
        field('Secret', 'x');
        nav('Save secret');
        await settle();
        expect(screen.getByLabelText('Title')).toBeTruthy();
    });

    it('reveals and hides the secret value', async () => {
        await setupFolder();
        fireEvent.click(screen.getByText('Secret 1').closest('button')!);
        const input = screen.getByLabelText('Secret') as HTMLInputElement;
        expect(input.type).toBe('password');
        fireEvent.click(screen.getByRole('button', { name: 'Reveal secret' }));
        expect(input.type).toBe('text');
        fireEvent.click(screen.getByRole('button', { name: 'Hide secret' }));
        expect(input.type).toBe('password');
    });

    it('copies the secret and reports clipboard availability', async () => {
        await setupFolder();
        fireEvent.click(screen.getByText('Secret 1').closest('button')!);
        fireEvent.click(screen.getByRole('button', { name: 'Copy secret' }));
        await settle();
        expect(message()).toBe('Clipboard unavailable. Reveal the value to copy it manually.');

        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
        fireEvent.click(screen.getByRole('button', { name: 'Copy secret' }));
        await settle();
        expect(writeText).toHaveBeenCalledWith('hunter2');
        expect(message()).toBe('Copied.');
    });

    it('edits an existing secret and offers deletion', async () => {
        const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
        const { store } = await setupFolder();
        fireEvent.click(screen.getByText('Secret 1').closest('button')!);
        field('Title', 'Renamed');
        nav('Save secret');
        await settle();
        expect(store().state().secrets[0]!.title).toBe('Renamed');

        fireEvent.click(screen.getByText('Renamed').closest('button')!);
        nav('Delete secret');
        await settle();
        expect(confirm).toHaveBeenCalledWith('Delete Renamed?');
        expect(store().state().secrets).toHaveLength(1);

        confirm.mockReturnValue(true);
        const remove = store().remove;
        store().remove = async () => false;
        nav('Delete secret');
        await settle();
        expect(screen.getByLabelText('Title')).toBeTruthy();

        store().remove = remove;
        nav('Delete secret');
        await settle();
        expect(store().state().secrets).toHaveLength(0);
        expect(screen.getByText('No secrets in this folder.')).toBeTruthy();
    });

    it('asks before discarding changed drafts only', async () => {
        const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
        await setupFolder();
        fireEvent.click(screen.getByText('Secret 1').closest('button')!);
        nav('Back');
        expect(confirm).not.toHaveBeenCalled();
        expect(screen.queryByLabelText('Title')).toBeNull();

        fireEvent.click(screen.getByText('Secret 1').closest('button')!);
        field('Title', 'Changed');
        nav('Back');
        expect(confirm).toHaveBeenCalledWith('Discard unsaved secret changes?');
        expect(screen.getByLabelText('Title')).toBeTruthy();
        confirm.mockReturnValue(true);
        nav('Back');
        expect(screen.queryByLabelText('Title')).toBeNull();
    });

    it('ignores initial editor normalisation but keeps real edits', async () => {
        const NotesEditor = ({ onChange }: SimulatorAppNotesProps) => (
            <>
                <button type="button" onClick={() => onChange('normalised', true)}>
                    normalise
                </button>
                <button type="button" onClick={() => onChange('typed')}>
                    type
                </button>
            </>
        );
        const { store } = await setupFolder({ host: { NotesEditor } });
        fireEvent.click(screen.getByText('Secret 1').closest('button')!);
        fireEvent.click(screen.getByText('normalise'));
        nav('Back');
        expect(screen.queryByLabelText('Title')).toBeNull();

        fireEvent.click(screen.getByText('Secret 1').closest('button')!);
        fireEvent.click(screen.getByText('type'));
        nav('Save secret');
        await settle();
        expect(store().state().secrets[0]!.notes).toBe('typed');
    });
});
