import { useState } from "react";
import { FeatureDialog } from "./FeatureDialog";
import { type Command, dispatchCommand, shortcutLabel } from "../lib/commands";
export function CommandSearch({ commands, onClose }: { commands: Command[]; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const matches = commands.filter((c) =>
    `${c.label} ${c.aliases}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );
  const execute = (command: Command) => {
    if (command.disabled) return;
    onClose();
    dispatchCommand(commands, command.id);
  };
  return (
    <FeatureDialog title="操作を探す / Find commands" onClose={onClose}>
      <input
        aria-label="操作名 / Command name"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIndex(0);
        }}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing || e.keyCode === 229) return;
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setIndex((i) =>
              Math.max(0, Math.min(matches.length - 1, i + (e.key === "ArrowDown" ? 1 : -1))),
            );
          }
          if (e.key === "Enter" && matches[index]) {
            e.preventDefault();
            execute(matches[index]);
          }
        }}
      />
      <ul>
        {matches.map((c, i) => (
          <li key={c.id}>
            <button
              aria-current={i === index ? "true" : undefined}
              disabled={Boolean(c.disabled)}
              onClick={() => execute(c)}
            >
              {c.label} {shortcutLabel(c.id)}
            </button>{" "}
            {c.target} {c.disabled ?? ""}
          </li>
        ))}
      </ul>
      {matches.length === 0 && <p>該当する操作なし / No commands</p>}
      <button onClick={onClose}>取消 / Cancel</button>
    </FeatureDialog>
  );
}
