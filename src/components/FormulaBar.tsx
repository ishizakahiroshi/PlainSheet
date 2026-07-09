import { useEffect, useRef, useState } from "react";
import { t } from "../lib/i18n";

type FormulaBarProps = {
  row: number;
  col: number;
  reference: string;
  value: string;
  onCommit: (row: number, col: number, value: string, reselect: boolean) => void;
};

export function FormulaBar({ row, col, reference, value, onCommit }: FormulaBarProps) {
  const [draft, setDraft] = useState(value);
  // The cell being edited, captured on focus. Committing to this target rather
  // than the live selection prevents writing the draft into a different cell
  // when a click moves the selection just before the input blurs.
  const target = useRef({ row, col });
  const focused = useRef(false);
  // Enter commits explicitly then blurs; Escape cancels then blurs. Both would
  // otherwise re-enter onBlur with a stale draft and double-commit or save the
  // cancelled edit.
  const skipBlurCommit = useRef(false);

  useEffect(() => {
    // Don't clobber the draft while the user is typing; only sync from props
    // when the bar isn't actively being edited.
    if (!focused.current) {
      setDraft(value);
    }
  }, [value, reference]);

  return (
    <section className="formulaBar" aria-label={t("formulaInput")}>
      <div className="formulaBar__reference">{reference}</div>
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
