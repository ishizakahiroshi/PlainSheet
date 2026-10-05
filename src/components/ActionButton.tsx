import { useId, useState, type ButtonHTMLAttributes } from "react";
import { createPortal } from "react-dom";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { tooltip: string };

/** The same name is available on hover, keyboard focus and assistive technology. */
export function ActionButton({
  tooltip,
  children,
  onFocus,
  onBlur,
  onMouseEnter,
  onMouseLeave,
  ...props
}: Props) {
  const id = useId();
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const show = (button: HTMLButtonElement) => {
    const rect = button.getBoundingClientRect();
    setPosition({
      left: Math.max(8, Math.min(rect.left, window.innerWidth - 288)),
      top: Math.min(rect.bottom + 6, window.innerHeight - 70),
    });
  };
  return (
    <>
      <button
        {...props}
        aria-label={props["aria-label"] ?? tooltip}
        aria-describedby={position ? id : undefined}
        title={tooltip}
        onFocus={(event) => {
          show(event.currentTarget);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setPosition(null);
          onBlur?.(event);
        }}
        onMouseEnter={(event) => {
          show(event.currentTarget);
          onMouseEnter?.(event);
        }}
        onMouseLeave={(event) => {
          setPosition(null);
          onMouseLeave?.(event);
        }}
      >
        {children}
      </button>
      {position &&
        createPortal(
          <span className="actionTooltip" role="tooltip" id={id} style={position}>
            {tooltip}
          </span>,
          document.body,
        )}
    </>
  );
}
