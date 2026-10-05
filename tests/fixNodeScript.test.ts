import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

const originalArgv = [...process.argv];

const originalCwd = process.cwd();

const originalDocument = globalThis.document;

const originalCustomEvent = (
    globalThis as {
        CustomEvent?: unknown;
    }
).CustomEvent;

const originalHTMLElement = (
    globalThis as {
        HTMLElement?: unknown;
    }
).HTMLElement;

async function importFixNodeScript() {
    vi.resetModules();
    return import('../scripts/fix-node-esm-relative-imports.js');
}

afterEach(() => {
    process.argv = [...originalArgv];
    process.chdir(originalCwd);
    (
        globalThis as {
            document?: Document;
        }
    ).document = originalDocument;
    (
        globalThis as {
            CustomEvent?: unknown;
        }
    ).CustomEvent = originalCustomEvent;
    (
        globalThis as {
            HTMLElement?: unknown;
        }
    ).HTMLElement = originalHTMLElement;
    vi.restoreAllMocks();
});

describe('ESM import fixer script', () => {
    it('covers the ESM relative import fixer script success and error paths', async () => {
        const dir = mkdtempSync(path.join(tmpdir(), 'simreact-esm-'));
        const nestedDir = path.join(dir, 'nested');
        const indexDir = path.join(dir, 'utils');
        const { mkdirSync } = await import('node:fs');
        mkdirSync(nestedDir, { recursive: true });
        mkdirSync(indexDir, { recursive: true });
        writeFileSync(path.join(indexDir, 'index.js'), 'export const value = 1;\n');
        writeFileSync(path.join(dir, 'helper.js'), 'export const helper = 1;\n');
        writeFileSync(
            path.join(dir, 'entry.js'),
            'import { helper } from "./helper";\nimport "./utils";\nconsole.log(helper);\n',
        );
        writeFileSync(path.join(nestedDir, 'types.d.ts'), 'export * from "../helper";\n');
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        process.argv = ['node', 'fix-node-esm-relative-imports.ts', dir];
        await importFixNodeScript();
        const updatedEntry = readFileSync(path.join(dir, 'entry.js'), 'utf8');
        const updatedTypes = readFileSync(path.join(nestedDir, 'types.d.ts'), 'utf8');
        expect(updatedEntry).toContain('./helper.js');
        expect(updatedEntry).toContain('./utils/index.js');
        expect(updatedTypes).toContain('../helper.js');
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('updated 2 file(s)'));
        process.argv = ['node', 'fix-node-esm-relative-imports.ts'];
        await expect(importFixNodeScript()).rejects.toThrow(
            'Usage: tsx scripts/fix-node-esm-relative-imports.ts <dist-dir>',
        );
        process.argv = ['node', 'fix-node-esm-relative-imports.ts', 'does-not-exist'];
        await expect(importFixNodeScript()).rejects.toThrow('Target dist directory does not exist');
        rmSync(dir, { recursive: true, force: true });
    });
});
