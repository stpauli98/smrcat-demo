"use client";

import { useMemo } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { cn } from "@/lib/utils";
import type { Dokument } from "@/types";

const EMPTY_FIELDS = Object.freeze({}) as Record<string, string | number>;

interface Props {
  dokument: Dokument;
}

const FIELD_LABELS: Record<string, string> = {
  broj_fakture: "Broj fakture",
  datum: "Datum",
  kupac: "Kupac",
  iznos: "Iznos",
  kolicina_kg: "Količina (kg)",
  ukupno_paketa: "Ukupno paketa",
  tezina_kg: "Težina (kg)",
  prevoznik: "Prevoznik",
  registracija: "Registracija",
  ruta: "Ruta",
  porijeklo: "Porijeklo",
  destinacija: "Destinacija",
  kooperanti: "Kooperanti",
  carinski_broj: "Carinski broj",
  broj_certifikata: "Broj certifikata",
  datum_izdavanja: "Datum izdavanja",
};

export function EditForm({ dokument }: Props) {
  const allEdits = useAppStore((s) => s.documentEditedFields);
  const setDocumentField = useAppStore((s) => s.setDocumentField);
  const editedFields = useMemo(() => allEdits[dokument.id] ?? EMPTY_FIELDS, [allEdits, dokument.id]);

  if (!dokument.ai_polja) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Ovaj dokument nema editabilna polja.
      </div>
    );
  }

  return (
    <form className="space-y-4 p-6" data-test="edit-form" onSubmit={(e) => e.preventDefault()}>
      {Object.entries(dokument.ai_polja).map(([key, originalValue]) => {
        const isEdited = key in editedFields;
        const currentValue = isEdited ? editedFields[key] : originalValue;
        const label = FIELD_LABELS[key] ?? key;
        return (
          <div key={key}>
            <label
              htmlFor={`field-${key}`}
              className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5"
            >
              {label}
              {!isEdited && (
                <span className="ml-2 text-[10px] font-normal text-warning">AI generisano</span>
              )}
              {isEdited && (
                <span className="ml-2 text-[10px] font-normal text-success">Verificirano</span>
              )}
            </label>
            <input
              id={`field-${key}`}
              type="text"
              data-test="edit-field"
              data-field-key={key}
              data-field-state={isEdited ? "edited" : "ai"}
              value={String(currentValue)}
              onChange={(e) => {
                const val =
                  typeof originalValue === "number" ? Number(e.target.value) : e.target.value;
                setDocumentField(dokument.id, key, val);
              }}
              className={cn(
                "w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-forest/40 transition-colors",
                isEdited
                  ? "bg-green-50 border-success/40"
                  : "bg-yellow-50 border-warning/40",
              )}
            />
          </div>
        );
      })}
    </form>
  );
}
