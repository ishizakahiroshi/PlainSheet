import {
  actionsForHistoryRestore,
  actionsForHistoryUndo,
  applyCollaborationOperation,
  COLLABORATION_LIMITS,
  CollaborationError,
  collaborationId,
  type CollaborationAction,
  type CollaborationOperation,
  type CollaborationSession,
  type CollaborationSnapshot,
  type SharedDocument,
} from "./model";

export type CollaborationStatus =
  "off" | "connecting" | "online" | "offline" | "blocked" | "stopped";
export type CollaborationClientState = {
  status: CollaborationStatus;
  endpoint: string;
  snapshot: CollaborationSnapshot | null;
  memberId: string | null;
  pendingCount: number;
  error: string | null;
};
export type CollaborationInvite = {
  id: string;
  token: string;
  roomId: string;
  role: "editor" | "viewer";
  expiresAt: number;
};
export type CollaborationClientOptions = {
  endpoint?: string;
  fetch?: typeof globalThis.fetch;
  /** Non-browser integration clients supply an explicitly allowed Origin. Browsers set their own. */
  origin?: string;
  timeoutMs?: number;
};
export type CollaborationEnqueueOptions = { expectedRevision?: number };

export function validateCollaborationEndpoint(endpoint: string): string {
  if (!endpoint.trim())
    throw new CollaborationError(
      "endpoint-required",
      "Choose your self-hosted relay before sharing.",
    );
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    throw new CollaborationError("invalid-endpoint", "Enter a valid relay URL.");
  }
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.protocol !== "https:" && !(url.protocol === "http:" && loopback))
  ) {
    throw new CollaborationError(
      "unsafe-endpoint",
      "Remote relays require HTTPS. HTTP is allowed only on loopback; credentials and query parameters are forbidden in the URL.",
    );
  }
  return url.href.replace(/\/$/, "");
}

/** Explicit opt-in, bearer-authenticated HTTP provider. Constructing it never connects or stores data. */
export class CollaborationClient {
  private readonly fetcher: typeof globalThis.fetch;
  private readonly origin?: string;
  private readonly timeoutMs: number;
  private state: CollaborationClientState;
  private session: Pick<CollaborationSession, "roomId" | "memberId" | "token"> | null = null;
  private pending: CollaborationOperation[] = [];
  private listeners = new Set<(state: CollaborationClientState) => void>();
  private polling: ReturnType<typeof setTimeout> | undefined;
  private pollInterval = 0;
  private requestTail: Promise<unknown> = Promise.resolve();
  private flushing: Promise<void> | null = null;
  private generation = 0;
  private connected = false;
  private queueBlocked = false;
  private retryAt = 0;

  constructor(options: CollaborationClientOptions = {}) {
    this.fetcher = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.origin = options.origin;
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.state = {
      status: "off",
      endpoint: options.endpoint?.trim() ?? "",
      snapshot: null,
      memberId: null,
      pendingCount: 0,
      error: null,
    };
  }

  getState(): CollaborationClientState {
    return structuredClone(this.state);
  }
  getPendingOperations(): CollaborationOperation[] {
    return structuredClone(this.pending);
  }

  /** Latest server snapshot with this tab's unsent edits projected onto it. */
  getDocument(): SharedDocument | null {
    let document = this.state.snapshot?.document;
    if (!document) return null;
    for (const operation of this.pending) {
      // A sync can observe a committed operation whose ACK was lost. Do not project it twice.
      if (this.state.snapshot?.history.some((entry) => entry.id === operation.id)) continue;
      try {
        const entry = this.state.snapshot?.history.find(
          (candidate) => candidate.id === (operation.undoOf ?? operation.restoreOf),
        );
        const restoreEntry =
          entry && operation.restoreBefore ? { ...entry, actions: entry.inverse } : entry;
        const actions: CollaborationAction[] =
          operation.undoOf && entry
            ? actionsForHistoryUndo(entry, document)
            : operation.restoreOf && restoreEntry
              ? actionsForHistoryRestore(restoreEntry, document)
              : operation.actions;
        if (!actions.length) break;
        document = applyCollaborationOperation(document, {
          ...operation,
          baseRevision: Math.min(operation.baseRevision, document.revision),
          actions,
        }).document;
      } catch {
        // Retain rejected work for review. Later edits may depend on its projected structure.
        break;
      }
    }
    return structuredClone(document);
  }

