import { createHash, randomBytes } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import {
  actionsForHistoryRestore,
  actionsForHistoryUndo,
  applyCollaborationOperation,
  COLLABORATION_LIMITS,
  CollaborationError,
  collaborationId,
  createSharedDocument,
  validId,
  validateOperation,
  type CollaborationHistoryEntry,
  type CollaborationMember,
  type CollaborationSnapshot,
} from "../src/lib/collaboration/model";

type Member = CollaborationMember & { tokenHash: string };
type Invite = { id: string; role: "editor" | "viewer"; expiresAt: number; tokenHash: string };
type Receipt = { memberId: string; fingerprint: string; revision: number };
type Room = {
  snapshot: CollaborationSnapshot;
  members: Map<string, Member>;
  invites: Map<string, Invite>;
  receipts: Map<string, Receipt>;
};

export type RelayOptions = {
  /** Exact browser origins only. Wildcard and the opaque "null" origin are forbidden. */
  allowedOrigins: string[];
  retentionMs?: number;
  inviteLifetimeMs?: number;
  maxRooms?: number;
  maxBodyBytes?: number;
  requestsPerMinute?: number;
  now?: () => number;
};

const secret = () => randomBytes(32).toString("base64url");
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** No listening socket is opened until the caller explicitly invokes server.listen(). */
export function createCollaborationRelay(options: RelayOptions) {
  if (
    !options.allowedOrigins.length ||
    options.allowedOrigins.some(
      (origin) =>
        origin === "null" ||
        origin.includes("*") ||
        !/^(https?:\/\/[^/?#]+|tauri:\/\/localhost)$/.test(origin),
    )
  ) {
    throw new Error(
      "Configure exact allowed origins; wildcard, opaque, path and empty origins are forbidden.",
    );
  }
  const origins = new Set(options.allowedOrigins);
  const now = options.now ?? Date.now;
  const retentionMs = Math.min(options.retentionMs ?? 24 * 60 * 60 * 1000, 24 * 60 * 60 * 1000);
  const inviteLifetimeMs = Math.min(options.inviteLifetimeMs ?? 10 * 60 * 1000, 10 * 60 * 1000);
  const maxRooms = Math.min(options.maxRooms ?? 16, 32);
  const maxBodyBytes = Math.min(options.maxBodyBytes ?? 1024 * 1024, 4 * 1024 * 1024);
  const requestsPerMinute = options.requestsPerMinute ?? 600;
  if (
    [retentionMs, inviteLifetimeMs, maxRooms, maxBodyBytes, requestsPerMinute].some(
      (value) => !Number.isSafeInteger(value) || value < 1,
    )
  ) {
    throw new Error("Relay limits must be positive bounded integers.");
  }
  const rooms = new Map<string, Room>();
  const rates = new Map<string, { count: number; resetsAt: number }>();

  function purge() {
    for (const [id, room] of rooms) {
      if (room.snapshot.expiresAt <= now()) rooms.delete(id);
      else
        for (const [inviteId, invite] of room.invites)
          if (invite.expiresAt <= now()) room.invites.delete(inviteId);
    }
    for (const [ip, rate] of rates) if (rate.resetsAt <= now()) rates.delete(ip);
  }
  const timer = setInterval(purge, Math.min(retentionMs, 30_000));
  timer.unref();

  function snapshot(room: Room): CollaborationSnapshot {
    return {
      ...room.snapshot,
      members: [...room.members.values()].map(({ id, displayName, role, active }) => ({
        id,
        displayName,
        role,
        active,
      })),
      invites: [...room.invites.values()].map(({ id, role, expiresAt }) => ({
        id,
        role,
        expiresAt,
      })),
    };
  }

  function name(value: unknown): string {
    if (
      typeof value !== "string" ||
      !value.trim() ||
      value.length > 80 ||
      [...value].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)
    ) {
      throw new CollaborationError("invalid-name", "Use a display name of 1–80 characters.");
    }
    return value.trim();
  }

  function memberFor(request: IncomingMessage, room: Room): Member {
    const authorization = request.headers.authorization;
    if (!authorization || !/^Bearer [A-Za-z0-9_-]{43}$/.test(authorization)) {
      throw new CollaborationError("unauthorized", "Membership credentials are required.", 401);
    }
    const tokenHash = hash(authorization.slice(7));
    const member = [...room.members.values()].find(
      (candidate) => candidate.active && candidate.tokenHash === tokenHash,
    );
    if (!member)
      throw new CollaborationError(
        "revoked",
        "Membership was revoked or you have left the room.",
        403,
      );
    return member;
  }

  function ownerOnly(member: Member) {
    if (member.role !== "owner")
      throw new CollaborationError("owner-required", "Only the owner can manage this room.", 403);
  }

  async function body(request: IncomingMessage): Promise<Record<string, unknown>> {
    if (!request.headers["content-type"]?.startsWith("application/json"))
      throw new CollaborationError("content-type", "Send application/json.", 415);
    const declared = Number(request.headers["content-length"]);
    if (declared > maxBodyBytes)
      throw new CollaborationError("body-limit", "Request is too large.", 413);
    const chunks: Buffer[] = [];
    let bytes = 0;
    for await (const chunk of request) {
      bytes += chunk.length;
      if (bytes > maxBodyBytes)
        throw new CollaborationError("body-limit", "Request is too large.", 413);
      chunks.push(Buffer.from(chunk));
    }
    let value: unknown;
    try {
      value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      throw new CollaborationError("invalid-json", "Invalid JSON body.");
    }
    if (!record(value)) throw new CollaborationError("invalid-body", "An object body is required.");
    return value;
  }

  function send(response: ServerResponse, status: number, value: unknown) {
    response.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(JSON.stringify(value));
  }

  const server = createServer(async (request, response) => {
    try {
      purge();
      const origin = request.headers.origin;
      if (!origin || !origins.has(origin))
        throw new CollaborationError("origin-denied", "This browser origin is not allowed.", 403);
      response.setHeader("Access-Control-Allow-Origin", origin);
      response.setHeader("Vary", "Origin");
      response.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
      response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
      response.setHeader("Access-Control-Max-Age", "300");
      if (request.method === "OPTIONS") {
        response.writeHead(204);
        response.end();
        return;
      }
      const ip = request.socket.remoteAddress ?? "unknown";
      let rate = rates.get(ip);
      if (!rate) {
        if (rates.size >= 1024) throw new CollaborationError("rate-limit", "Relay is busy.", 429);
        rate = { count: 0, resetsAt: now() + 60_000 };
        rates.set(ip, rate);
      }
      if (++rate.count > requestsPerMinute) {
        response.setHeader("Retry-After", "60");
        throw new CollaborationError("rate-limit", "Too many requests; retry later.", 429);
      }
      // No query parameters: credentials must never appear in URLs or access logs.
      if (!request.url || request.url.includes("?") || request.url.includes("#"))
        throw new CollaborationError("invalid-path", "Query parameters are not accepted.");
      const parts = request.url.split("/").filter(Boolean);
      if (parts[0] !== "rooms") throw new CollaborationError("not-found", "Unknown route.", 404);

      if (parts.length === 1 && request.method === "POST") {
        const input = await body(request);
        // Recheck after awaiting the body: limits and revocation must be evaluated at commit time.
        purge();
        if (rooms.size >= maxRooms)
          throw new CollaborationError("room-limit", "Relay room capacity reached.", 429);
        const displayName = name(input.displayName);
        const document = createSharedDocument(input.rows);
        const roomId = collaborationId();
        const memberId = collaborationId();
        const token = secret();
        const member: Member = {
          id: memberId,
          role: "owner",
          active: true,
          displayName,
          tokenHash: hash(token),
        };
        const room: Room = {
          snapshot: {
            roomId,
            document,
            members: [],
            invites: [],
            history: [],
            stopped: false,
            expiresAt: now() + retentionMs,
            retention: {
              maxHistory: COLLABORATION_LIMITS.maxHistory,
              maxOperations: COLLABORATION_LIMITS.maxOperations,
              maxCells: COLLABORATION_LIMITS.maxCells,
            },
          },
          members: new Map([[memberId, member]]),
          invites: new Map(),
          receipts: new Map(),
        };
        rooms.set(roomId, room);
        send(response, 201, { roomId, memberId, token, snapshot: snapshot(room) });
        return;
      }
      if (!validId(parts[1])) throw new CollaborationError("not-found", "Unknown room.", 404);
      // Read request fully before authentication and mutations. Afterwards the synchronous critical
      // section serializes operations, so revoke/stop/delete cannot race a previously authorized write.
      const input = request.method === "POST" ? await body(request) : {};
      purge();
      const room = rooms.get(parts[1]);
      if (!room) throw new CollaborationError("room-gone", "The room expired or was deleted.", 410);

      if (parts.length === 3 && parts[2] === "join" && request.method === "POST") {
        if (room.snapshot.stopped)
          throw new CollaborationError("stopped", "Sharing has stopped.", 410);
        if (typeof input.inviteToken !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(input.inviteToken))
          throw new CollaborationError("invalid-invite", "Invalid invitation.", 403);
        const tokenHash = hash(input.inviteToken);
        const invite = [...room.invites.values()].find(
          (candidate) => candidate.tokenHash === tokenHash && candidate.expiresAt > now(),
        );
        if (!invite)
          throw new CollaborationError(
            "invalid-invite",
            "The invitation expired, was revoked or has already been used.",
            403,
          );
        const displayName = name(input.displayName);
        if (room.members.size >= 64)
          throw new CollaborationError("member-limit", "Membership capacity reached.", 429);
        const token = secret();
        const member: Member = {
          id: collaborationId(),
          displayName,
          role: invite.role,
          active: true,
          tokenHash: hash(token),
        };
        room.members.set(member.id, member);
        room.invites.delete(invite.id);
        send(response, 201, {
          roomId: parts[1],
          memberId: member.id,
          token,
          snapshot: snapshot(room),
        });
        return;
      }
      const member = memberFor(request, room);
      if (parts.length === 2 && request.method === "GET") {
        send(response, 200, snapshot(room));
        return;
      }
      if (parts.length === 2 && request.method === "DELETE") {
        ownerOnly(member);
        rooms.delete(parts[1]);
        send(response, 200, { deleted: true });
        return;
      }
      if (parts.length === 3 && parts[2] === "stop" && request.method === "POST") {
        ownerOnly(member);
        room.snapshot.stopped = true;
        room.invites.clear();
        for (const candidate of room.members.values())
          if (candidate.role !== "owner") {
            candidate.active = false;
            candidate.tokenHash = "";
          }
        send(response, 200, snapshot(room));
        return;
      }
      if (parts.length === 3 && parts[2] === "leave" && request.method === "POST") {
        if (member.role === "owner")
          throw new CollaborationError(
            "owner-leave",
            "The owner must stop or delete sharing first.",
            409,
          );
        member.active = false;
        member.tokenHash = "";
        send(response, 200, { left: true });
        return;
      }
      if (parts.length === 4 && parts[2] === "members" && request.method === "DELETE") {
        ownerOnly(member);
        const target = room.members.get(parts[3]);
        if (!target) throw new CollaborationError("not-found", "Unknown member.", 404);
        if (target.role === "owner")
          throw new CollaborationError(
            "owner-revoke",
            "The owner must stop or delete sharing.",
            409,
          );
        target.active = false;
        target.tokenHash = "";
        send(response, 200, snapshot(room));
        return;
      }
      if (parts.length === 4 && parts[2] === "invites" && request.method === "DELETE") {
        ownerOnly(member);
        room.invites.delete(parts[3]);
        send(response, 200, { revoked: true });
        return;
      }
      if (room.snapshot.stopped)
        throw new CollaborationError(
          "stopped",
          "Sharing has stopped; save a local copy or delete the room.",
          410,
        );
      if (parts.length === 3 && parts[2] === "invites" && request.method === "POST") {
        ownerOnly(member);
        if (input.role !== "editor" && input.role !== "viewer")
          throw new CollaborationError("invalid-role", "Invite an editor or viewer.");
        if (room.invites.size >= 32)
          throw new CollaborationError("invite-limit", "Invitation capacity reached.", 429);
        const token = secret();
        const invite: Invite = {
          id: collaborationId(),
          tokenHash: hash(token),
          role: input.role,
          expiresAt: Math.min(now() + inviteLifetimeMs, room.snapshot.expiresAt),
        };
        room.invites.set(invite.id, invite);
        send(response, 201, {
          id: invite.id,
          token,
          role: invite.role,
          expiresAt: invite.expiresAt,
          roomId: parts[1],
        });
        return;
      }
      if (parts.length === 3 && parts[2] === "operations" && request.method === "POST") {
        if (member.role === "viewer")
          throw new CollaborationError("read-only", "Viewers cannot edit or restore history.", 403);
        validateOperation(input);
        const fingerprint = hash(JSON.stringify(input));
        const receipt = room.receipts.get(input.id);
        // ACK replay precedes every revision/history precondition: the original payload may
        // already have committed, including after its retained history entry has expired.
        if (receipt) {
          if (receipt.memberId !== member.id || receipt.fingerprint !== fingerprint)
            throw new CollaborationError(
              "id-reused",
              "This operation ID was used for a different operation.",
              409,
            );
          send(response, 200, {
            revision: receipt.revision,
            replayed: true,
            snapshot: snapshot(room),
          });
          return;
        }
        if (room.receipts.size >= COLLABORATION_LIMITS.maxOperations)
          throw new CollaborationError(
            "operation-limit",
            "This room reached its operation limit; save a local copy and start a new room.",
            413,
          );
        const target = input.undoOf ?? input.restoreOf;
        let operation = input;
        if (target) {
          if (input.actions.length)
            throw new CollaborationError(
              "invalid-history-operation",
              "History operations are generated by the server.",
            );
          const entry = room.snapshot.history.find((candidate) => candidate.id === target);
          if (!entry)
            throw new CollaborationError(
              "history-expired",
              "This history entry is no longer retained.",
              409,
            );
          if (input.undoOf && entry.memberId !== member.id)
            throw new CollaborationError(
              "undo-owner",
              "Undo only your own changes; use explicit history restore for other entries.",
              403,
            );
          const restoreEntry = input.restoreBefore ? { ...entry, actions: entry.inverse } : entry;
          operation = {
            ...input,
            actions: input.undoOf
              ? actionsForHistoryUndo(entry, room.snapshot.document)
              : actionsForHistoryRestore(restoreEntry, room.snapshot.document),
          };
          if (!operation.actions.length)
            throw new CollaborationError(
              "nothing-to-restore",
              "This operation made no reversible change.",
              409,
            );
        }
        const applied = applyCollaborationOperation(room.snapshot.document, operation);
        const entry: CollaborationHistoryEntry = {
          id: input.id,
          revision: applied.document.revision,
          memberId: member.id,
          displayName: member.displayName,
          timestamp: now(),
          actions: operation.actions,
          inverse: applied.inverse,
          conflicts: applied.conflicts,
          ...(input.expectedRevision !== undefined
            ? { expectedRevision: input.expectedRevision }
            : {}),
          ...(input.undoOf ? { undoOf: input.undoOf } : {}),
          ...(input.restoreOf ? { restoreOf: input.restoreOf } : {}),
          ...(input.restoreBefore ? { restoreBefore: true } : {}),
        };
        const history = [...room.snapshot.history, entry].slice(-COLLABORATION_LIMITS.maxHistory);
        if (
          Buffer.byteLength(JSON.stringify({ document: applied.document, history })) >
          COLLABORATION_LIMITS.maxRoomBytes
        ) {
          throw new CollaborationError(
            "history-limit",
            "Room retention capacity reached; save a local copy.",
            413,
          );
        }
        room.snapshot.document = applied.document;
        room.snapshot.history = history;
        room.receipts.set(input.id, { memberId: member.id, fingerprint, revision: entry.revision });
        send(response, 200, {
          revision: entry.revision,
          replayed: false,
          snapshot: snapshot(room),
        });
        return;
      }
      throw new CollaborationError("not-found", "Unknown route.", 404);
    } catch (error) {
      if (response.destroyed || response.writableEnded) return;
      const known = error instanceof CollaborationError;
      send(response, known ? error.status : 500, {
        error: known ? error.code : "relay-error",
        message: known ? error.message : "The relay could not process this request.",
      });
    }
  });
  server.requestTimeout = 15_000;
  server.headersTimeout = 10_000;
  server.keepAliveTimeout = 5_000;
  server.maxHeadersCount = 30;
  server.on("close", () => {
    clearInterval(timer);
    rooms.clear();
    rates.clear();
  });
  return { server, purge, roomCount: () => rooms.size };
}
