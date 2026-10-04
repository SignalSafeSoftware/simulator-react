import { SimulatorApp, isSimulatorApp } from '@signalsafe/simulator-core/simulatorApp';
import type { SimulatorEntryPoint } from '@signalsafe/simulator-core/devicePayload';
import type { SimulatorApp as ExistingReactApp } from '@signalsafe/simulator-core/simulatorApp';

// Existing JSON literals remain assignable; the canonical value and type share a name.
const raw: SimulatorApp = 'phone';
const values: SimulatorApp[] = Object.values(SimulatorApp);
const entry: SimulatorEntryPoint = { app: SimulatorApp.Phone, screen: 'history' };
const existing: ExistingReactApp = entry.app;
const phone: 'phone' = SimulatorApp.Phone;
declare const input: unknown;
if (isSimulatorApp(input)) {
    const narrowed: SimulatorApp = input;
    void narrowed;
}
// @ts-expect-error Channels are not app identifiers.
const invalid: SimulatorApp = 'sms';
// @ts-expect-error Canonical identifiers cannot be reassigned.
SimulatorApp.Phone = 'email';
void [raw, values, existing, phone, invalid];
