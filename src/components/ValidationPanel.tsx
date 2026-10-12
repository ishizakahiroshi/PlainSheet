import { useEffect, useMemo, useRef, useState } from "react";
import {
  parseValidationRules,
  serializeValidationRules,
  validateDocument,
  validateRule,
  type ValidationRule,
} from "../lib/validation";
import { FeatureDialog } from "./FeatureDialog";

export type ValidationPanelProps = {
  rows: string[][];
  rules: readonly ValidationRule[];
  onRulesChange: (rules: ValidationRule[]) => void;
  onClose: () => void;
  onExportRules?: (text: string) => void;
};

export function ValidationPanel({
  rows,
  rules,
  onRulesChange,
  onClose,
  onExportRules,
}: ValidationPanelProps) {
  const [column, setColumn] = useState(1);
  const [kind, setKind] = useState<ValidationRule["kind"]>("required");
  const [mode, setMode] = useState<ValidationRule["mode"]>("warning");
  const [skipHeader, setSkipHeader] = useState(true);
  const [pattern, setPattern] = useState("[0-9]+");
  const [values, setValues] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [sidecar, setSidecar] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const importEpoch = useRef(0);
  useEffect(
    () => () => {
      importEpoch.current++;
    },
    [],
  );
  const report = useMemo(() => validateDocument(rows, rules), [rows, rules]);
  const reset = () => {
    setEditing(null);
    setMode("warning");
    setError("");
  };
  const saveRule = () => {
    const rule: ValidationRule = {
      id: editing ?? `rule-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
      column: column - 1,
      kind,
      mode,
      skipHeader,
      ...(kind === "pattern" ? { pattern } : {}),
      ...(kind === "enum" ? { values: values.split("\n") } : {}),
    };
    const invalid = validateRule(rule);
    if (invalid || (!editing && rules.length >= 100)) {
      setError(invalid ?? "A document supports at most 100 rules.");
      return;
    }
    onRulesChange(
      editing ? rules.map((old) => (old.id === editing ? rule : old)) : [...rules, rule],
    );
    reset();
  };
  return (
    <FeatureDialog title="Input rules for this document" onClose={onClose}>
      <p>
        Rules are optional and session-only. They disappear when this document is closed. CSV
        contains no rules; sharing CSV alone does not share these checks. Export a separate JSON
        sidecar to retain them, then explicitly import it into the intended document. Deleting a
        sidecar does not remove rules already imported into an open document; remove those below.
      </p>
      <ul aria-label="Existing rules">
        {rules.map((rule) => (
          <li key={rule.id}>
            Column {rule.column + 1}: {rule.kind} · {rule.mode} ·{" "}
            {rule.skipHeader ? "header excluded" : "all rows"}{" "}
            <button
              onClick={() => {
                setEditing(rule.id);
                setColumn(rule.column + 1);
                setKind(rule.kind);
                setMode(rule.mode);
                setSkipHeader(rule.skipHeader);
                setPattern(rule.pattern ?? "[0-9]+");
                setValues((rule.values ?? []).join("\n"));
              }}
            >
              Edit rule
            </button>{" "}
            <button
              onClick={() => {
                onRulesChange(rules.filter((old) => old.id !== rule.id));
                if (editing === rule.id) reset();
              }}
            >
              Remove rule
            </button>
          </li>
        ))}
      </ul>
      <label>
        Column number{" "}
        <input
          type="number"
          min={1}
          max={16384}
          value={column}
          onChange={(event) => setColumn(Number(event.target.value))}
        />
      </label>
      <label>
        Rule{" "}
        <select
          value={kind}
          onChange={(event) => setKind(event.target.value as ValidationRule["kind"])}
        >
          <option value="required">Required (nonempty raw text)</option>
          <option value="pattern">Full-cell pattern</option>
          <option value="enum">Allowed values</option>
        </select>
      </label>
      <label>
        On invalid input{" "}
        <select
          value={mode}
          onChange={(event) => setMode(event.target.value as ValidationRule["mode"])}
        >
          <option value="warning">Warn and keep the text</option>
          <option value="reject">Reject the entire edit or paste</option>
        </select>
      </label>
      <label>
        <input
          type="checkbox"
          checked={skipHeader}
          onChange={(event) => setSkipHeader(event.target.checked)}
        />
        Skip source row 1 (header)
      </label>
      {kind === "pattern" && (
        <>
          <label>
            Full-cell pattern{" "}
            <input
              value={pattern}
              maxLength={128}
              onChange={(event) => setPattern(event.target.value)}
            />
          </label>
          <p>
            Use literals, character classes, dot, \d/\w/\s, ?, *, + or {"{n,m}"}. Groups,
            alternatives and backreferences are unsupported. Maximum: 128 pattern characters and
            4096 value characters.
          </p>
        </>
      )}
      {kind === "enum" && (
        <>
          <label>
            Allowed values, one per line{" "}
            <textarea value={values} onChange={(event) => setValues(event.target.value)} />
          </label>
          <p>
            Case and spaces are exact. A blank line permits an empty string; add Required to
            disallow it.
          </p>
        </>
      )}
      {error && <p role="alert">{error}</p>}
      <button onClick={saveRule}>{editing ? "Save rule" : "Add rule"}</button>
      {editing && <button onClick={reset}>Cancel rule edit</button>}
      <p role="status">
        Current data: {report.totalIssues} rule violations. Existing data is unchanged. New
        rejecting rules affect future edits only.
      </p>
      <ol aria-label="Validation issues">
        {report.issues.map((issue, index) => (
          <li key={index}>
            Row {issue.row + 1}, column {issue.col + 1}: {issue.message} ({issue.mode})
          </li>
        ))}
      </ol>
      {report.truncated && <p>The first 200 violations are listed; all violations are counted.</p>}
      <input
        ref={input}
        type="file"
        accept=".json,application/json"
        aria-label="Import validation sidecar"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          if (file.size > 1024 * 1024) {
            setError("Validation sidecar exceeds 1 MiB.");
            return;
          }
          try {
            const epoch = ++importEpoch.current;
            const text = await file.text();
            if (epoch !== importEpoch.current) return;
            const parsed = parseValidationRules(text);
            if (parsed.error) setError(parsed.error);
            else {
              onRulesChange(parsed.rules);
              reset();
            }
          } catch {
            setError("Could not read the sidecar. Existing rules were not changed.");
          }
          if (input.current) input.current.value = "";
        }}
      />
      <button
        onClick={() => {
          const text = serializeValidationRules(rules);
          setSidecar(text);
          onExportRules?.(text);
        }}
      >
        Export separate rules JSON
      </button>
      {sidecar && (
        <label>
          Rules sidecar JSON (save separately from CSV)
          <textarea readOnly value={sidecar} onFocus={(event) => event.target.select()} />
        </label>
      )}
      <div className="modalActions">
        <button
          disabled={!rules.length}
          onClick={() => {
            onRulesChange([]);
            reset();
          }}
        >
          Remove all rules
        </button>
        <button onClick={onClose}>Close</button>
      </div>
    </FeatureDialog>
  );
}
