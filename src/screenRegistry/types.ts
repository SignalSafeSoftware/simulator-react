/**
 * Typed screen registry: app + screen → renderer component + getProps.
 * Keeps rendering concerns separate from reducer/session state.
 */
import type { ComponentType, ReactNode } from 'react';
import type { SimulatorSessionState } from '../types/session.js';
import type { SimulatorDispatchAction } from '../state/simulatorSessionReducer.js';
import type { SimulatorCapabilities } from '../utils/simulatorCapabilities.js';
import type {
    SimulatorChoiceRenderProps,
    SimulatorFeedbackRenderProps,
} from '../ui/renderSlots.js';
import type { EmailSimulatorViewProps } from '../views/EmailSimulatorView.js';
import type { MessagesThreadListViewProps } from '../views/MessagesThreadListView.js';
import type { MessagesNewThreadViewProps } from '../views/MessagesNewThreadView.js';
import type { SmsSimulatorViewProps } from '../views/SmsSimulatorView.js';
import type { BrowserSimulatorViewProps } from '../views/BrowserSimulatorView.js';
import type { ContactsViewProps } from '../views/ContactsView.js';
import type { PhoneSimulatorViewProps } from '../views/PhoneSimulatorView.js';
import type { HomeSimulatorViewProps } from '../views/HomeSimulatorView.js';
import type { DirectoryViewProps } from '../views/DirectoryView.js';

/** Context passed to getProps: state, dispatch, capabilities, and shell-level handlers. */
export interface SimulatorRenderContext {
    state: SimulatorSessionState;
    dispatch: (action: SimulatorDispatchAction) => void;
    /** Derived from payload; controls visibility of Store, Settings, Dial, Directory, voicemail, etc. */
    capabilities: SimulatorCapabilities;
    onAction: (action: import('../types/session').SimulatorAction) => void;
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
}

/** One registry entry: optional screen pin (exact match) or default for app. */
export type ScreenEntry =
    | {
          app: 'email';
          screen?: never;
          component: ComponentType<EmailSimulatorViewProps>;
          getProps: (ctx: SimulatorRenderContext) => EmailSimulatorViewProps;
      }
    | {
          app: 'messages';
          screen: 'threads';
          component: ComponentType<MessagesThreadListViewProps>;
          getProps: (ctx: SimulatorRenderContext) => MessagesThreadListViewProps;
      }
    | {
          app: 'messages';
          screen: 'new_thread';
          component: ComponentType<MessagesNewThreadViewProps>;
          getProps: (ctx: SimulatorRenderContext) => MessagesNewThreadViewProps;
      }
    | {
          app: 'messages';
          screen: 'thread_detail';
          component: ComponentType<SmsSimulatorViewProps>;
          getProps: (ctx: SimulatorRenderContext) => SmsSimulatorViewProps;
      }
    | {
          app: 'internet';
          screen?: never;
          component: ComponentType<BrowserSimulatorViewProps>;
          getProps: (ctx: SimulatorRenderContext) => BrowserSimulatorViewProps;
      }
    | {
          app: 'phone';
          screen: 'contacts';
          component: ComponentType<ContactsViewProps>;
          getProps: (ctx: SimulatorRenderContext) => ContactsViewProps;
      }
    | {
          app: 'phone';
          screen: 'directory';
          component: ComponentType<DirectoryViewProps>;
          getProps: (ctx: SimulatorRenderContext) => DirectoryViewProps;
      }
    | {
          app: 'phone';
          screen?: never;
          component: ComponentType<PhoneSimulatorViewProps>;
          getProps: (ctx: SimulatorRenderContext) => PhoneSimulatorViewProps;
      }
    | {
          app: 'home';
          screen?: never;
          component: ComponentType<HomeSimulatorViewProps>;
          getProps: (ctx: SimulatorRenderContext) => HomeSimulatorViewProps;
      };
export type { SimulatorApp } from '../types/portableSimulator.js';
