import { runSmokePackage } from './smoke-package-lib.mjs';

runSmokePackage({
    runtimeChecks: [
        { exports: ['createSimulatorDatasource', 'createSimulatorDatasourceFromPayload', 'simulatorDatasourceToPayload', 'updateSimulatorDatasource', 'PhoneCallView', 'PhoneContactEditor', 'PhoneHistoryDetail', 'PhoneHistoryPagination', 'PhoneKeypad', 'SimulatorScreenTile'] },
        {
            subpath: './utils/validateSimulatorPayload',
            exports: ['validateSimulatorPayload'],
        },
        {
            subpath: './utils/simulatorPreviewReport',
            exports: ['buildSimulatorPreviewReport'],
        },
        {
            subpath: './utils/simulatorRealismChecks',
            exports: ['runSimulatorRealismChecks'],
        },
        {
            subpath: './utils/previewFallbackWorld',
            exports: ['applyPreviewFallback'],
        },
    ],
    typecheckSubpaths: [
        '.',
        './utils/validateSimulatorPayload',
        './utils/simulatorPreviewReport',
        './utils/simulatorRealismChecks',
        './utils/previewFallbackWorld',
    ],
});
