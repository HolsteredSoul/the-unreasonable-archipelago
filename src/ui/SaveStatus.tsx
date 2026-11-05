import { useEffect, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import './save-status.css';

export type SaveStatusProps = {
  /** The outcome of an actual persistence attempt, not an optimistic UI state. */
  failed: boolean;
  /** Use inline inside a dialog; floating is independent of the compact HUD. */
  variant?: 'floating' | 'inline';
  /** Keep one announcing instance mounted for the lifetime of App. */
  announce?: boolean;
  /** Hide only the visual copy while another surface displays it. */
  visible?: boolean;
  id?: string;
};

const FAILURE_MESSAGE = "Progress isn't saving in this browser. Keep this tab open; reloading may lose changes.";

/**
 * Mount the primary instance outside the inert HUD and keep it mounted on success.
 * A conditional dialog copy uses variant="inline" announce={false}; set visible={false}
 * on the primary copy while that dialog is open. Moving between surfaces must not
 * remount the primary announcer or change its announce prop.
 */
export function SaveStatus({ failed, variant = 'floating', announce = true, visible = true, id }: SaveStatusProps) {
  const [announcement, setAnnouncement] = useState('');

  // Insert text into an already mounted live region, including when initially failed.
  // Repeated failed writes and visual-surface changes leave its text untouched.
  useEffect(() => { setAnnouncement(failed ? FAILURE_MESSAGE : ''); }, [failed]);

  return <>
    <div id={id} className={`save-status save-status--${variant}`} hidden={!failed || !visible} role="note" aria-label="Saving unavailable" data-save-status>
      <TriangleAlert size={20} aria-hidden="true" />
      <p><strong>Progress isn't saving in this browser.</strong><span>Keep this tab open; reloading may lose changes.</span></p>
    </div>
    {announce && <span className="save-status-announcement" role="status" aria-live="polite" aria-atomic="true" data-save-announcement>{announcement}</span>}
  </>;
}
