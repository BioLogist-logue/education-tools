export type PedigreeSex = "male" | "female";
export type PhenotypeTool = "trait" | "normal";

export type PedigreePersonPosition = {
  id: string;
  label: string;
  sex: PedigreeSex;
  left: number;
  top: number;
  width: number;
  height: number;
};

export type PedigreeAnswer = {
  phenotype?: PhenotypeTool;
  genotype?: string;
};

export const genotypeTools = ["A", "a", "X", "Y"] as const;
export type GenotypeTool = (typeof genotypeTools)[number];

export const pedigreePeople: PedigreePersonPosition[] = [
  { id: "1-1", label: "1-1", sex: "male", left: 31.4, top: 16.2, width: 2.9, height: 6.0 },
  { id: "1-2", label: "1-2", sex: "female", left: 40.1, top: 16.0, width: 2.9, height: 6.0 },
  { id: "1-3", label: "1-3", sex: "male", left: 56.8, top: 16.2, width: 2.9, height: 6.0 },
  { id: "1-4", label: "1-4", sex: "female", left: 66.5, top: 16.1, width: 2.9, height: 6.0 },
  { id: "2-1", label: "2-1", sex: "female", left: 35.9, top: 30.0, width: 2.9, height: 6.0 },
  { id: "2-2", label: "2-2", sex: "male", left: 51.5, top: 30.0, width: 2.9, height: 6.0 },
  { id: "2-3", label: "2-3", sex: "female", left: 59.7, top: 30.8, width: 2.9, height: 6.0 },
  { id: "2-4", label: "2-4", sex: "male", left: 68.0, top: 30.8, width: 2.9, height: 6.0 },
  { id: "2-5", label: "2-5", sex: "female", left: 75.0, top: 30.8, width: 2.9, height: 6.0 },
  { id: "3-1", label: "3-1", sex: "female", left: 30.0, top: 44.4, width: 2.9, height: 6.0 },
  { id: "3-2", label: "3-2", sex: "male", left: 35.7, top: 44.4, width: 2.9, height: 6.0 },
  { id: "3-3", label: "3-3", sex: "female", left: 43.5, top: 44.4, width: 2.9, height: 6.0 },
  { id: "3-4", label: "3-4", sex: "male", left: 51.6, top: 44.4, width: 2.9, height: 6.0 },
  { id: "3-5", label: "3-5", sex: "female", left: 59.1, top: 44.5, width: 2.9, height: 6.0 },
  { id: "3-6", label: "3-6", sex: "male", left: 71.6, top: 44.5, width: 2.9, height: 6.0 },
  { id: "4-1", label: "4-1", sex: "male", left: 26.9, top: 58.9, width: 2.9, height: 6.0 },
  { id: "4-2", label: "4-2", sex: "female", left: 33.6, top: 58.9, width: 2.9, height: 6.0 },
  { id: "4-3", label: "4-3", sex: "male", left: 40.0, top: 58.9, width: 2.9, height: 6.0 },
  { id: "4-4", label: "4-4", sex: "male", left: 52.7, top: 59.0, width: 2.9, height: 6.0 },
  { id: "4-5", label: "4-5", sex: "female", left: 59.9, top: 59.1, width: 2.9, height: 6.0 },
];
