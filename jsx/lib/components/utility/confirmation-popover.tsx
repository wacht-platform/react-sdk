import { useRef, useEffect } from "react";

interface ConfirmationPopoverProps {
  title: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
  style?: React.CSSProperties;
}

export const ConfirmationPopover = ({
  title,
  description,
  onConfirm,
  onCancel,
  style,
}: ConfirmationPopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        onCancel();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onCancel]);

  return (
    <div
      ref={popoverRef}
      className="w-pop"
      style={{
        position: "fixed",
        zIndex: 1000,
        right: 44,
        ...style,
      }}
    >
      <div className="w-pop-body">
        <h3 className="w-pop-title">{title}</h3>
        {description && <p className="w-pop-sub">{description}</p>}
      </div>
      <div className="w-pop-foot">
        <button className="w-btn w-btn--secondary w-btn--sm" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="w-btn w-btn--danger-solid w-btn--sm"
          onClick={onConfirm}
        >
          Confirm
        </button>
      </div>
    </div>
  );
};
