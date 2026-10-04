import type { ReactElement } from 'react';
import type { ReactTestRenderer } from 'react-test-renderer';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export const TestRenderer = require('react-test-renderer') as typeof import('react-test-renderer');
export const act = TestRenderer.act;

/** Mount within act and return the renderer only after React has flushed updates. */
export async function renderWithAct(element: ReactElement): Promise<ReactTestRenderer> {
    const mounted: { renderer?: ReactTestRenderer } = {};
    await act(async () => {
        mounted.renderer = TestRenderer.create(element);
    });
    if (!mounted.renderer) throw new Error('React did not mount the test component');
    return mounted.renderer;
}
