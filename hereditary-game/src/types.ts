export type SceneId =
  | "manor"
  | "laboratory"
  | "safeLock"
  | "study"
  | "familyHead"
  | "charles"
  | "pedigree";

export type PopupId =
  | "oath"
  | "evidenceBox"
  | "safeClue"
  | "portraitVictoria"
  | "codedNote"
  | "accusation"
  | "certificate"
  | "watsonHint"
  | "error";

export type HotspotAction =
  | { type: "scene"; targetScene: SceneId }
  | { type: "popup"; popupId: PopupId }
  | { type: "custom"; command: string };

export type HotspotDefinition = {
  id: string;
  label: string;
  scene: SceneId;
  left: number;
  top: number;
  width: number;
  height: number;
  action: HotspotAction;
};
