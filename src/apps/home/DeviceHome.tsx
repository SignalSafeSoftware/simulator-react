import type { ReactNode } from 'react';
import HomeClock, { type HomeClockOptions } from './HomeClock.js';
import { Vault as VaultIcon, Images, Settings, LockKeyhole } from 'lucide-react';
import SimulatorScreenTile from '../../views/shared/SimulatorScreenTile.js';
import { SIM_SCREEN_HEADER } from '../../ui/styles/semanticSimulatorClasses.js';
import { joinClasses, SIM_BTN_OUTLINE } from '../../ui/styles/simulatorClasses.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';

const TILE_ICON_SIZE = 48;
const TILE_ICON_STROKE_WIDTH = 1.5;

export interface DeviceHomeProps {
    /** Explicit replacement for the default clock panel. */
    homeHeader?: ReactNode;
    homeClock?: HomeClockOptions;
    /** Missing callbacks retain a disabled tile rather than inventing host capabilities. */
    onOpenSettings?: () => void;
    onOpenVault?: () => void;
    onOpenPhotos?: () => void;
    additionalTiles?: ReactNode;
    children?: ReactNode;
    /** Supplying this callback makes the lock action available. */
    onLock?: () => void;
}

/** Device Home presentation; the caller owns routing and lock state. */
export default function DeviceHome({
    homeHeader,
    homeClock,
    additionalTiles,
    children,
    onOpenSettings,
    onOpenVault,
    onOpenPhotos,
    onLock,
}: Readonly<DeviceHomeProps>) {
    const { t } = useSimulatorLocale();
    return (
        <section className='simulator-home-screen'>
            <h2 className={joinClasses(SIM_SCREEN_HEADER, 'home-banner')}>{t('app.home.title')}</h2>
            {homeHeader === undefined ? <HomeClock {...homeClock} /> : homeHeader}
            <div className='prototype-home'>
                <SimulatorScreenTile
                    label={t('app.home.settings')}
                    onClick={onOpenSettings}
                    title={onOpenSettings ? undefined : t('home.appUnavailable')}
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
                    title={onOpenVault ? undefined : t('home.appUnavailable')}
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
                    title={onOpenPhotos ? undefined : t('home.appUnavailable')}
                    icon={
                        <Images
                            size={TILE_ICON_SIZE}
                            strokeWidth={TILE_ICON_STROKE_WIDTH}
                            aria-hidden='true'
                        />
                    }
                />
                {additionalTiles}
            </div>
            {children}
            {onLock && (
                <button className={SIM_BTN_OUTLINE} onClick={onLock}>
                    <LockKeyhole size={18} aria-hidden='true' /> {t('app.home.lock')}
                </button>
            )}
        </section>
    );
}
