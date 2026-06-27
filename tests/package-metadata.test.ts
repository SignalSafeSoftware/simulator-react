import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('package metadata', () => {
    it('does not require react-bootstrap as a peer or dev dependency', () => {
        const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
            peerDependencies?: Record<string, string>;
            devDependencies?: Record<string, string>;
        };

        expect(pkg.peerDependencies?.['react-bootstrap']).toBeUndefined();
        expect(pkg.devDependencies?.['react-bootstrap']).toBeUndefined();
    });
});
