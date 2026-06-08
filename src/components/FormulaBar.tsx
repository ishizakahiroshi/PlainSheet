import { useEffect, useState } from "react";
import { t } from "../lib/i18n";

type FormulaBarProps = {
  reference: string;
  value: string;
  onCommit: (value: string) => void;
};

export function FormulaBar({ reference, value, onCommit }: FormulaBarProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value, reference]);

  return (
    <section className="formulaBar" aria-label={t("formulaInput")}>
      <div className="formulaBar__reference">{reference}</div>
      <input
        className="formulaBar__input"
        aria-label={t("formulaInput")}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => onCommit(draft)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            onCommit(draft);
            event.currentTarget.blur();
          }
          if (event.key === "Escape") {
            setDraft(value);
            event.currentTarget.blur();
          }
        }}
      />
    </section>
  );
}
