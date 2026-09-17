import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createSimulatorDatasource, simulatorDatasourceToPayload } from '@signalsafe/simulator-react';

const require = createRequire(import.meta.url);
const manifest = JSON.parse(readFileSync(resolve(dirname(require.resolve('@signalsafe/simulator-react')), '../package.json'), 'utf8'));
assert.equal(manifest.version, '0.16.3');
assert.equal(manifest.engines.node, '>=19.0.0');
const input = { entry_point: { app: 'phone', screen: 'incoming_call' }, contacts: [{ id: 'c1', display_name: 'Sample', number: '+12025550123' }] };
const datasource = createSimulatorDatasource(input);
assert.equal(datasource.contacts[0].id, 'c1');
assert.ok(Object.isFrozen(datasource.contacts[0]));
input.contacts[0].display_name = 'Changed';
assert.deepEqual(createSimulatorDatasource(JSON.stringify({ ...input, contacts: [{ id: 'c1', display_name: 'Sample', number: '+12025550123' }] })), datasource);
const payload = simulatorDatasourceToPayload(datasource);
payload.contacts[0].id = 'changed';
assert.equal(datasource.contacts[0].id, 'c1');
assert.throws(() => createSimulatorDatasource('{invalid'));
assert.throws(() => createSimulatorDatasource({ schema_version: 999 }));
for (const subpath of ['validateSimulatorPayload', 'simulatorPreviewReport', 'simulatorRealismChecks', 'previewFallbackWorld']) {
    assert.ok(Object.keys(await import(`@signalsafe/simulator-react/utils/${subpath}`)).length > 0);
}

assert.equal(manifest.dependencies['@signalsafe/simulator-core'], '0.3.2');
assert.equal(manifest.dependencies['@signalsafe/tree-spec'], '^0.4.1');
console.log(`Runtime compatibility passed on ${process.version}`);
