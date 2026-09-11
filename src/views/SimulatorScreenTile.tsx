import type { ReactNode } from 'react';
/** Optional host action tile; existing JSON-driven Home screens remain unchanged. */
export default function SimulatorScreenTile({
  label,
  icon,
  onClick,
}: Readonly<{ label: string; icon?: ReactNode; onClick: () => void }>) {
  return (
    <button type="button" className="simulator-screen-tile" onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  );
}
