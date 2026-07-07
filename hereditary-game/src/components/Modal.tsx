import type { ReactNode } from "react";
import { useEffect } from "react";

type ModalProps = {
  title: string;
  imageSrc: string;
  onClose: () => void;
  closeOnBackdrop?: boolean;
  showCloseButton?: boolean;
  children?: ReactNode;
};

export function Modal({
  title,
  imageSrc,
  onClose,
  closeOnBackdrop = true,
  showCloseButton = true,
  children,
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="modalBackdrop"
      role="presentation"
      onMouseDown={() => {
        if (closeOnBackdrop) {
          onClose();
        }
      }}
    >
      <div
        className="modalPanel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {showCloseButton && (
          <button className="modalClose" type="button" onClick={onClose} aria-label="닫기">
            X
          </button>
        )}
        <img
          className="modalImage"
          src={imageSrc}
          alt=""
          onError={() => {
            console.warn("Cannot load popup image: " + imageSrc);
          }}
        />
        {children && <div className="modalOverlay">{children}</div>}
      </div>
    </div>
  );
}
