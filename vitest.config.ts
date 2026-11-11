import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const require = createRequire(import.meta.url);
const packageRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    resolve: {
        alias: [
            { find: /^react-dom\/server$/, replacement: require.resolve('react-dom/server') },
            {
                find: /^@signalsafe\/simulator-react\/(.+)$/,
                replacement: path.resolve(packageRoot, 'src') + '/$1',
            },
            {
                find: '@workspace-simulator-test-support',
                replacement: path.resolve(packageRoot, 'tests/support'),
            },
            {
                find: /^@workspace-simulator-test-support\/(.+)$/,
                replacement: path.resolve(packageRoot, 'tests/support') + '/$1',
            },
        ],
    },
    test: {
        environment: 'node',
        setupFiles: ['tests/support/setupDom.ts'],
        include: ['tests/**/*.test.{ts,tsx}'],
        coverage: {
            provider: 'v8',
            thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 },
            include: ['src/**'],
            exclude: ['src/**/*.d.ts'],
            reporter: ['text', 'lcov'],
            reportsDirectory: 'coverage',
        },
    },
});
