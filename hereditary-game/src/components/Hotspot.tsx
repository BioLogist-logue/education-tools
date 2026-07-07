import type { CSSProperties } from "react";
import type { HotspotDefinition } from "../types";

type HotspotProps = {
  hotspot: HotspotDefinition;
  debugHotspots: boolean;
  onActivate: (hotspot: HotspotDefinition) => void;
};

export function Hotspot({ hotspot, debugHotspots, onActivate }: HotspotProps) {
  const style: CSSProperties = {
    left: hotspot.left + "%",
    top: hotspot.top + "%",
    width: hotspot.width + "%",
    height: hotspot.height + "%",
  };

  return (
    <button
      className="hotspot"
      data-hotspot-id={hotspot.id}
      data-debug={debugHotspots ? "true" : "false"}
      style={style}
      aria-label={hotspot.label}
      onClick={() => onActivate(hotspot)}
      type="button"
    >
      {debugHotspots && <span className="hotspotLabel">{hotspot.label}</span>}
    </button>
  );
}
