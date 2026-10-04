import type { ReactNode } from 'react';
import { Vault as VaultIcon, Images, Settings, LockKeyhole } from 'lucide-react';
import SimulatorScreenTile from '../../views/SimulatorScreenTile.js';
import { SIM_SCREEN_HEADER } from '../../ui/semanticSimulatorClasses.js';
import { SimulatorButtonTone, simBtnToneClass, joinClasses } from '../../ui/simulatorClasses.js';

const TILE_ICON_SIZE = 48;
const TILE_ICON_STROKE_WIDTH = 1.5;

export interface DeviceHomeProps {
    /** Host content, such as a clock, displayed below the Home heading. */
    homeHeader?: ReactNode;
    onOpenSettings: () => void;
    onOpenVault: () => void;
    onOpenPhotos: () => void;
    /** Supplying this callback makes the lock action available. */
    onLock?: () => void;
}

/** Device Home presentation; the caller owns routing and lock state. */
export default function DeviceHome({
    homeHeader,
    onOpenSettings,
    onOpenVault,
    onOpenPhotos,
    onLock,
}: Readonly<DeviceHomeProps>) {
    return (
        <section className="simulator-home-screen">
            <h2 className={joinClasses(SIM_SCREEN_HEADER, 'home-banner')}>Home</h2>
            {homeHeader}
            <div className="prototype-home">
                <SimulatorScreenTile
                    label="Settings"
                    onClick={onOpenSettings}
                    icon={
                        <Settings
                            size={TILE_ICON_SIZE}
                            strokeWidth={TILE_ICON_STROKE_WIDTH}
                            aria-hidden="true"
                        />
                    }
                />
                <SimulatorScreenTile
                    label="Vault"
                    onClick={onOpenVault}
                    icon={
                        <VaultIcon
                            size={TILE_ICON_SIZE}
                            strokeWidth={TILE_ICON_STROKE_WIDTH}
                            aria-hidden="true"
                        />
                    }
                />
                <SimulatorScreenTile
                    label="Photos"
                    onClick={onOpenPhotos}
                    icon={
                        <Images
                            size={TILE_ICON_SIZE}
                            strokeWidth={TILE_ICON_STROKE_WIDTH}
                            aria-hidden="true"
                        />
                    }
                />
            </div>
            {onLock && (
                <button
                    className={simBtnToneClass(SimulatorButtonTone.NeutralOutline)}
                    onClick={onLock}
                >
                    <LockKeyhole size={18} aria-hidden="true" /> Lock device
                </button>
            )}
        </section>
    );
}
