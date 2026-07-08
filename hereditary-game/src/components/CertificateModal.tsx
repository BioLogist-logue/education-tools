import { useEffect, useRef, useState } from "react";
import { popupAssets } from "../data/assets";
import { downloadCertificate } from "../utils/downloadCertificate";

type CertificateModalProps = {
  onClose: () => void;
};

export function CertificateModal({ onClose }: CertificateModalProps) {
  const [draftName, setDraftName] = useState("");
  const [certificateName, setCertificateName] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleDownload = async () => {
    if (!captureRef.current) {
      return;
    }

    setIsDownloading(true);
    try {
      await downloadCertificate(captureRef.current);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="modalBackdrop" role="presentation">
      <div className="certificatePanel" role="dialog" aria-modal="true" aria-label="Certificate">
        <button className="modalClose" type="button" onClick={onClose} aria-label="닫기">
          X
        </button>
        <div className="certificateCapture" ref={captureRef}>
          <img className="modalImage" src={popupAssets.certificate} alt="" />
          {certificateName && <div className="certificateName">{certificateName}</div>}
        </div>
        <form
          className="certificateControls"
          onSubmit={(event) => {
            event.preventDefault();
            setCertificateName(draftName.trim());
          }}
        >
          <label className="certificateLabel" htmlFor="detective-name">
            명탐정 이름을 써주세요.
          </label>
          <input
            id="detective-name"
            className="answerInput certificateInput"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            autoComplete="off"
          />
          <button className="submitButton" type="submit">
            인증서 생성하기
          </button>
          <button className="submitButton" type="button" onClick={handleDownload} disabled={!certificateName || isDownloading}>
            {isDownloading ? "다운로드 중" : "다운로드"}
          </button>
        </form>
      </div>
    </div>
  );
}

