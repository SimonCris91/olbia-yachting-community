export const passportComponents = [
  { id: "engine", label: "Motore Honda BF135", group: "component" },
  { id: "display", label: "Display ASE 4.3", group: "component" },
  { id: "nmea", label: "Rete NMEA 2000", group: "component" },
  { id: "fuel-1", label: "Sensore carburante 1", group: "component" },
  { id: "fuel-2", label: "Sensore carburante 2", group: "component" },
  { id: "electrical", label: "Impianto elettrico", group: "component" },
  { id: "spares", label: "Ricambi e materiali", group: "spares" },
  { id: "admin", label: "Documenti amministrativi", group: "admin" },
  { id: "general", label: "Interventi generici", group: "general" },
] as const;

export type ComponentId = (typeof passportComponents)[number]["id"];
export type PassportStatus = "Da verificare" | "Confermato" | "Chiuso";
export type Urgency = "Bassa" | "Media" | "Alta";
export type EntryType =
  | "Documento"
  | "Foto"
  | "Nota tecnica"
  | "Ricambio"
  | "Intervento"
  | "Problema segnalato"
  | "Fattura"
  | "DDT"
  | "Ordine";

export type PassportEntry = {
  id: string;
  date: string;
  type: EntryType;
  title: string;
  description: string;
  componentId: ComponentId;
  source: string;
  status: PassportStatus;
  urgency: Urgency;
  internalNotes: string;
  attachmentName?: string;
  attachmentDataUrl?: string;
  demo?: boolean;
  confirmedAt?: string;
  executionConfirmedAt?: string;
  closedAt?: string;
};

export type Classification = {
  component: string;
  issue: string;
  intervention: string;
  materials: string;
  openActions: string;
  nextCheck: string;
  urgency: Urgency;
  attention: string;
  source: string;
  disclaimer: string;
};

export type PassportDraft = Omit<PassportEntry, "id" | "demo" | "confirmedAt" | "executionConfirmedAt" | "closedAt">;

export const entryTypes: EntryType[] = [
  "Documento",
  "Foto",
  "Nota tecnica",
  "Ricambio",
  "Intervento",
  "Problema segnalato",
  "Fattura",
  "DDT",
  "Ordine",
];
