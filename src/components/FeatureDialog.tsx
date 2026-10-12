import type { ReactNode } from "react";
import { useId, useRef } from "react";
import { useDialogFocus } from "../hooks/useDialogFocus";

export function FeatureDialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const id = useId();
  useDialogFocus(ref, true);
  return (
    <div
      className="modalBackdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={ref}
        className="modal featureDialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Escape" && !e.nativeEvent.isComposing && e.keyCode !== 229) {
            e.preventDefault();
            onClose();
          }
        }}
      >
        <h2 id={id}>{title}</h2>
        {children}
      </section>
    </div>
  );
}
