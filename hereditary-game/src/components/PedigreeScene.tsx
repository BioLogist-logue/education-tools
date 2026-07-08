import type { CSSProperties } from "react";
import { sceneAssets } from "../data/assets";
import {
  genotypeTools,
  pedigreePeople,
  type GenotypeTool,
  type PedigreeAnswer,
  type PhenotypeTool,
} from "../data/pedigreePositions";

type PedigreeSceneProps = {
  debugHotspots: boolean;
  selectedPersonId: string | null;
  answers: Record<string, PedigreeAnswer>;
  onSelectPerson: (personId: string) => void;
  onApplyPhenotype: (tool: PhenotypeTool) => void;
  onPressGenotype: (tool: GenotypeTool) => void;
};

export function PedigreeScene({
  debugHotspots,
  selectedPersonId,
  answers,
  onSelectPerson,
  onApplyPhenotype,
  onPressGenotype,
}: PedigreeSceneProps) {
  const frameStyle = {
    "--scene-aspect": "1999 / 1125",
  } as CSSProperties;

  return (
    <section className="sceneShell" aria-label="pedigree scene">
      <div className="sceneFrame pedigreeFrame" style={frameStyle}>
        <img className="sceneImage" src={sceneAssets.pedigree} alt="" />
        {pedigreePeople.map((person) => {
          const style: CSSProperties = {
            left: person.left + "%",
            top: person.top + "%",
            width: person.width + "%",
            height: person.height + "%",
          };
          const answer = answers[person.id];
          const selected = selectedPersonId === person.id;

          return (
            <button
              key={person.id}
              type="button"
              className="pedigreePerson"
              data-debug={debugHotspots ? "true" : "false"}
              data-selected={selected ? "true" : "false"}
              style={style}
              onClick={() => onSelectPerson(person.id)}
              aria-label={"Select " + person.label}
            >
              {answer?.phenotype && (
                <span
                  className={"phenotypeShape " + person.sex + " " + answer.phenotype}
                  aria-hidden="true"
                />
              )}
              {debugHotspots && <span className="personDebugLabel">{person.label}</span>}
              {answer?.genotype && <span className="pedigreeBadge genotypeBadge">{answer.genotype}</span>}
            </button>
          );
        })}

        <button
          type="button"
          className="imageHotButton phenotypeTool traitTool"
          data-debug={debugHotspots ? "true" : "false"}
          onClick={() => onApplyPhenotype("trait")}
          aria-label="Apply trait phenotype"
        />
        <button
          type="button"
          className="imageHotButton phenotypeTool normalTool"
          data-debug={debugHotspots ? "true" : "false"}
          onClick={() => onApplyPhenotype("normal")}
          aria-label="Apply normal phenotype"
        />

        {genotypeTools.map((tool) => (
          <button
            key={tool}
            type="button"
            className={"imageHotButton genotypeTool genotypeTool" + tool}
            data-debug={debugHotspots ? "true" : "false"}
            onClick={() => onPressGenotype(tool)}
            aria-label={"Add genotype " + tool}
          />
        ))}
      </div>
    </section>
  );
}
