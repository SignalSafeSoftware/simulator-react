import type { SimulatorHomePayload } from '../../types/session.js';
import {
    SIM_FLEX_WRAP,
    SIM_ROUNDED_NONE,
    SIM_SURFACE_WHITE,
    SIM_TEXT_CENTER,
    SIM_TEXT_SM,
    joinClasses,
} from '../../ui/styles/simulatorClasses.js';
import { simBorder, simLayout, simSpacing } from '../../simulatorStyles.js';
import { SIM_PAGE_CONTENT } from '../../ui/styles/semanticSimulatorClasses.js';
export function HomeWidgets({ widgets }: Readonly<{ widgets: SimulatorHomePayload['widgets'] }>) {
    if (!widgets.length) return null;
    return (
        <div className={SIM_PAGE_CONTENT}>
            <div className={joinClasses(simLayout.actionsRow, SIM_FLEX_WRAP)}>
                {widgets.map((widget) => (
                    <div
                        key={widget.id}
                        className={joinClasses(
                            simBorder.tile,
                            SIM_ROUNDED_NONE,
                            SIM_SURFACE_WHITE,
                            simSpacing.p2,
                            SIM_TEXT_SM,
                            SIM_TEXT_CENTER,
                        )}
                        style={{ minWidth: 80, minHeight: 64 }}
                    >
                        {widget.label}
                    </div>
                ))}
            </div>
        </div>
    );
}
