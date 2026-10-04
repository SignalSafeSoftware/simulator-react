/**
 * Typed screen registry: app + screen → renderer component + getProps.
 * Keeps rendering concerns separate from reducer/session state.
 */
import type {
    SimulatorMessagesScreenId,
    SimulatorPhoneScreenId,
} from '@signalsafe/simulator-core/devicePayload';
import { SimulatorApp } from '@signalsafe/simulator-core/simulatorApp';
import type { useSimulatorLocale } from '../i18n/SimulatorLocale.js';
import type { ComponentType, ReactNode } from 'react';
import type { SimulatorSessionState } from '../types/session.js';
import { type SimulatorDispatchAction } from '../state/simulatorDispatchActions.js';
import type { SimulatorCapabilities } from '../utils/payload/simulatorCapabilities.js';
import type {
    SimulatorChoiceRenderProps,
    SimulatorFeedbackRenderProps,
    SimulatorPhoneContactOpenProps,
    SimulatorPhoneIncomingCallExtraRenderProps,
} from '../ui/renderSlots.js';
import type { EmailSimulatorViewProps } from '../views/email/EmailSimulatorView.js';
import type { MessagesThreadListViewProps } from '../views/messages/MessagesThreadListView.js';
import type { MessagesNewThreadViewProps } from '../views/messages/MessagesNewThreadView.js';
import type { SmsSimulatorViewProps } from '../views/messages/SmsSimulatorView.js';
import type { BrowserSimulatorViewProps } from '../views/browser/BrowserSimulatorView.js';
import type { ContactsViewProps } from '../views/contacts/ContactsView.js';
import type { PhoneSimulatorViewProps } from '../views/phone/PhoneSimulatorView.js';
import type { HomeSimulatorViewProps } from '../views/home/HomeSimulatorView.js';
import type { DirectoryViewProps } from '../views/contacts/DirectoryView.js';

/** Context passed to getProps: state, dispatch, capabilities, and shell-level handlers. */
export interface SimulatorRenderContext {
    hostOwnsScreenActions?: boolean;
    locale?: ReturnType<typeof useSimulatorLocale>;
    state: SimulatorSessionState;
    dispatch: (action: SimulatorDispatchAction) => void;
    /** Derived from payload; controls visibility of Store, Settings, Dial, Directory, voicemail, etc. */
    capabilities: SimulatorCapabilities;
    onAction: (action: import('../types/session.js').SimulatorAction) => void;
    onSelectEmail: (messageId: string) => void;
    onBack: () => void;
    onSmsRevealNext: () => void;
    onSelectThread: (threadId: string) => void;
    /** When opening a contact from Phone app contacts screen; may emit event. */
    onOpenContactFromPhone?: (contactId: string) => void;
    /** Optional initial contacts search (e.g. from deep-link). */
    initialContactsSearch?: string;
    /** Host-owned choice button rendering passed from {@link SimulatorWithSession}. */
    renderChoice?: (choice: SimulatorChoiceRenderProps) => ReactNode;
    /** Host-owned feedback/warning rendering passed from {@link SimulatorWithSession}. */
    renderFeedback?: (feedback: SimulatorFeedbackRenderProps) => ReactNode;
    /** Host-owned content below incoming-call Answer/Ignore actions. */
    renderIncomingCallExtra?: (props: SimulatorPhoneIncomingCallExtraRenderProps) => ReactNode;
    /** When true, contact row clicks invoke {@link onPhoneContactOpen} instead of internal detail view. */
    hostOwnsPhoneContactDetail?: boolean;
    /** Host callback when a phone contact row is opened (requires {@link hostOwnsPhoneContactDetail}). */
    onPhoneContactOpen?: (props: SimulatorPhoneContactOpenProps) => void;
}

/** One registry entry: optional screen pin (exact match) or default for app. */
export type ScreenEntry =
    | {
          app: typeof SimulatorApp.Email;
          screen?: never;
          component: ComponentType<EmailSimulatorViewProps>;
          getProps: (ctx: SimulatorRenderContext) => EmailSimulatorViewProps;
      }
    | {
          app: typeof SimulatorApp.Messages;
          screen: typeof SimulatorMessagesScreenId.Threads;
          component: ComponentType<MessagesThreadListViewProps>;
          getProps: (ctx: SimulatorRenderContext) => MessagesThreadListViewProps;
      }
    | {
          app: typeof SimulatorApp.Messages;
          screen: typeof SimulatorMessagesScreenId.NewThread;
          component: ComponentType<MessagesNewThreadViewProps>;
          getProps: (ctx: SimulatorRenderContext) => MessagesNewThreadViewProps;
      }
    | {
          app: typeof SimulatorApp.Messages;
          screen: typeof SimulatorMessagesScreenId.ThreadDetail;
          component: ComponentType<SmsSimulatorViewProps>;
          getProps: (ctx: SimulatorRenderContext) => SmsSimulatorViewProps;
      }
    | {
          app: typeof SimulatorApp.Internet;
          screen?: never;
          component: ComponentType<BrowserSimulatorViewProps>;
          getProps: (ctx: SimulatorRenderContext) => BrowserSimulatorViewProps;
      }
    | {
          app: typeof SimulatorApp.Phone;
          screen: typeof SimulatorPhoneScreenId.Contacts;
          component: ComponentType<ContactsViewProps>;
          getProps: (ctx: SimulatorRenderContext) => ContactsViewProps;
      }
    | {
          app: typeof SimulatorApp.Phone;
          screen: typeof SimulatorPhoneScreenId.Directory;
          component: ComponentType<DirectoryViewProps>;
          getProps: (ctx: SimulatorRenderContext) => DirectoryViewProps;
      }
    | {
          app: typeof SimulatorApp.Phone;
          screen?: never;
          component: ComponentType<PhoneSimulatorViewProps>;
          getProps: (ctx: SimulatorRenderContext) => PhoneSimulatorViewProps;
      }
    | {
          app: typeof SimulatorApp.Home;
          screen?: never;
          component: ComponentType<HomeSimulatorViewProps>;
          getProps: (ctx: SimulatorRenderContext) => HomeSimulatorViewProps;
      };
