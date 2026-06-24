import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const packageRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    resolve: {
        alias: [
            {
                find: "@signalsafe/simulator-react",
                replacement: path.resolve(packageRoot, "src/index.ts"),
            },
            {
                find: /^@signalsafe\/simulator-react\/(.+)$/,
                replacement: path.resolve(packageRoot, "src") + "/$1",
            },
            {
                find: "@workspace-simulator-test-support",
                replacement: path.resolve(packageRoot, "tests/support"),
            },
            {
                find: /^@workspace-simulator-test-support\/(.+)$/,
                replacement: path.resolve(packageRoot, "tests/support") + "/$1",
            },
        ],
    },
    test: {
        environment: "node",
        include: ["tests/**/*.test.ts"],
    },
});
