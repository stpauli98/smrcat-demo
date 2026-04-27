"use client";

import { create } from "zustand";
import kupciData from "@/data/kupci.json";
import posiljkeData from "@/data/posiljke.json";
import kooperantiData from "@/data/kooperanti.json";
import lotoviData from "@/data/lotovi.json";
import emailoviData from "@/data/emailovi.json";
import type {
  Kupac,
  Posiljka,
  Kooperant,
  Lot,
  Email,
  EmailKategorija,
  Jezik,
  Prioritet,
  DokumentStatus,
  PosiljkaStatus,
} from "@/types";

interface InboxFilters {
  kategorija: EmailKategorija | "SVE";
  jezik: Jezik | "SVE";
  prioritet: Prioritet | "SVE";
  prikaziSpam: boolean;
}

interface DraftPosiljka {
  kupac_id: string | null;
  proizvodi: Array<{ proizvod: string; kolicina: number; lot_ids: string[] }>;
  prevoznik: string;
  datum_otpreme: string;
  ruta: string;
  napomene: string;
  fromEmailId?: number;
}

interface AppState {
  // Static data (hydrated from JSON)
  kupci: Kupac[];
  posiljke: Posiljka[];
  kooperanti: Kooperant[];
  lotovi: Lot[];
  emailovi: Email[];

  // Inbox slice
  selectedEmailId: number | null;
  inboxFilters: InboxFilters;
  setSelectedEmail: (id: number | null) => void;
  updateInboxFilters: (filters: Partial<InboxFilters>) => void;
  markEmailAsRead: (id: number) => void;

  // Posiljke slice
  selectedPosiljkaId: string | null;
  posiljkaStatusOverrides: Record<string, PosiljkaStatus>;
  setSelectedPosiljka: (id: string | null) => void;
  setPosiljkaStatus: (id: string, status: PosiljkaStatus) => void;

  // Document slice
  documentStatusOverrides: Record<string, DokumentStatus>;
  documentEditedFields: Record<string, Record<string, string | number>>;
  setDocumentStatus: (docId: string, status: DokumentStatus) => void;
  setDocumentField: (docId: string, fieldKey: string, value: string | number) => void;
  approveAllDocs: (posiljkaId: string) => void;

  // Wizard slice
  wizardStep: 1 | 2 | 3 | 4;
  wizardDraft: DraftPosiljka;
  setWizardStep: (step: 1 | 2 | 3 | 4) => void;
  updateWizardDraft: (patch: Partial<DraftPosiljka>) => void;
  resetWizard: () => void;

  // AI simulation slice
  isGenerating: boolean;
  generationStartedAt: number | null;
  generationProgress: { docId: string; status: "idle" | "generating" | "done" }[];
  setGenerating: (value: boolean) => void;
  setGenerationProgress: (
    progress: { docId: string; status: "idle" | "generating" | "done" }[],
  ) => void;
  resetGeneration: () => void;
}

const initialDraft: DraftPosiljka = {
  kupac_id: null,
  proizvodi: [],
  prevoznik: "",
  datum_otpreme: "",
  ruta: "",
  napomene: "",
};

export const useAppStore = create<AppState>((set) => ({
  // Static data
  kupci: kupciData as Kupac[],
  posiljke: posiljkeData as Posiljka[],
  kooperanti: kooperantiData as Kooperant[],
  lotovi: lotoviData as Lot[],
  emailovi: emailoviData as Email[],

  // Inbox
  selectedEmailId: null,
  inboxFilters: {
    kategorija: "SVE",
    jezik: "SVE",
    prioritet: "SVE",
    prikaziSpam: true,
  },
  setSelectedEmail: (id) => set({ selectedEmailId: id }),
  updateInboxFilters: (filters) =>
    set((state) => ({ inboxFilters: { ...state.inboxFilters, ...filters } })),
  markEmailAsRead: (id) =>
    set((state) => ({
      emailovi: state.emailovi.map((e) =>
        e.id === id ? { ...e, procitan: true } : e,
      ),
    })),

  // Posiljke
  selectedPosiljkaId: null,
  posiljkaStatusOverrides: {},
  setSelectedPosiljka: (id) => set({ selectedPosiljkaId: id }),
  setPosiljkaStatus: (id, status) =>
    set((state) => ({
      posiljkaStatusOverrides: { ...state.posiljkaStatusOverrides, [id]: status },
    })),

  // Document
  documentStatusOverrides: {},
  documentEditedFields: {},
  setDocumentStatus: (docId, status) =>
    set((state) => ({
      documentStatusOverrides: { ...state.documentStatusOverrides, [docId]: status },
    })),
  setDocumentField: (docId, fieldKey, value) =>
    set((state) => ({
      documentEditedFields: {
        ...state.documentEditedFields,
        [docId]: {
          ...(state.documentEditedFields[docId] ?? {}),
          [fieldKey]: value,
        },
      },
    })),
  approveAllDocs: (posiljkaId) =>
    set((state) => {
      const posiljka = state.posiljke.find((p) => p.id === posiljkaId);
      if (!posiljka) return {};
      const overrides = { ...state.documentStatusOverrides };
      for (const doc of posiljka.dokumenti) {
        overrides[doc.id] = "Odobreno";
      }
      return { documentStatusOverrides: overrides };
    }),

  // Wizard
  wizardStep: 1,
  wizardDraft: initialDraft,
  setWizardStep: (step) => set({ wizardStep: step }),
  updateWizardDraft: (patch) =>
    set((state) => ({ wizardDraft: { ...state.wizardDraft, ...patch } })),
  resetWizard: () => set({ wizardStep: 1, wizardDraft: initialDraft }),

  // AI simulation
  isGenerating: false,
  generationStartedAt: null,
  generationProgress: [],
  setGenerating: (value) =>
    set({
      isGenerating: value,
      generationStartedAt: value ? Date.now() : null,
    }),
  setGenerationProgress: (progress) => set({ generationProgress: progress }),
  resetGeneration: () =>
    set({ isGenerating: false, generationStartedAt: null, generationProgress: [] }),
}));

// Selectors
export const getEmailById = (id: number | null) =>
  id == null ? null : useAppStore.getState().emailovi.find((e) => e.id === id) ?? null;

export const getPosiljkaById = (id: string | null) => {
  if (!id) return null;
  const state = useAppStore.getState();
  const p = state.posiljke.find((x) => x.id === id);
  if (!p) return null;
  const statusOverride = state.posiljkaStatusOverrides[id];
  return statusOverride ? { ...p, status: statusOverride } : p;
};

export const getPosiljkaByBroj = (broj: string) => {
  const state = useAppStore.getState();
  const p = state.posiljke.find((x) => x.broj === broj);
  if (!p) return null;
  const statusOverride = state.posiljkaStatusOverrides[p.id];
  return statusOverride ? { ...p, status: statusOverride } : p;
};

export const getKupacById = (id: string | null) =>
  id == null ? null : useAppStore.getState().kupci.find((k) => k.id === id) ?? null;

export const getKooperantById = (id: string | null) =>
  id == null ? null : useAppStore.getState().kooperanti.find((k) => k.id === id) ?? null;

export const getLotById = (id: string) =>
  useAppStore.getState().lotovi.find((l) => l.id === id) ?? null;

// Dev-only window exposure for E2E tests
if (typeof window !== "undefined") {
  (window as unknown as { __APP_STORE__: typeof useAppStore }).__APP_STORE__ =
    useAppStore;
}
