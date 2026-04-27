"use client";

import type { Email, EmailKategorija } from "@/types";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export interface ClassificationResult {
  kategorija: EmailKategorija;
  prioritet: "visok" | "srednji" | "nizak";
  jezik: string;
  povezana_posiljka_broj?: string;
}

export async function simulateClassification(
  email: Email,
  delayMs = 200,
): Promise<ClassificationResult> {
  await sleep(delayMs);
  return {
    kategorija: email.kategorija,
    prioritet: email.prioritet,
    jezik: email.jezik,
    povezana_posiljka_broj: email.povezana_posiljka_broj,
  };
}

export const GENERATION_DOC_ORDER = [
  { docId: "komercijalna-faktura-de", label: "Komercijalna faktura na njemačkom" },
  { docId: "packing-list", label: "Packing list DE/EN" },
  { docId: "cmr", label: "CMR transport dokument" },
  { docId: "eur1", label: "EUR.1 povlašteno porijeklo" },
  { docId: "biosuisse", label: "BioSuisse organic prateći" },
  { docId: "izvozna-deklaracija", label: "Izvozna carinska deklaracija" },
  { docId: "fitosanitarni", label: "Fitosanitarni certifikat (spoljni)" },
  { docId: "komorski", label: "Komorski certifikat o porijeklu (spoljni)" },
] as const;

export interface GenerationStep {
  index: number;
  docId: string;
  label: string;
  status: "generating" | "done";
}

const STEP_DURATIONS_MS = [1800, 1800, 1800, 1800, 1800, 1800, 1800, 2500];

export async function* simulateDocumentGeneration(): AsyncGenerator<GenerationStep, void, void> {
  for (let i = 0; i < GENERATION_DOC_ORDER.length; i++) {
    const meta = GENERATION_DOC_ORDER[i];
    yield { index: i, docId: meta.docId, label: meta.label, status: "generating" };
    await sleep(STEP_DURATIONS_MS[i]);
    yield { index: i, docId: meta.docId, label: meta.label, status: "done" };
  }
}

export async function simulateRegenerate(delayMs = 2200): Promise<void> {
  await sleep(delayMs);
}

export async function simulateSend(delayMs = 3000): Promise<void> {
  await sleep(delayMs);
}

export async function simulateUrgentSend(delayMs = 1500): Promise<void> {
  await sleep(delayMs);
}

export async function simulateAuditExport(delayMs = 4000): Promise<void> {
  await sleep(delayMs);
}
