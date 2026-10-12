import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SharingPanel } from "../components/SharingPanel";
import {
  CollaborationClient,
  createSharedDocument,
  type CollaborationClientState,
  type CollaborationSnapshot,
} from "../lib/collaboration";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function snapshot(role: "owner" | "editor" | "viewer" = "owner"): CollaborationSnapshot {
  return {
    roomId: "synthetic-room",
    document: createSharedDocument([["synthetic"]]),
    members: [
      { id: "me", displayName: "Test User", role, active: true },
      { id: "other", displayName: "Other", role: "editor", active: true },
    ],
    invites: [],
    history: [],
    stopped: false,
    expiresAt: Date.now() + 60_000,
    retention: { maxHistory: 100, maxOperations: 10000, maxCells: 50000 },
  };
}

function state(room: CollaborationSnapshot): CollaborationClientState {
  return {
    status: "online",
    endpoint: "https://relay.example",
    snapshot: room,
    memberId: "me",
    pendingCount: 0,
    error: null,
  };
}

function common() {
  return { rows: [["synthetic"]], onConnected: vi.fn(), onDetached: vi.fn(), onClose: vi.fn() };
}

describe("explicit sharing UI", () => {
  it("starts with blank inputs/OFF and requires destination-specific consent before creating a room", async () => {
    const create = vi
      .spyOn(CollaborationClient.prototype, "createRoom")
      .mockResolvedValue(snapshot());
    const props = common();
    render(<SharingPanel {...props} client={null} state={null} />);
    expect(screen.getByLabelText("Relay endpoint")).toHaveValue("");
    expect(screen.getByLabelText("Display name")).toHaveValue("");
    expect(create).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Start sharing" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Relay endpoint"), {
      target: { value: "https://relay.example" },
    });
    fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Test User" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.change(screen.getByLabelText("Relay endpoint"), {
      target: { value: "https://other.example" },
    });
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Start sharing" }));
    await waitFor(() =>
      expect(props.onConnected).toHaveBeenCalledWith(expect.any(CollaborationClient), "create"),
    );
    expect(create).toHaveBeenCalledOnce();
    expect(create).toHaveBeenCalledWith([["synthetic"]], "Test User");
  });

  it("joins only after explicit consent and passes join mode for a new document", async () => {
    const join = vi
      .spyOn(CollaborationClient.prototype, "joinRoom")
      .mockResolvedValue(snapshot("viewer"));
    const props = common();
    render(<SharingPanel {...props} client={null} state={null} />);
    fireEvent.change(screen.getByLabelText("Relay endpoint"), {
      target: { value: "https://relay.example" },
    });
    fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Viewer" } });
    fireEvent.change(screen.getByLabelText("Sharing action"), { target: { value: "join" } });
    fireEvent.change(screen.getByLabelText("Room ID"), { target: { value: "synthetic-room" } });
    fireEvent.change(screen.getByLabelText("Single-use invitation token"), {
      target: { value: "synthetic-invitation-fixture" },
    });
    expect(join).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Join room" }));
    await waitFor(() =>
      expect(props.onConnected).toHaveBeenCalledWith(expect.any(CollaborationClient), "join"),
    );
    expect(join).toHaveBeenCalledWith("synthetic-room", "synthetic-invitation-fixture", "Viewer");
  });

  it("prevents repeated creates and Escape dismissal during an in-flight request, and surfaces failure", async () => {
    let reject!: (error: Error) => void;
    const create = vi.spyOn(CollaborationClient.prototype, "createRoom").mockImplementation(
      () =>
        new Promise((_, no) => {
          reject = no;
        }),
    );
    const props = common();
    render(<SharingPanel {...props} client={null} state={null} />);
    fireEvent.change(screen.getByLabelText("Relay endpoint"), {
      target: { value: "https://relay.example" },
    });
    fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Owner" } });
    fireEvent.click(screen.getByRole("checkbox"));
    const start = screen.getByRole("button", { name: "Start sharing" });
    fireEvent.click(start);
    fireEvent.click(start);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(props.onClose).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalledTimes(1);
    await act(async () => reject(new Error("Origin denied by relay")));
    expect(screen.getByRole("alert")).toHaveTextContent("Origin denied by relay");
    expect(props.onConnected).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Close" })).toBeEnabled();
  });

  it("keeps viewers read-only and asks before leaving or forgetting a session", async () => {
    const client = new CollaborationClient();
    const leave = vi.spyOn(client, "leave").mockResolvedValue();
    const props = common();
    render(<SharingPanel {...props} client={client} state={state(snapshot("viewer"))} />);
    expect(
      screen.queryByRole("button", { name: "Create editor invitation" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Stop sharing" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Leave room" }));
    expect(leave).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(leave).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Leave room" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm leave room" }));
    await waitFor(() => expect(props.onDetached).toHaveBeenCalledOnce());
    expect(leave).toHaveBeenCalledOnce();
  });

  it("shows a single-use invitation only after creation and hides its token on request", async () => {
    const client = new CollaborationClient();
    const room = snapshot();
    const invite = vi
      .spyOn(client, "invite")
      .mockResolvedValue({
        id: "invitation-id",
        roomId: room.roomId,
        token: "synthetic-token-only",
        role: "viewer",
        expiresAt: Date.now() + 60000,
      });
    vi.spyOn(client, "sync").mockResolvedValue(room);
    render(<SharingPanel {...common()} client={client} state={state(room)} />);
    expect(screen.queryByLabelText("Invitation token")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Create viewer invitation" }));
    await waitFor(() =>
      expect(screen.getByLabelText("Invitation token")).toHaveValue("synthetic-token-only"),
    );
    expect(invite).toHaveBeenCalledWith("viewer");
    fireEvent.click(screen.getByRole("button", { name: "Hide invitation token" }));
    expect(screen.queryByLabelText("Invitation token")).not.toBeInTheDocument();
  });

  it("requires destructive preview confirmation for stop/delete and exact pending discard", async () => {
    const client = new CollaborationClient();
    const stop = vi.spyOn(client, "stop").mockResolvedValue();
    const discard = vi.spyOn(client, "discardPending").mockImplementation(() => undefined);
    vi.spyOn(client, "getPendingOperations").mockReturnValue([
      { id: "pending-exact-id", baseRevision: 0, actions: [] },
    ]);
    render(<SharingPanel {...common()} client={client} state={state(snapshot())} />);
    fireEvent.click(screen.getByRole("button", { name: "Discard pending-exact-id" }));
    expect(discard).not.toHaveBeenCalled();
    expect(screen.getByText(/Discard local queued operation pending-exact-id/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirm discard pending operation" }));
    await waitFor(() => expect(discard).toHaveBeenCalledWith("pending-exact-id"));
    fireEvent.click(screen.getByRole("button", { name: "Stop sharing" }));
    expect(stop).not.toHaveBeenCalled();
    expect(
      screen.getByText(/All invitations and non-owner access will be revoked/),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirm stop sharing" }));
    await waitFor(() => expect(stop).toHaveBeenCalledOnce());
  });

  it("labels and confirms before-state restoration separately from Undo", async () => {
    const client = new CollaborationClient();
    const restore = vi.spyOn(client, "restore").mockResolvedValue("new-operation");
    const room = snapshot();
    room.history = [
      {
        id: "historic-operation",
        revision: 1,
        memberId: "other",
        displayName: "Other",
        timestamp: Date.now(),
        actions: [],
        inverse: [],
        conflicts: [],
      },
    ];
    render(<SharingPanel {...common()} client={client} state={state(room)} />);
    fireEvent.click(screen.getByText(/Revision 1 · Other/));
    fireEvent.click(screen.getByRole("button", { name: "Restore before 1" }));
    expect(restore).not.toHaveBeenCalled();
    expect(screen.getByText(/This may replace newer edits/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirm restore before revision" }));
    await waitFor(() => expect(restore).toHaveBeenCalledWith("historic-operation", true));
  });
});
