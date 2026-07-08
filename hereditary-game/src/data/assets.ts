import type { PopupId, SceneId } from "../types";

const png = (fileName: string) => "/assets/" + fileName;

export const sceneAssets: Record<SceneId, string> = {
  manor: png("manor_exterior.png"),
  laboratory: png("laboratory_room.png"),
  safeLock: png("safe_lock.png"),
  study: png("study_room.png"),
  familyHead: png("family_head_room.png"),
  charles: png("charles_room.png"),
  pedigree: png("pedigree_puzzle.png"),
};

export const sceneAspectRatios: Record<SceneId, string> = {
  manor: "2816 / 1536",
  laboratory: "1672 / 941",
  safeLock: "1672 / 941",
  study: "1672 / 941",
  familyHead: "1672 / 941",
  charles: "1672 / 941",
  pedigree: "1999 / 1125",
};

export const popupAssets: Record<PopupId, string> = {
  oath: png("oath_popup.png"),
  evidenceBox: png("evidence_box_inside.png"),
  safeClue: png("safe_clue_document.png"),
  portraitVictoria: png("portrait_victoria.png"),
  codedNote: png("coded_note.png"),
  accusation: png("accusation_popup.png"),
  certificate: png("clear_certificate.png"),
  watsonHint: png("watson_hint.png"),
  error: png("error_alert.png"),
};


export const popupAspectRatios: Record<PopupId, string> = {
  oath: "1672 / 941",
  evidenceBox: "1672 / 941",
  safeClue: "1672 / 941",
  portraitVictoria: "1125 / 1125",
  codedNote: "1672 / 941",
  accusation: "1672 / 941",
  certificate: "1672 / 941",
  watsonHint: "2475 / 2475",
  error: "1448 / 1086",
};
export const sidebarAssets = {
  accusation: png("accusation_button.png"),
  pedigree: png("pedigree_button.png"),
  watson: png("watson_button.png"),
};

export const expectedAssetFiles = [
  "manor_exterior.png",
  "oath_popup.png",
  "laboratory_room.png",
  "safe_lock.png",
  "study_room.png",
  "family_head_room.png",
  "charles_room.png",
  "pedigree_puzzle.png",
  "evidence_box_inside.png",
  "safe_clue_document.png",
  "portrait_victoria.png",
  "coded_note.png",
  "accusation_popup.png",
  "clear_certificate.png",
  "watson_hint.png",
  "error_alert.png",
  "accusation_button.png",
  "pedigree_button.png",
  "watson_button.png",
] as const;

