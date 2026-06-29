import type { ReactNode } from "react";

const tokenPattern = /(FADH2|H2O|O2|NAD\+|H\+|e−|e-|Pi)/g;

export function ChemicalText({ text }: { text: string }) {
  const parts = text.split(tokenPattern).filter(Boolean);
  return <>{parts.map((part, index) => <ChemicalToken key={index} token={part} />)}</>;
}

function ChemicalToken({ token }: { token: string }) {
  if (token === "FADH2") return <>FADH<sub>2</sub></>;
  if (token === "H2O") return <>H<sub>2</sub>O</>;
  if (token === "O2") return <>O<sub>2</sub></>;
  if (token === "NAD+") return <>NAD<sup>+</sup></>;
  if (token === "H+") return <>H<sup>+</sup></>;
  if (token === "e−" || token === "e-") return <>e<sup>−</sup></>;
  if (token === "Pi") return <>P<sub>i</sub></>;
  return <>{token}</>;
}

export function chemical(text: string): ReactNode {
  return <ChemicalText text={text} />;
}
