import type { FormEventHandler, ReactNode } from 'react';
export interface PhoneContactEditorProps {
  defaultName?: string;
  defaultEmail?: string;
  number: string;
  onNumberChange: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onCancel: () => void;
  saving?: boolean;
  saveDisabled?: boolean;
  numberHint?: ReactNode;
  nameMaxLength?: number;
  numberRequired?: boolean;
  numberPlaceholder?: string;
}
/** Presentation only: revisions, normalization and persistence belong to the host. */
export default function PhoneContactEditor({
  defaultName,
  defaultEmail,
  number,
  onNumberChange,
  onSubmit,
  onCancel,
  saving = false,
  saveDisabled = false,
  numberHint,
  nameMaxLength = 100,
  numberRequired = false,
  numberPlaceholder,
}: Readonly<PhoneContactEditorProps>) {
  return (
    <form className="simulator-contact-editor" onSubmit={onSubmit}>
      <label>
        Name
        <input
          name="name"
          defaultValue={defaultName}
          maxLength={nameMaxLength}
          required
          autoComplete="name"
        />
      </label>
      <label>
        Phone number
        <input
          name="number"
          value={number}
          onChange={(event) => onNumberChange(event.target.value)}
          placeholder={numberPlaceholder}
          type="tel"
          required={numberRequired}
        />
        {numberHint}
      </label>
      <label>
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={defaultEmail}
        />
      </label>
      <div className="simulator-editor-actions">
        <button
          type="button"
          className="simulator-editor-cancel"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="simulator-editor-save"
          disabled={saving || saveDisabled}
        >
          {saving ? 'Saving…' : 'Save contact'}
        </button>
      </div>
    </form>
  );
}
