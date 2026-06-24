import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

function usage(): never {
    throw new Error('Usage: tsx scripts/fix-node-esm-relative-imports.ts <dist-dir>');
}

const targetDirArg = process.argv[2];
if (!targetDirArg) {
    usage();
}

const targetDir = path.resolve(process.cwd(), targetDirArg);
if (!existsSync(targetDir) || !statSync(targetDir).isDirectory()) {
    throw new Error(`Target dist directory does not exist: ${targetDir}`);
}

const FILE_EXTENSIONS = new Set(['.js', '.d.ts']);
const EXPLICIT_EXTENSION_RE = /\.(?:[cm]?js|json|css|svg|png|jpe?g|gif|webp|map)$/i;

function listFiles(dir: string): string[] {
    const entries = readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...listFiles(fullPath));
            continue;
        }
        if ([...FILE_EXTENSIONS].some((ext) => fullPath.endsWith(ext))) {
            files.push(fullPath);
        }
    }
    return files;
}

function resolveRuntimeSpecifier(filePath: string, specifier: string): string {
    if (!specifier.startsWith('./') && !specifier.startsWith('../')) {
        return specifier;
    }
    if (EXPLICIT_EXTENSION_RE.test(specifier)) {
        return specifier;
    }

    const baseDir = path.dirname(filePath);
    const fileCandidate = path.resolve(baseDir, `${specifier}.js`);
    if (existsSync(fileCandidate)) {
        return `${specifier}.js`;
    }

    const indexCandidate = path.resolve(baseDir, specifier, 'index.js');
    if (existsSync(indexCandidate)) {
        return `${specifier}/index.js`;
    }

    return specifier;
}

function rewriteSpecifiers(filePath: string, content: string): string {
    const replacers = [
        /\bfrom\s+(['"])(\.{1,2}\/[^'"]+)\1/g,
        /\bimport\s+(['"])(\.{1,2}\/[^'"]+)\1/g,
    ];

    let updated = content;
    for (const pattern of replacers) {
        updated = updated.replace(pattern, (full, _quote: string, specifier: string) => {
            const nextSpecifier = resolveRuntimeSpecifier(filePath, specifier);
            return full.replace(specifier, nextSpecifier);
        });
    }
    return updated;
}

let changedFiles = 0;
for (const filePath of listFiles(targetDir)) {
    const content = readFileSync(filePath, 'utf8');
    const updated = rewriteSpecifiers(filePath, content);
    if (updated !== content) {
        writeFileSync(filePath, updated);
        changedFiles += 1;
    }
}

console.log(`fix-node-esm-relative-imports: updated ${changedFiles} file(s) in ${targetDir}`);
