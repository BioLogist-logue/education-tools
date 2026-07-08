import type { CSSProperties, ReactNode } from "react";
import { sceneAspectRatios } from "../data/assets";
import type { HotspotDefinition, SceneId } from "../types";
import { Hotspot } from "./Hotspot";

type SceneViewProps = {
  sceneId: SceneId;
  imageSrc: string;
  hotspots: HotspotDefinition[];
  debugHotspots: boolean;
  onHotspotActivate: (hotspot: HotspotDefinition) => void;
  children?: ReactNode;
};

export function SceneView({
  sceneId,
  imageSrc,
  hotspots,
  debugHotspots,
  onHotspotActivate,
  children,
}: SceneViewProps) {
  const frameStyle = {
    "--scene-aspect": sceneAspectRatios[sceneId],
  } as CSSProperties;

  return (
    <section className="sceneShell" aria-label={sceneId + " scene"}>
      <div className={"sceneFrame sceneFrame-" + sceneId} style={frameStyle}>
        <img
          className="sceneImage"
          src={imageSrc}
          alt=""
          onError={() => {
            console.warn("Cannot load scene image: " + imageSrc);
          }}
        />
        {hotspots.map((hotspot) => (
          <Hotspot
            key={hotspot.id}
            hotspot={hotspot}
            debugHotspots={debugHotspots}
            onActivate={onHotspotActivate}
          />
        ))}
        {children}
      </div>
    </section>
  );
}
