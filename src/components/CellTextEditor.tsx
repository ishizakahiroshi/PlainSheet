import { useEffect, useRef } from "react";
import {
  GridCellKind,
  type GridCell,
  type ProvideEditorComponent,
} from "@glideapps/glide-data-grid";
import { t } from "../lib/i18n";

export type RegisterEditorCommit = (commit: () => boolean) => () => void;
type Props = Parameters<ProvideEditorComponent<GridCell>>[0] & {
  registerCommit?: RegisterEditorCommit;
};

/** Explicit editing contract; composition Enter is never a navigation key. */
export function CellTextEditor({
  value,
  onChange,
  onFinishedEditing,
  isHighlighted,
  registerCommit,
}: Props) {
  const input = useRef<HTMLTextAreaElement>(null);
  const current = useRef(value);
  current.current = value;
  const composing = useRef(false);
  const finished = useRef(false);
  const finishRef = useRef(onFinishedEditing);
  finishRef.current = onFinishedEditing;
  useEffect(() => {
    input.current?.focus();
    if (isHighlighted) input.current?.select();
    else {
      const end = input.current?.value.length ?? 0;
      input.current?.setSelectionRange(end, end);
    }
    return registerCommit?.(() => {
      if (composing.current) return false;
      if (!finished.current) {
        finished.current = true;
        finishRef.current(current.current, [0, 0]);
      }
      return true;
    });
  }, [registerCommit, isHighlighted]);
  if (value.kind !== GridCellKind.Text) return null;
  return (
    <textarea
      ref={input}
      className="cellTextEditor"
      aria-label={t("formulaInput")}
      aria-describedby="cell-edit-help"
      value={value.data}
      onCompositionStart={() => {
        composing.current = true;
      }}
      onCompositionEnd={() => {
        composing.current = false;
      }}
      onChange={(event) => {
        const next = { ...value, data: event.target.value };
        current.current = next;
        onChange(next);
      }}
      onKeyDown={(event) => {
        if (event.nativeEvent.isComposing || composing.current || event.keyCode === 229) {
          event.stopPropagation();
          return;
        }
        if (event.key === "Enter" && event.altKey) {
          // Keep the newline in this editor; never let the overlay interpret it as commit.
          event.preventDefault();
          event.stopPropagation();
          const field = event.currentTarget;
          const start = field.selectionStart;
          const text = field.value.slice(0, start) + "\n" + field.value.slice(field.selectionEnd);
          const next = { ...value, data: text };
          current.current = next;
          onChange(next);
          window.requestAnimationFrame(() => field.setSelectionRange(start + 1, start + 1));
          return;
        }
        if (event.key !== "Enter" && event.key !== "Tab" && event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        finished.current = true;
        onFinishedEditing(
          event.key === "Escape" ? undefined : current.current,
          event.key === "Tab"
            ? [event.shiftKey ? -1 : 1, 0]
            : event.key === "Enter"
              ? [0, event.shiftKey ? -1 : 1]
              : [0, 0],
        );
      }}
    />
  );
}
