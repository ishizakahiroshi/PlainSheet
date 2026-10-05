import { useEffect, useRef, useState } from "react";
import type { RegisterEditorCommit } from "./CellTextEditor";
import { t } from "../lib/i18n";
import { parseCellRef } from "../lib/cellref";

type FormulaBarProps = {
  row: number;
  col: number;
  reference: string;
  value: string;
  onCommit: (row: number, col: number, value: string, reselect: boolean) => void;
  disabled?: boolean;
  registerCommit?: RegisterEditorCommit;
  onMove?: (row: number, col: number, rowDelta: number, colDelta: number) => void;
  onJump?: (ref: ReturnType<typeof parseCellRef>) => void;
};

export function FormulaBar({
  row,
  col,
  reference,
  value,
  onCommit,
  onJump,
  registerCommit,
  onMove,
  disabled,
}: FormulaBarProps) {
  const [draft, setDraft] = useState(value);
  const [refDraft, setRefDraft] = useState(reference);
  const [refInvalid, setRefInvalid] = useState(false);
  const commitRef = useRef(onCommit);
  commitRef.current = onCommit;
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const composing = useRef(false);
  const unregister = useRef<(() => void) | undefined>();
  useEffect(() => () => unregister.current?.(), []);
  const target = useRef({ row, col });
  const focused = useRef(false);
  const refFocused = useRef(false);
  const skipBlurCommit = useRef(false);

  useEffect(() => {
    if (!focused.current) {
      setDraft(value);
    }
  }, [value, reference]);

  useEffect(() => {
    if (!refFocused.current) {
      setRefDraft(reference);
      setRefInvalid(false);
    }
  }, [reference]);

  return (
    <section className="formulaBar" aria-label={t("formulaInput")}>
      <input
        className={`formulaBar__reference${refInvalid ? " formulaBar__reference--invalid" : ""}`}
        aria-label={t("nameBox")}
        aria-invalid={refInvalid}
        title={refInvalid ? t("invalidReference") : t("nameBox")}
        value={refDraft}
        onFocus={() => {
          refFocused.current = true;
          setRefInvalid(false);
        }}
        onChange={(event) => {
          setRefDraft(event.target.value);
          setRefInvalid(false);
        }}
        onBlur={() => {
          refFocused.current = false;
          setRefDraft(reference);
          setRefInvalid(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            const parsed = parseCellRef(refDraft);
            if (!parsed) {
              setRefDraft(reference);
              setRefInvalid(true);
              return;
            }
            setRefInvalid(false);
            onJump?.(parsed);
            event.currentTarget.blur();
          }
          if (event.key === "Escape") {
            setRefDraft(reference);
            setRefInvalid(false);
            event.currentTarget.blur();
          }
        }}
      />
      <textarea
        disabled={disabled}
        rows={1}
        className="formulaBar__input"
        aria-label={t("formulaInput")}
        value={draft}
        onFocus={() => {
          focused.current = true;
          skipBlurCommit.current = false;
          target.current = { row, col };
          unregister.current?.();
          unregister.current = registerCommit?.(() => {
            if (composing.current) return false;
            skipBlurCommit.current = true;
            commitRef.current(target.current.row, target.current.col, draftRef.current, false);
            focused.current = false;
            return true;
          });
        }}
        onCompositionStart={() => {
          composing.current = true;
        }}
        onCompositionEnd={() => {
          composing.current = false;
        }}
        onChange={(event) => {
          skipBlurCommit.current = false;
          draftRef.current = event.target.value;
          setDraft(event.target.value);
        }}
        onBlur={() => {
          focused.current = false;
          unregister.current?.();
          unregister.current = undefined;
          if (skipBlurCommit.current) {
            skipBlurCommit.current = false;
            return;
          }
          commitRef.current(target.current.row, target.current.col, draftRef.current, false);
        }}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing || composing.current || event.keyCode === 229) {
            event.stopPropagation();
            return;
          }
          if (event.key === "Enter" && event.altKey) {
            event.preventDefault();
            event.stopPropagation();
            const field = event.currentTarget;
            const start = field.selectionStart;
            const next =
              draftRef.current.slice(0, start) + "\n" + draftRef.current.slice(field.selectionEnd);
            draftRef.current = next;
            skipBlurCommit.current = false;
            setDraft(next);
            window.requestAnimationFrame(() => field.setSelectionRange(start + 1, start + 1));
            return;
          }
          if (event.key === "Enter" || event.key === "Tab") {
            event.preventDefault();
            event.stopPropagation();
            skipBlurCommit.current = true;
            commitRef.current(target.current.row, target.current.col, draftRef.current, false);
            onMove?.(
              target.current.row,
              target.current.col,
              event.key === "Enter" ? (event.shiftKey ? -1 : 1) : 0,
              event.key === "Tab" ? (event.shiftKey ? -1 : 1) : 0,
            );
            event.currentTarget.blur();
          }
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            skipBlurCommit.current = true;
            setDraft(value);
            event.currentTarget.blur();
          }
        }}
      />
    </section>
  );
}
