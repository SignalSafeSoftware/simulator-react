import type { ReactNode } from 'react';
import { Vault as VaultIcon, Images, Settings, LockKeyhole } from 'lucide-react';
import SimulatorScreenTile from '../../views/shared/SimulatorScreenTile.js';
import { SIM_SCREEN_HEADER } from '../../ui/styles/semanticSimulatorClasses.js';
import { joinClasses, SIM_BTN_OUTLINE } from '../../ui/styles/simulatorClasses.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';

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
    const { t } = useSimulatorLocale();
    return (
        <section className='simulator-home-screen'>
            <h2 className={joinClasses(SIM_SCREEN_HEADER, 'home-banner')}>{t('app.home.title')}</h2>
            {homeHeader}
            <div className='prototype-home'>
                <SimulatorScreenTile
                    label={t('app.home.settings')}
                    onClick={onOpenSettings}
                    icon={
                        <Settings
                            size={TILE_ICON_SIZE}
                            strokeWidth={TILE_ICON_STROKE_WIDTH}
                            aria-hidden='true'
                        />
                    }
                />
                <SimulatorScreenTile
                    label={t('app.home.vault')}
                    onClick={onOpenVault}
                    icon={
                        <VaultIcon
                            size={TILE_ICON_SIZE}
                            strokeWidth={TILE_ICON_STROKE_WIDTH}
                            aria-hidden='true'
                        />
                    }
                />
                <SimulatorScreenTile
                    label={t('app.home.photos')}
                    onClick={onOpenPhotos}
                    icon={
                        <Images
                            size={TILE_ICON_SIZE}
                            strokeWidth={TILE_ICON_STROKE_WIDTH}
                            aria-hidden='true'
                        />
                    }
                />
            </div>
            {onLock && (
                <button className={SIM_BTN_OUTLINE} onClick={onLock}>
                    <LockKeyhole size={18} aria-hidden='true' /> {t('app.home.lock')}
                </button>
            )}
        </section>
    );
}
