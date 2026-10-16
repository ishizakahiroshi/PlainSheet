import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { SelectionTarget, TargetKind } from "../lib/selectionTarget";

export type ContextMenuKind = TargetKind;
export type ContextMenuState = {
  kind: ContextMenuKind;
  row: number;
  col: number;
  x: number;
  y: number;
  target: SelectionTarget;
  documentId: string;
  revision: number;
} | null;
export type ContextAction = { label: string; action: () => void; reason?: string };

type ContextMenuProps = {
  state: ContextMenuState;
  heading: string;
  detail: string;
  items: ContextAction[];
  onClose: () => void;
};

export function ContextMenu({ state, heading, detail, items, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  useLayoutEffect(() => {
    if (!state || !ref.current) return;
    const node = ref.current;
    returnFocus.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const place = () => {
      const bounds = node.getBoundingClientRect();
      setPosition({
        left: Math.max(4, Math.min(state.x, window.innerWidth - bounds.width - 4)),
        top: Math.max(4, Math.min(state.y, window.innerHeight - bounds.height - 4)),
      });
    };
    place();
    node.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("resize", place);
      if (returnFocus.current?.isConnected) returnFocus.current.focus();
    };
  }, [state]);
  useEffect(() => {
    if (!state) return;
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !ref.current?.contains(event.target)) onClose();
    };
    document.addEventListener("pointerdown", dismiss, true);
    return () => document.removeEventListener("pointerdown", dismiss, true);
  }, [state, onClose]);
  if (!state) return null;
  return (
    <div
      ref={ref}
      className="contextMenu"
      role="menu"
      aria-label={heading}
      style={position}
      onKeyDown={(event) => {
        if (event.nativeEvent.isComposing || event.keyCode === 229) return;
        event.stopPropagation();
        if (event.key === "Escape" || event.key === "Tab") {
          event.preventDefault();
          onClose();
          return;
        }
        const buttons = Array.from(
          ref.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? [],
        );
        const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
        if (event.key === "Enter") {
          event.preventDefault();
          buttons[current]?.click();
          return;
        }
        let next: number | undefined;
        if (event.key === "ArrowDown") next = (current + 1) % buttons.length;
        if (event.key === "ArrowUp") next = (current + buttons.length - 1) % buttons.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = buttons.length - 1;
        if (next !== undefined) {
          event.preventDefault();
          buttons[next]?.focus();
        }
      }}
    >
      <div className="contextMenu__heading">{heading}</div>
      <div className="contextMenu__detail">{detail}</div>
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          role="menuitem"
          className="contextMenu__item"
          disabled={Boolean(item.reason)}
          title={item.reason}
          onClick={() => {
            if (!item.reason) {
              item.action();
              onClose();
            }
          }}
        >
          <span>
            {item.label}
            {item.reason && <small className="contextMenu__reason">{item.reason}</small>}
          </span>
        </button>
      ))}
    </div>
  );
}
