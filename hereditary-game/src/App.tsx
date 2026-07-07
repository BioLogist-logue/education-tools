import { useCallback, useMemo, useState } from "react";
import { AccusationForm } from "./components/AccusationForm";
import { CertificateModal } from "./components/CertificateModal";
import { Modal } from "./components/Modal";
import { PedigreeScene } from "./components/PedigreeScene";
import { SafeLockScene } from "./components/SafeLockScene";
import { SceneView } from "./components/SceneView";
import { Sidebar } from "./components/Sidebar";
import { accusationAnswer, safeAnswers } from "./data/answers";
import { popupAssets, sceneAssets } from "./data/assets";
import { hotspotsByScene } from "./data/hotspots";
import type { GenotypeTool, PedigreeAnswer, PhenotypeTool } from "./data/pedigreePositions";
import type { HotspotDefinition, PopupId, SceneId } from "./types";

const popupTitles: Record<PopupId, string> = {
  oath: "Oath",
  evidenceBox: "Evidence box",
  safeClue: "Safe clue",
  portraitVictoria: "Victoria portrait",
  codedNote: "Coded note",
  accusation: "Final accusation",
  certificate: "Certificate",
  watsonHint: "Watson hint",
  error: "Error",
};

export default function App() {
  const [currentScene, setCurrentScene] = useState<SceneId>("manor");
  const [activePopup, setActivePopup] = useState<PopupId | null>("oath");
  const [errorReturnPopup, setErrorReturnPopup] = useState<PopupId | null>(null);
  const [safeInput, setSafeInput] = useState("");
  const [accusationGeneration, setAccusationGeneration] = useState("");
  const [accusationMember, setAccusationMember] = useState("");
  const [selectedPedigreePersonId, setSelectedPedigreePersonId] = useState<string | null>(null);
  const [pedigreeAnswers, setPedigreeAnswers] = useState<Record<string, PedigreeAnswer>>({});

  const debugHotspots = useMemo(() => {
    return new URLSearchParams(window.location.search).get("debugHotspots") === "1";
  }, []);

  const handleHotspotActivate = (hotspot: HotspotDefinition) => {
    if (hotspot.action.type === "scene") {
      setCurrentScene(hotspot.action.targetScene);
      return;
    }

    if (hotspot.action.type === "popup") {
      setActivePopup(hotspot.action.popupId);
    }
  };

  const handleSafeGenePress = (gene: string) => {
    const nextCode = (safeInput + gene).slice(0, 4);
    setSafeInput(nextCode);

    if (nextCode.length < 4) {
      return;
    }

    if (safeAnswers.has(nextCode)) {
      setActivePopup("safeClue");
      return;
    }

    setSafeInput("");
    setErrorReturnPopup(null);
    setActivePopup("error");
  };

  const handleAccusationSubmit = useCallback(() => {
    const answer = accusationGeneration + "-" + accusationMember;
    if (answer === accusationAnswer) {
      setActivePopup("certificate");
      return;
    }

    setAccusationGeneration("");
    setAccusationMember("");
    setErrorReturnPopup("accusation");
    setActivePopup("error");
  }, [accusationGeneration, accusationMember]);

  const handleClosePopup = () => {
    if (activePopup === "error" && errorReturnPopup) {
      setActivePopup(errorReturnPopup);
      setErrorReturnPopup(null);
      return;
    }

    setActivePopup(null);
    setErrorReturnPopup(null);
  };

  const applyPedigreePhenotype = (phenotype: PhenotypeTool) => {
    if (!selectedPedigreePersonId) {
      return;
    }

    setPedigreeAnswers((current) => ({
      ...current,
      [selectedPedigreePersonId]: {
        ...current[selectedPedigreePersonId],
        phenotype,
      },
    }));
  };

  const pressPedigreeGenotype = (tool: GenotypeTool) => {
    if (!selectedPedigreePersonId) {
      return;
    }

    setPedigreeAnswers((current) => {
      const currentAnswer = current[selectedPedigreePersonId] ?? {};
      const currentGenotype = currentAnswer.genotype ?? "";
      const genotype = currentGenotype.length >= 4 ? tool : currentGenotype + tool;

      return {
        ...current,
        [selectedPedigreePersonId]: {
          ...currentAnswer,
          genotype,
        },
      };
    });
  };

  const showBackToManor = currentScene !== "manor";

  return (
    <main className="app">
      {currentScene === "manor" && (
        <a className="hubButton" href="https://biologue-tools.vercel.app/" target="_blank" rel="noreferrer">
          에듀테크 허브 바로가기
        </a>
      )}
      <div className="gameLayout">
        <div className="mainStage">
          {showBackToManor && (
            <button className="backButton" type="button" onClick={() => setCurrentScene("manor")}>
              메인으로 돌아가기
            </button>
          )}
          {currentScene === "pedigree" ? (
            <PedigreeScene
              debugHotspots={debugHotspots}
              selectedPersonId={selectedPedigreePersonId}
              answers={pedigreeAnswers}
              onSelectPerson={setSelectedPedigreePersonId}
              onApplyPhenotype={applyPedigreePhenotype}
              onPressGenotype={pressPedigreeGenotype}
            />
          ) : (
            <SceneView
              sceneId={currentScene}
              imageSrc={sceneAssets[currentScene]}
              hotspots={hotspotsByScene[currentScene]}
              debugHotspots={debugHotspots}
              onHotspotActivate={handleHotspotActivate}
            >
              {currentScene === "safeLock" && (
                <SafeLockScene value={safeInput} onPressGene={handleSafeGenePress} debugHotspots={debugHotspots} />
              )}
            </SceneView>
          )}
        </div>
        {currentScene !== "pedigree" && (
          <Sidebar
            onAccusation={() => setActivePopup("accusation")}
            onPedigree={() => setCurrentScene("pedigree")}
            onWatsonHint={() => setActivePopup("watsonHint")}
          />
        )}
      </div>

      {activePopup === "certificate" && <CertificateModal onClose={handleClosePopup} />}

      {activePopup && activePopup !== "certificate" && (
        <Modal
          title={popupTitles[activePopup]}
          imageSrc={popupAssets[activePopup]}
          onClose={handleClosePopup}
          closeOnBackdrop={activePopup !== "oath"}
          showCloseButton={activePopup !== "oath"}
        >
          {activePopup === "oath" && (
            <button className="oathStartButton" type="button" onClick={() => setActivePopup(null)} aria-label="비밀을 밝혀내라" />
          )}
          {activePopup === "accusation" && (
            <AccusationForm
              generation={accusationGeneration}
              member={accusationMember}
              onGenerationChange={setAccusationGeneration}
              onMemberChange={setAccusationMember}
              onSubmit={handleAccusationSubmit}
            />
          )}
        </Modal>
      )}
    </main>
  );
}
