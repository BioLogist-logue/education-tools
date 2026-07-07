import type { CSSProperties } from "react";

type SafeLockSceneProps = {
  value: string;
  onPressGene: (gene: string) => void;
  debugHotspots: boolean;
};

type SafeGeneButton = {
  gene: "A" | "a" | "X" | "Y";
  left: number;
  top: number;
  width: number;
  height: number;
};

const safeGeneButtons: SafeGeneButton[] = [
  { gene: "A", left: 47.4, top: 48.0, width: 6.0, height: 8.0 },
  { gene: "a", left: 42.0, top: 57.0, width: 6.0, height: 8.0 },
  { gene: "X", left: 52.7, top: 57.0, width: 6.0, height: 8.0 },
  { gene: "Y", left: 47.4, top: 66.3, width: 6.0, height: 8.0 },
];

export function SafeLockScene({ value, onPressGene, debugHotspots }: SafeLockSceneProps) {
  return (
    <div className="safeLockLayer" aria-label="Safe keypad">
      <div className="safeCodeReadout" aria-live="polite">
        {value.padEnd(4, "_")}
      </div>
      {safeGeneButtons.map((button) => {
        const style: CSSProperties = {
          left: button.left + "%",
          top: button.top + "%",
          width: button.width + "%",
          height: button.height + "%",
        };

        return (
          <button
            key={button.gene}
            type="button"
            className="imageHotButton safeGeneButton"
            data-debug={debugHotspots ? "true" : "false"}
            style={style}
            onClick={() => onPressGene(button.gene)}
            aria-label={button.gene}
          >
            {debugHotspots && <span>{button.gene}</span>}
          </button>
        );
      })}
    </div>
  );
}
