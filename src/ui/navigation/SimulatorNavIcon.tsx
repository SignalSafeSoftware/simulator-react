import {
    ArrowLeft,
    ArrowRight,
    CornerUpLeft,
    CornerUpRight,
    Globe,
    History,
    Home,
    Images,
    Inbox,
    Mail,
    MessageCircle,
    Phone,
    Send,
    Settings,
    Trash2,
    UserRound,
    Vault,
    type LucideIcon,
} from 'lucide-react';

const icons: Readonly<Record<string, LucideIcon>> = {
    '📞': Phone,
    '📧': Mail,
    '🌐': Globe,
    '💬': MessageCircle,
    '🏠': Home,
    '🕐': History,
    '👤': UserRound,
    '↩': ArrowLeft,
    '📥': Inbox,
    '📤': Send,
    '🗑️': Trash2,
    '🗑': Trash2,
    '➤': Send,
    '↪': CornerUpLeft,
    '➜': ArrowRight,
    '⚙': Settings,
    '🔐': Vault,
    '🖼': Images,
    '↗': CornerUpRight,
};
export function SimulatorNavIcon({ icon }: Readonly<{ icon: string }>) {
    const Icon = icons[icon];
    return Icon ? <Icon size={18} strokeWidth={1.75} aria-hidden='true' /> : <>{icon}</>;
}
