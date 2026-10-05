import { readFileSync } from 'node:fs';
import { runSmokePackage } from './smoke-package-lib.mjs';
const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const subpaths = Object.keys(manifest.exports).filter((p) => p !== '.' && p !== './package.json');
runSmokePackage({
    examples: ['demo-home-fixture.ts'],
    runtimeChecks: subpaths.map((subpath) => ({
        subpath,
        exports:
            {
                './apps/home/DeviceHome': ['default'],
                './state/simulatorDispatchActions': [
                    'SimulatorDispatchActionType',
                    'switchChannelAction',
                ],
                './ui/styles/simulatorClasses': ['SimulatorButtonTone', 'simBtnToneClass'],
                './ui/styles/semanticSimulatorClasses': [
                    'SIM_SCREEN_HEADER',
                    'SIM_APP_PAGE_CONTENT',
                    'SIM_APP_LIST_PAGE_CONTENT',
                ],
                './datasource/datasource': [
                    'createSimulatorDatasource',
                    'createSimulatorDatasourceFromPayload',
                    'simulatorDatasourceToPayload',
                    'updateSimulatorDatasource',
                ],
                './views/phone/PhoneCallView': ['default'],
                './views/contacts/PhoneContactEditor': ['default'],
                './views/phone/PhoneHistoryDetail': ['default', 'PhoneHistoryPagination'],
                './views/phone/PhoneKeypad': ['default'],
                './views/shared/SimulatorScreenTile': ['default'],
            }[subpath] ?? [],
    })),
    typecheckSubpaths: subpaths,
});