  subscribe(listener: (state: CollaborationClientState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private update(patch: Partial<CollaborationClientState>) {
    this.state = { ...this.state, ...patch, pendingCount: this.pending.length };
    for (const listener of this.listeners) listener(this.getState());
  }

  private accept(snapshot: CollaborationSnapshot) {
    // Operation ACKs can be replayed; a previously observed revision must never roll back.
    if (
      !this.state.snapshot ||
      snapshot.document.revision >= this.state.snapshot.document.revision
    ) {
      this.update({
        snapshot,
        status: snapshot.stopped ? "stopped" : this.queueBlocked ? "blocked" : "online",
        error: this.queueBlocked ? this.state.error : null,
      });
    }
  }

  private request<T>(
    path: string,
    method = "GET",
    body?: unknown,
    authenticated = true,
  ): Promise<T> {
    const generation = this.generation;
    const run = async (): Promise<T> => {
      if (generation !== this.generation)
        throw new CollaborationError("session-changed", "The sharing session changed.", 409);
      const endpoint = validateCollaborationEndpoint(this.state.endpoint);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const headers: Record<string, string> = {};
        if (body !== undefined) headers["Content-Type"] = "application/json";
        if (this.origin) headers.Origin = this.origin;
        if (authenticated) {
          if (!this.session)
            throw new CollaborationError("no-session", "Start or join sharing first.");
          headers.Authorization = `Bearer ${this.session.token}`;
        }
        const response = await this.fetcher(`${endpoint}${path}`, {
          method,
          headers,
          ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
          signal: controller.signal,
          credentials: "omit",
          cache: "no-store",
          redirect: "error",
          referrerPolicy: "no-referrer",
        });
        const value = await response.json();
        if (generation !== this.generation)
          throw new CollaborationError("session-changed", "The sharing session changed.", 409);
        if (!response.ok) {
          if (response.status === 429)
            this.retryAt =
              Date.now() +
              Math.max(1, Math.min(300, Number(response.headers.get("Retry-After")) || 60)) * 1000;
          throw new CollaborationError(
            String(value.error ?? "request-failed"),
            String(value.message ?? "Sharing request failed."),
            response.status,
          );
        }
        return value as T;
      } catch (error) {
        if (generation === this.generation) {
          const denied =
            error instanceof CollaborationError && [401, 403, 410].includes(error.status);
          const rejectedOperation =
            path.endsWith("/operations") &&
            error instanceof CollaborationError &&
            error.status >= 400 &&
            error.status < 500 &&
            ![408, 429].includes(error.status);
          if (rejectedOperation) this.queueBlocked = true;
          this.update({
            status: denied || rejectedOperation ? "blocked" : "offline",
            error: error instanceof Error ? error.message : "Unable to reach the relay.",
          });
          if (denied) {
            this.connected = false;
            this.stopPolling();
          }
        }
        throw error;
      } finally {
        clearTimeout(timeout);
      }
    };
    const result = this.requestTail.then(run, run);
    this.requestTail = result.catch(() => undefined);
    return result;
  }

  private install(session: CollaborationSession) {
    this.session = { roomId: session.roomId, memberId: session.memberId, token: session.token };
    this.connected = true;
    this.queueBlocked = false;
    this.pending = [];
    this.update({
      snapshot: session.snapshot,
      memberId: session.memberId,
      status: "online",
      error: null,
    });
  }

  async createRoom(rows: string[][], displayName: string): Promise<CollaborationSnapshot> {
    if (this.session || this.state.status === "connecting")
      throw new CollaborationError(
        "session-active",
        "Leave or delete the current sharing session first.",
      );
    validateCollaborationEndpoint(this.state.endpoint);
    this.update({ status: "connecting", error: null });
    const session = await this.request<CollaborationSession>(
      "/rooms",
      "POST",
      { rows, displayName },
      false,
    );
    this.install(session);
    return this.getState().snapshot!;
  }

  async joinRoom(
    roomId: string,
    inviteToken: string,
    displayName: string,
  ): Promise<CollaborationSnapshot> {
    if (this.session || this.state.status === "connecting")
      throw new CollaborationError("session-active", "Leave the current sharing session first.");
    validateCollaborationEndpoint(this.state.endpoint);
    if (!/^[A-Za-z0-9_-]{1,100}$/.test(roomId))
      throw new CollaborationError("invalid-room", "Invalid room ID.");
    this.update({ status: "connecting", error: null });
    const session = await this.request<CollaborationSession>(
      `/rooms/${roomId}/join`,
      "POST",
      { inviteToken, displayName },
      false,
    );
    this.install(session);
    return this.getState().snapshot!;
  }

  private roomPath(suffix = ""): string {
    if (!this.session) throw new CollaborationError("no-session", "Start or join sharing first.");
    return `/rooms/${this.session.roomId}${suffix}`;
  }

  async sync(): Promise<CollaborationSnapshot> {
    const snapshot = await this.request<CollaborationSnapshot>(this.roomPath());
    this.accept(snapshot);
    return this.getState().snapshot!;
  }

  /** Start periodic reads only after the user's explicit create/join action. */
  startPolling(intervalMs = 2_000): void {
    if (!this.session) throw new CollaborationError("no-session", "Start or join sharing first.");
    this.stopPolling();
    this.connected = true;
    this.pollInterval = Math.max(intervalMs, 500);
    const tick = async () => {
      if (!this.connected || !this.pollInterval) return;
      try {
        if (Date.now() >= this.retryAt) {
          await this.sync();
          await this.flush();
        }
      } catch {
        /* The state exposes the error and pending edits remain. */
      }
      if (this.connected && this.pollInterval)
        this.polling = setTimeout(() => {
          void tick();
        }, this.pollInterval);
    };
    this.polling = setTimeout(() => {
      void tick();
    }, this.pollInterval);
  }

  stopPolling(): void {
    if (this.polling) clearTimeout(this.polling);
    this.polling = undefined;
    this.pollInterval = 0;
  }

  /** Keeps credentials and pending changes in memory, never localStorage. No more automatic traffic. */
  disconnect(): void {
    ++this.generation;
    this.connected = false;
    this.stopPolling();
    this.update({ status: this.session ? "offline" : "off" });
  }

  async connect(): Promise<void> {
    this.connected = true;
    this.queueBlocked = false;
    await this.sync();
    await this.flush();
  }

  /** Guard coordinate-derived edits with the exact getDocument() revision used to prepare them. */
  enqueue(actions: CollaborationAction[], options: CollaborationEnqueueOptions = {}): string {
    if (!this.session || !this.state.snapshot)
      throw new CollaborationError("no-session", "Start or join sharing first.");
    const member = this.state.snapshot.members.find(
      (candidate) => candidate.id === this.session!.memberId,
    );
    if (!member?.active || member.role === "viewer" || this.state.snapshot.stopped)
      throw new CollaborationError("read-only", "This sharing session is read-only.", 403);
    const bytes = new TextEncoder().encode(JSON.stringify(actions)).length;
    const pendingBytes = new TextEncoder().encode(JSON.stringify(this.pending)).length;
    if (
      this.pending.length >= COLLABORATION_LIMITS.maxQueuedOperations ||
      bytes + 256 > COLLABORATION_LIMITS.maxOperationBytes ||
      pendingBytes + bytes + 256 > COLLABORATION_LIMITS.maxQueuedBytes
    ) {
      throw new CollaborationError(
        "queue-limit",
        "This edit exceeds the bounded sharing queue. Reconnect or save a local copy before making more changes.",
        413,
      );
    }
    const operation: CollaborationOperation = {
      id: collaborationId(),
      baseRevision: this.state.snapshot.document.revision,
      actions: structuredClone(actions),
      ...(options.expectedRevision !== undefined
        ? { expectedRevision: options.expectedRevision }
        : {}),
    };
    const document = this.getDocument()!;
    applyCollaborationOperation(document, operation); // Fail malformed local operations before queueing.
    this.pending.push(operation);
    this.update({ error: null });
    return operation.id;
  }

  async submit(
    actions: CollaborationAction[],
    options: CollaborationEnqueueOptions = {},
  ): Promise<string> {
    const id = this.enqueue(actions, options);
    if (this.connected) await this.flush();
    return id;
  }

  flush(): Promise<void> {
    if (this.flushing) return this.flushing;
    const run = async () => {
      if (!this.connected || this.queueBlocked || Date.now() < this.retryAt) return;
      while (this.pending.length && this.connected && !this.queueBlocked) {
        const operation = this.pending[0];
        const result = await this.request<{ snapshot: CollaborationSnapshot }>(
          this.roomPath("/operations"),
          "POST",
          operation,
        );
        // Only ACKed operations are removed. A lost response is resent with the same ID and payload.
        this.pending = this.pending.filter((candidate) => candidate.id !== operation.id);
        this.accept(result.snapshot);
      }
    };
    this.flushing = run().finally(() => {
      this.flushing = null;
    });
    return this.flushing;
  }

  /** Explicitly abandon a rejected local operation after reviewing/exporting it. */
  discardPending(operationId: string): void {
    if (this.flushing)
      throw new CollaborationError(
        "send-in-progress",
        "Wait for the current send to finish before discarding.",
        409,
      );
    const wasBlocked = this.pending[0]?.id === operationId;
    this.pending = this.pending.filter((operation) => operation.id !== operationId);
    if (wasBlocked) this.queueBlocked = false;
    this.update({
      error: null,
      ...(this.connected && !this.queueBlocked ? { status: "online" as const } : {}),
    });
  }

  private async historyOperation(
    id: string,
    kind: "undoOf" | "restoreOf",
    restoreBefore = false,
  ): Promise<string> {
    if (!this.state.snapshot)
      throw new CollaborationError("no-session", "Start or join sharing first.");
    if (this.pending.length)
      throw new CollaborationError(
        "pending-edits",
        "Sync or review pending edits before restoring history.",
        409,
      );
    const operation: CollaborationOperation = {
      id: collaborationId(),
      baseRevision: this.state.snapshot.document.revision,
      actions: [],
      [kind]: id,
      ...(restoreBefore ? { restoreBefore: true } : {}),
    };
    this.pending.push(operation);
    this.update({ error: null });
    if (this.connected) await this.flush();
    return operation.id;
  }

  undo(operationId: string): Promise<string> {
    return this.historyOperation(operationId, "undoOf");
  }
  restore(operationId: string, before = false): Promise<string> {
    return this.historyOperation(operationId, "restoreOf", before);
  }
  invite(role: "editor" | "viewer"): Promise<CollaborationInvite> {
    return this.request(this.roomPath("/invites"), "POST", { role });
  }
  revokeInvite(inviteId: string): Promise<{ revoked: true }> {
    return this.request(this.roomPath(`/invites/${encodeURIComponent(inviteId)}`), "DELETE");
  }

  async revoke(memberId: string): Promise<void> {
    this.accept(
      await this.request<CollaborationSnapshot>(
        this.roomPath(`/members/${encodeURIComponent(memberId)}`),
        "DELETE",
      ),
    );
  }

  async stop(): Promise<void> {
    this.accept(await this.request<CollaborationSnapshot>(this.roomPath("/stop"), "POST", {}));
    this.connected = false;
    this.stopPolling();
  }

  async leave(): Promise<void> {
    await this.request(this.roomPath("/leave"), "POST", {});
    this.forget();
  }

  async deleteRoom(): Promise<void> {
    await this.request(this.roomPath(), "DELETE");
    this.forget();
  }

  /** Call only after warning about this tab's pending queue. Cannot delete copies on other devices. */
  forget(): void {
    ++this.generation;
    this.connected = false;
    this.stopPolling();
    this.session = null;
    this.pending = [];
    this.queueBlocked = false;
    this.retryAt = 0;
    this.update({ status: "off", snapshot: null, memberId: null, error: null });
  }

  dispose(): void {
    this.disconnect();
    this.listeners.clear();
  }
}
