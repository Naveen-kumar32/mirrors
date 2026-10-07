import { CLOSED_NOTE } from '../data';
import { useClinicStatus } from '../lib';

/* "Open now · until 7 pm" / "Closed now · Opens tomorrow at 3 pm", plus a note while closed */
export default function ClinicStatus({ note = true, className = '' }) {
  const s = useClinicStatus();
  return (
    <div className={`status ${s.open ? 'is-open' : 'is-closed'} ${className}`}>
      <p className="status__line">
        <span className="status__dot" aria-hidden="true" />
        {s.open ? s.text : `Closed now · ${s.text}`}
      </p>
      {!s.open && note && <p className="status__note">{CLOSED_NOTE}</p>}
    </div>
  );
}

/** "tomorrow at 3 pm" from "Opens tomorrow at 3 pm" — for sentences like "we'll call you after we open …" */
export const opensWhen = (text) => text.replace(/^Opens\s+/i, '');
