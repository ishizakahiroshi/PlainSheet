import { useEffect, useRef, useState } from "react";
import { t } from "../lib/i18n";
import { parseCellRef } from "../lib/cellref";

type FormulaBarProps = {
  row: number;
  col: number;
  reference: string;
  value: string;
  onCommit: (row: number, col: number, value: string, reselect: boolean) => void;
  onJump?: (ref: ReturnType<typeof parseCellRef>) => void;
};

export function FormulaBar({ row, col, reference, value, onCommit, onJump }: FormulaBarProps) {
  const [draft, setDraft] = useState(value);
  const [refDraft, setRefDraft] = useState(reference);
  const [refInvalid, setRefInvalid] = useState(false);
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
      <input
        className="formulaBar__input"
        aria-label={t("formulaInput")}
        value={draft}
        onFocus={() => {
          focused.current = true;
          skipBlurCommit.current = false;
          target.current = { row, col };
        }}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          focused.current = false;
          if (skipBlurCommit.current) {
            skipBlurCommit.current = false;
            return;
          }
          onCommit(target.current.row, target.current.col, draft, false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            skipBlurCommit.current = true;
            onCommit(target.current.row, target.current.col, draft, true);
            event.currentTarget.blur();
          }
          if (event.key === "Escape") {
            skipBlurCommit.current = true;
            setDraft(value);
            event.currentTarget.blur();
          }
        }}
      />
    </section>
  );
}
