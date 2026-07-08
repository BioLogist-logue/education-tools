import type { CSSProperties, ReactNode } from "react";
import { useEffect } from "react";

type ModalProps = {
  title: string;
  imageSrc: string;
  onClose: () => void;
  closeOnBackdrop?: boolean;
  showCloseButton?: boolean;
  aspectRatio?: string;
  children?: ReactNode;
};

export function Modal({
  title,
  imageSrc,
  onClose,
  closeOnBackdrop = true,
  showCloseButton = true,
  aspectRatio = "1672 / 941",
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

  const isSquareModal =
    aspectRatio.replace(/\s/g, "") === "1125/1125" ||
    aspectRatio.replace(/\s/g, "") === "2475/2475";
  const panelStyle = {
    "--modal-aspect": aspectRatio,
  } as CSSProperties;

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
        className={"modalPanel" + (isSquareModal ? " modalPanelSquare" : "")}
        style={panelStyle}
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


