import { useEffect, useId, useRef, useState } from "react";
import {
  CollaborationClient,
  type CollaborationAction,
  type CollaborationClientState,
  type CollaborationInvite,
} from "../lib/collaboration";
import { FeatureDialog } from "./FeatureDialog";

export type SharingPanelProps = {
  rows: string[][];
  client: CollaborationClient | null;
  state: CollaborationClientState | null;
  onConnected: (client: CollaborationClient, mode: "create" | "join") => void;
  onDetached: () => void;
  onClose: () => void;
};

type Confirmation = { title: string; detail: string; action: () => void | Promise<void> };

function describeAction(action: CollaborationAction): string {
  if (action.type === "set-cell")
    return `Cell ${action.rowId} / ${action.columnId}: ${action.value.length > 160 ? `${action.value.slice(0, 160)}…` : action.value || "(empty)"}`;
  if (action.type === "reorder") return `Reorder ${action.axis}s: ${action.ids.length} stable IDs`;
  if (action.type === "insert")
    return `Insert ${action.axis} ${action.id} after ${action.afterId ?? "start"}`;
  return `${action.type === "delete" ? "Delete" : "Restore"} ${action.axis} ${action.id}`;
}

export function SharingPanel({
  rows,
  client,
  state,
  onConnected,
  onDetached,
  onClose,
}: SharingPanelProps) {
  const [endpoint, setEndpoint] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [mode, setMode] = useState<"create" | "join">("create");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<CollaborationInvite | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const pendingClient = useRef<CollaborationClient | null>(null);
  const mounted = useRef(true);
  const busyRef = useRef(false);
  const confirmId = useId();
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      pendingClient.current?.forget();
    };
  }, []);
  const snapshot = state?.snapshot ?? null;
  const member = snapshot?.members.find((candidate) => candidate.id === state?.memberId);
  const owner = member?.role === "owner";
  const writable =
    member?.active && member.role !== "viewer" && !snapshot?.stopped && state?.status !== "blocked";
  const pending = client?.getPendingOperations() ?? [];

  async function run(action: () => void | Promise<void>) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      await action();
      if (mounted.current) setConfirmation(null);
    } catch (failure) {
      if (mounted.current)
        setError(failure instanceof Error ? failure.message : "Sharing request failed.");
    } finally {
      busyRef.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  function close() {
    if (busyRef.current) {
      setError("Wait for the current sharing request to finish before closing.");
      return;
    }
    onClose();
  }

  async function begin() {
    const candidate = new CollaborationClient({ endpoint });
    pendingClient.current = candidate;
    try {
      if (mode === "create") await candidate.createRoom(rows, displayName);
      else await candidate.joinRoom(roomId.trim(), inviteToken.trim(), displayName);
      if (!mounted.current) {
        candidate.forget();
        return;
      }
      pendingClient.current = null;
      setInviteToken("");
      onConnected(candidate, mode);
    } catch (failure) {
      candidate.forget();
      pendingClient.current = null;
      throw failure;
    }
  }

  const ask = (title: string, detail: string, action: () => void | Promise<void>) => {
    setError(null);
    setConfirmation({ title, detail, action });
  };

  return (
    <FeatureDialog title="Share this table" onClose={close}>
      <p>
        Sharing is optional. Local editing and ordinary file saving stay separate. No relay is
        selected or contacted until you explicitly start or join.
      </p>
      <p>
        Shared raw cell values, including formulas, and your chosen display name go to the selected
        relay and permitted participants. The relay operator can read them. Remote access requires
        HTTPS; HTTP is limited to loopback.
      </p>
      <p>
        The relay keeps content in memory for up to 24 hours and the latest 100 history entries.
        Restarting it loses the room. This tab's credentials and unsent queue are also lost on
        reload or close. Save a local copy when needed. Stopping or deleting sharing cannot erase
        copies participants already received.
      </p>
      {(error || state?.error) && <p role="alert">{error || state?.error}</p>}
      {busy && <p role="status">Sharing request in progress…</p>}
      {confirmation ? (
        <fieldset disabled={busy} aria-labelledby={confirmId}>
          <legend id={confirmId}>{confirmation.title}</legend>
          <p>{confirmation.detail}</p>
          <button
            onClick={() => {
              void run(confirmation.action);
            }}
          >
            Confirm {confirmation.title.toLowerCase()}
          </button>
          <button
            onClick={() => {
              setConfirmation(null);
              setError(null);
            }}
          >
            Cancel
          </button>
        </fieldset>
      ) : !client || !snapshot ? (
        <fieldset disabled={busy}>
          <legend>Sharing is OFF</legend>
          <label>
            Relay endpoint{" "}
            <input
              type="url"
              value={endpoint}
              onChange={(event) => {
                setEndpoint(event.target.value);
                setConsent(false);
              }}
              placeholder="Enter your self-hosted relay URL"
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <label>
            Display name{" "}
            <input
              value={displayName}
              maxLength={80}
              onChange={(event) => {
                setDisplayName(event.target.value);
                setConsent(false);
              }}
              autoComplete="off"
            />
          </label>
          <label>
            Sharing action{" "}
            <select
              value={mode}
              onChange={(event) => {
                setMode(event.target.value as "create" | "join");
                setConsent(false);
              }}
            >
              <option value="create">Create a room for this table</option>
              <option value="join">Join an existing room as a new document</option>
            </select>
          </label>
          {mode === "join" && (
            <>
              <label>
                Room ID{" "}
                <input
                  value={roomId}
                  onChange={(event) => {
                    setRoomId(event.target.value);
                    setConsent(false);
                  }}
                  autoComplete="off"
                  spellCheck={false}
                />
              </label>
              <label>
                Single-use invitation token{" "}
                <input
                  type="password"
                  value={inviteToken}
                  onChange={(event) => {
                    setInviteToken(event.target.value);
                    setConsent(false);
                  }}
                  autoComplete="off"
                  spellCheck={false}
                />
              </label>
            </>
          )}
          <p>
            {mode === "create"
              ? `This action uploads this table's ${rows.length} rows to ${endpoint || "the endpoint you enter"}.`
              : `This action sends your display name and invitation token to ${endpoint || "the endpoint you enter"} and downloads the shared table into a new document.`}
          </p>
          <label>
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
            />{" "}
            I understand the destination, access and retention limits and want to{" "}
            {mode === "create" ? "upload this table" : "join this room"}.
          </label>
          <button
            disabled={
              !consent ||
              !endpoint.trim() ||
              !displayName.trim() ||
              (mode === "join" && (!roomId.trim() || !inviteToken.trim()))
            }
            onClick={() => {
              void run(begin);
            }}
          >
            {mode === "create" ? "Start sharing" : "Join room"}
          </button>
        </fieldset>
      ) : (
        <fieldset disabled={busy}>
          <legend>Room {snapshot.roomId}</legend>
          <p role="status">
            {state?.status ?? "off"} · Your permission: {member?.role ?? "unknown"} · Revision{" "}
            {snapshot.document.revision} · Pending operations: {pending.length}
          </p>
          <p>
            Destination: {state?.endpoint}. Expiry: {new Date(snapshot.expiresAt).toLocaleString()}.
            Retained history: {snapshot.history.length}/{snapshot.retention.maxHistory}; room
            operation limit: {snapshot.retention.maxOperations}. Local file saving is still your
            responsibility.
          </p>
          {!snapshot.stopped && (
            <div>
              <button
                onClick={() => {
                  client.disconnect();
                }}
              >
                Disconnect
              </button>
              <button
                onClick={() => {
                  void run(async () => {
                    await client.connect();
                    client.startPolling();
                  });
                }}
              >
                Reconnect and retry pending
              </button>
              <button
                onClick={() => {
                  void run(async () => {
                    await client.sync();
                  });
                }}
              >
                Refresh room
              </button>
            </div>
          )}
          <h3>Participants</h3>
          <ul>
            {snapshot.members.map((participant) => (
              <li key={participant.id}>
                {participant.displayName} · {participant.role} ·{" "}
                {participant.active ? "active" : "left or revoked"}
                {participant.id === state?.memberId ? " (you)" : ""}
                {owner && participant.active && participant.role !== "owner" && (
                  <button
                    onClick={() =>
                      ask(
                        "Revoke participant",
                        `Revoke ${participant.displayName} (${participant.id})? Their future reads and writes will be denied. Copies already received cannot be erased.`,
                        async () => {
                          await client.revoke(participant.id);
                        },
                      )
                    }
                  >
                    Revoke {participant.displayName}
                  </button>
                )}
              </li>
            ))}
          </ul>
          {owner && !snapshot.stopped && (
            <>
              <h3>Invitations</h3>
              <p>
                Invitation tokens grant access to this table. Share a token only with the intended
                person. Each is single-use and expires within ten minutes.
              </p>
              {(["editor", "viewer"] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    void run(async () => {
                      setInvitation(await client.invite(role));
                      await client.sync();
                    });
                  }}
                >
                  Create {role} invitation
                </button>
              ))}
              {invitation && (
                <section aria-label="New invitation">
                  <p>
                    {invitation.role} invitation expires{" "}
                    {new Date(invitation.expiresAt).toLocaleString()}. This token is displayed only
                    here; closing this dialog hides it.
                  </p>
                  <label>
                    Invitation room ID{" "}
                    <input
                      readOnly
                      value={invitation.roomId}
                      onFocus={(event) => event.target.select()}
                    />
                  </label>
                  <label>
                    Invitation token{" "}
                    <input
                      readOnly
                      value={invitation.token}
                      autoComplete="off"
                      spellCheck={false}
                      onFocus={(event) => event.target.select()}
                    />
                  </label>
                  <button onClick={() => setInvitation(null)}>Hide invitation token</button>
                </section>
              )}
              <ul>
                {snapshot.invites.map((invite) => (
                  <li key={invite.id}>
                    {invite.role} · {invite.id} · expires{" "}
                    {new Date(invite.expiresAt).toLocaleString()}
                    <button
                      onClick={() =>
                        ask(
                          "Revoke invitation",
                          `Disable invitation ${invite.id}? It will no longer allow joining.`,
                          async () => {
                            await client.revokeInvite(invite.id);
                            if (invitation?.id === invite.id) setInvitation(null);
                            await client.sync();
                          },
                        )
                      }
                    >
                      Revoke invitation {invite.id}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
          {!!pending.length && (
            <section aria-label="Pending operations">
              <h3>Unsent or unacknowledged operations</h3>
              <p>
                Keep this tab open. A failed acknowledgement may mean an operation already reached
                the relay; reconnect resends its same ID safely. Review rejected changes before
                discarding. Discarding local work does not undo an operation already accepted by the
                relay.
              </p>
              <ul>
                {pending.map((operation) => (
                  <li key={operation.id}>
                    <details>
                      <summary>
                        {operation.id} · {operation.actions.length} actions
                        {operation.undoOf
                          ? ` · undo ${operation.undoOf}`
                          : operation.restoreOf
                            ? ` · restore ${operation.restoreOf}`
                            : ""}
                      </summary>
                      <ul>
                        {operation.actions.slice(0, 10).map((action, index) => (
                          <li key={index}>{describeAction(action)}</li>
                        ))}
                      </ul>
                      {operation.actions.length > 10 && (
                        <p>
                          {operation.actions.length - 10} additional actions in this atomic
                          operation.
                        </p>
                      )}
                    </details>
                    <button
                      onClick={() =>
                        ask(
                          "Discard pending operation",
                          `Discard local queued operation ${operation.id}? Its unsent changes will be lost from this tab. This does not undo changes already accepted by the relay.`,
                          () => {
                            client.discardPending(operation.id);
                          },
                        )
                      }
                    >
                      Discard {operation.id}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <h3>Retained history and conflicts</h3>
          <p>
            Undo is conditional and only applies to your own changes. Restoring before or after
            creates a new edit and can replace more recent values. Structure that changed meanwhile
            can require manual review.
          </p>
          {!snapshot.history.length && <p>No shared edits yet.</p>}
          <ol>
            {[...snapshot.history].reverse().map((entry) => (
              <li key={entry.id}>
                <details>
                  <summary>
                    Revision {entry.revision} · {entry.displayName} · {entry.id} ·{" "}
                    {entry.conflicts.length} conflicts
                  </summary>
                  <p>
                    {new Date(entry.timestamp).toLocaleString()} · {entry.actions.length} actions
                  </p>
                  <ul>
                    {entry.actions.slice(0, 10).map((action, index) => (
                      <li key={index}>{describeAction(action)}</li>
                    ))}
                  </ul>
                  {entry.actions.length > 10 && (
                    <p>{entry.actions.length - 10} additional actions in this atomic operation.</p>
                  )}
                  {entry.conflicts.map((conflict, index) => (
                    <p key={index}>
                      {conflict.kind}: previous “{conflict.previousValue.slice(0, 160)}”; new “
                      {conflict.value.slice(0, 160)}”
                    </p>
                  ))}
                  <div>
                    {entry.memberId === state?.memberId && (
                      <button
                        disabled={!writable || !!pending.length}
                        onClick={() => {
                          void run(async () => {
                            await client.undo(entry.id);
                          });
                        }}
                      >
                        Undo revision {entry.revision}
                      </button>
                    )}
                    <button
                      disabled={!writable || !!pending.length}
                      onClick={() =>
                        ask(
                          "Restore before revision",
                          `Restore the values/structure before revision ${entry.revision} (${entry.id}) as a new operation? This may replace newer edits.`,
                          async () => {
                            await client.restore(entry.id, true);
                          },
                        )
                      }
                    >
                      Restore before {entry.revision}
                    </button>
                    <button
                      disabled={!writable || !!pending.length}
                      onClick={() =>
                        ask(
                          "Restore after revision",
                          `Restore the values/structure written by revision ${entry.revision} (${entry.id}) as a new operation? This may replace newer edits.`,
                          async () => {
                            await client.restore(entry.id);
                          },
                        )
                      }
                    >
                      Restore after {entry.revision}
                    </button>
                  </div>
                </details>
              </li>
            ))}
          </ol>
          <h3>End this session</h3>
          {owner ? (
            <>
              {!snapshot.stopped && (
                <button
                  onClick={() =>
                    ask(
                      "Stop sharing",
                      `Stop room ${snapshot.roomId}? All invitations and non-owner access will be revoked. ${pending.length} local pending operations may remain unsent. The relay retains this room until its expiry or deletion. Existing copies cannot be erased.`,
                      async () => {
                        await client.stop();
                        setInvitation(null);
                      },
                    )
                  }
                >
                  Stop sharing
                </button>
              )}
              <button
                onClick={() =>
                  ask(
                    "Delete shared room",
                    `Permanently delete room ${snapshot.roomId} and its relay history now? All participants lose access. ${pending.length} local pending operations and this tab's credentials will be discarded. Save a local copy first if needed. Copies already received by others remain.`,
                    async () => {
                      await client.deleteRoom();
                      onDetached();
                    },
                  )
                }
              >
                Delete shared room
              </button>
            </>
          ) : (
            <button
              onClick={() =>
                ask(
                  "Leave room",
                  `Leave room ${snapshot.roomId}? Your access will be revoked and ${pending.length} pending operations will be discarded from this tab. The relay and other participants keep their copies. Save a local copy first if needed.`,
                  async () => {
                    await client.leave();
                    onDetached();
                  },
                )
              }
            >
              Leave room
            </button>
          )}
          <button
            onClick={() =>
              ask(
                "Forget local session",
                `Forget this tab's credentials and ${pending.length} pending operations? This only disconnects this tab; the relay room and its access remain until revoked or expired. Use leave/stop/delete when available. Save your local copy first.`,
                () => {
                  client.forget();
                  onDetached();
                },
              )
            }
          >
            Forget local session
          </button>
        </fieldset>
      )}
      <div className="modalActions">
        <button disabled={busy} onClick={close}>
          Close
        </button>
      </div>
    </FeatureDialog>
  );
}
