import { sidebarAssets } from "../data/assets";

type SidebarProps = {
  onAccusation: () => void;
  onPedigree: () => void;
  onWatsonHint: () => void;
};

export function Sidebar({ onAccusation, onPedigree, onWatsonHint }: SidebarProps) {
  return (
    <aside className="sidebar" aria-label="Tools">
      <button className="imageButton" type="button" onClick={onAccusation}>
        <img src={sidebarAssets.accusation} alt="Make final accusation" />
      </button>
      <button className="imageButton" type="button" onClick={onPedigree}>
        <img src={sidebarAssets.pedigree} alt="Open pedigree puzzle" />
      </button>
      <button className="imageButton" type="button" onClick={onWatsonHint}>
        <img src={sidebarAssets.watson} alt="Call Watson" />
      </button>
    </aside>
  );
}
