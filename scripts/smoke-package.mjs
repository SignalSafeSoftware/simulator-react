import { runSmokePackage } from './smoke-package-lib.mjs';

runSmokePackage({
    runtimeChecks: [
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
