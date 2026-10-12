import { useEffect, useState } from "react";
import {
  type RecoveryCopy,
  type RecoveryResult,
  type RecoveryState,
  type RecoveryStore,
} from "../lib/recovery";
import { FeatureDialog } from "./FeatureDialog";

export type RecoveryPanelProps = {
  store: RecoveryStore;
  onRestore: (copy: RecoveryCopy) => void;
  onStateChange?: (state: RecoveryState) => void;
  onClose: () => void;
};

export function RecoveryPanel({ store, onRestore, onStateChange, onClose }: RecoveryPanelProps) {
  const [state, setState] = useState<RecoveryState | null>(null);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);
  useEffect(() => {
    const result = store.inspect();
    if (result.ok) setState(result.value);
    else setError(result.error);
  }, [store]);
  const receive = (result: RecoveryResult<RecoveryState>) => {
    if (result.ok) {
      setState(result.value);
      setError("");
      onStateChange?.(result.value);
    } else setError(result.error);
  };
  return (
    <FeatureDialog title="Local recovery drafts" onClose={onClose}>
      <p>
        Recovery is OFF initially. If enabled, committed cell text, document names and format
        settings are stored in {store.location}. Original file paths, active uncommitted edits and
        undo history are not stored. Nothing is sent over the network.
      </p>
      <p>
        Drafts expire 7 days after their last completed snapshot. Total recovery storage is limited
        to 2 MiB and 50 documents. Expired drafts are removed when PlainSheet next reads or writes
        recovery storage; deletion cannot run while the app is closed. Browser or app data clearing,
        private browsing, storage eviction and failures can lose drafts.
      </p>
      <p>
        This is best-effort recovery, not a save or backup guarantee. Recent edits and unfinished
        IME input may be missing. Restoring opens a dirty copy with no original file path; use Save
        as or Download to keep it. Downloads do not automatically delete drafts.
      </p>
      <p role="status">
        Recovery: {state ? (state.enabled ? "ON" : "OFF") : "Unavailable until storage can be read"}
      </p>
      {!state?.enabled && (
        <>
          <label>
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
            />
            I agree to retain document contents in the local storage described above.
          </label>
          <button
            disabled={!consent}
            onClick={() => receive(store.enable({ acceptLocalContentStorage: true }))}
          >
            Enable local recovery
          </button>
        </>
      )}
      {error && <p role="alert">{error}</p>}
      <ul aria-label="Recovery drafts">
        {state?.drafts.map((draft) => (
          <li key={draft.id}>
            <strong>{draft.fileName}</strong> · Snapshot {new Date(draft.savedAt).toLocaleString()}{" "}
            · Expires {new Date(draft.expiresAt).toLocaleString()} · Identity {draft.id.slice(-8)}
            <button
              onClick={() => {
                const copy = store.restoreCopy(draft.id);
                if (copy.ok) onRestore(copy.value);
                else setError(copy.error);
              }}
            >
              Open recovery copy
            </button>
            <button onClick={() => receive(store.deleteOne(draft.id))}>Delete this draft</button>
          </li>
        ))}
      </ul>
      <div className="modalActions">
        <button onClick={() => receive(store.deleteAll())}>Delete all recovery drafts</button>
        <button onClick={() => receive(store.disable())}>Turn off and delete all drafts</button>
        <button onClick={onClose}>Later</button>
      </div>
    </FeatureDialog>
  );
}
