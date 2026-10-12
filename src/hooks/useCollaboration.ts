import { useEffect, useRef, useState } from "react";
import {
  CollaborationClient,
  activeIds,
  actionsForCellMatrix,
  applyCollaborationOperation,
  collaborationId,
  insertAxisActions,
  sharedDocumentRows,
  type CollaborationAction,
  type CollaborationClientState,
} from "../lib/collaboration";
import { sameRows } from "../lib/gridOperations";

type Options = {
  activeId: string;
  getRows: (id: string) => string[][] | undefined;
  applyRows: (id: string, rows: string[][]) => void;
  onError: (message: string) => void;
};
export function useCollaboration(options: Options) {
  const latest = useRef(options);
  latest.current = options;
  const sessions = useRef(
    new Map<string, { client: CollaborationClient; unsubscribe: () => void }>(),
  );
  const [states, setStates] = useState<Record<string, CollaborationClientState>>({});
  const attach = (id: string, client: CollaborationClient) => {
    const existing = sessions.current.get(id);
    existing?.unsubscribe();
    existing?.client.dispose();
    const unsubscribe = client.subscribe((state) => {
      setStates((current) => ({ ...current, [id]: state }));
      const document = client.getDocument();
      if (!document) return;
      const rows = sharedDocumentRows(document);
      const current = latest.current.getRows(id);
      if (current && !sameRows(current, rows)) latest.current.applyRows(id, rows);
    });
    sessions.current.set(id, { client, unsubscribe });
    client.startPolling();
  };
  const detach = (id: string) => {
    const existing = sessions.current.get(id);
    existing?.unsubscribe();
    existing?.client.dispose();
    existing?.client.forget();
    sessions.current.delete(id);
    setStates((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  };
  useEffect(
    () => () => {
      for (const session of sessions.current.values()) {
        session.unsubscribe();
        session.client.dispose();
      }
    },
    [],
  );
  const client = sessions.current.get(options.activeId)?.client ?? null;
  const state = states[options.activeId] ?? null;
  const member = state?.snapshot?.members.find((m) => m.id === state.memberId);
  const readOnly = Boolean(
    client &&
    (!member?.active ||
      member.role === "viewer" ||
      state?.snapshot?.stopped ||
      state?.status === "blocked"),
  );
  const submit = (actions: CollaborationAction[]) => {
    if (!client || !actions.length) return false;
    try {
      client.enqueue(actions);
      if (client.getState().status === "online")
        void client.flush().catch((error) => latest.current.onError(String(error)));
      return true;
    } catch (error) {
      latest.current.onError(String(error));
      return false;
    }
  };
  const structure = (
    actions: CollaborationAction[],
    transform?: (rows: string[][]) => string[][],
  ) => {
    const document = client?.getDocument();
    if (!document || !actions.length) return false;
    try {
      if (transform) {
        const projected = applyCollaborationOperation(document, {
          id: collaborationId(),
          baseRevision: document.revision,
          actions,
        }).document;
        actions = [
          ...actions,
          ...actionsForCellMatrix(projected, transform(sharedDocumentRows(projected))),
        ];
      }
      return submit(actions);
    } catch (error) {
      latest.current.onError(String(error));
      return false;
    }
  };
  const replaceMatrix = (rows: string[][]) => {
    const document = client?.getDocument();
    if (!document) return false;
    try {
      const rowCount = activeIds(document, "row").length;
      const width = activeIds(document, "column").length;
      const nextWidth = rows.reduce((max, row) => Math.max(max, row.length), 0);
      if (rows.length < rowCount || nextWidth < width)
        throw new Error(
          "構造変更には明示的な行列操作を使用してください / Use explicit structural actions",
        );
      const actions = [
        ...(rows.length > rowCount
          ? insertAxisActions(document, "row", rowCount, rows.length - rowCount)
          : []),
        ...(nextWidth > width
          ? insertAxisActions(document, "column", width, nextWidth - width)
          : []),
      ];
      const projected = actions.length
        ? applyCollaborationOperation(document, {
            id: collaborationId(),
            baseRevision: document.revision,
            actions,
          }).document
        : document;
      return submit([
        ...actions,
        ...actionsForCellMatrix(
          projected,
          rows.map((row) => Array.from({ length: nextWidth }, (_, c) => row[c] ?? "")),
        ),
      ]);
    } catch (error) {
      latest.current.onError(String(error));
      return false;
    }
  };
  return {
    client,
    state,
    readOnly,
    attach,
    detach,
    submit,
    structure,
    replaceMatrix,
    hasSession: (id: string) => sessions.current.has(id),
  };
}
