"use client";

import { useState } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { Button } from "@/components/ui/button";
import { Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  selectedKupacId: string | null;
  onSelect: (id: string) => void;
  onNext: () => void;
}

export function Step1Kupac({ selectedKupacId, onSelect, onNext }: Props) {
  const kupci = useAppStore((s) => s.kupci);
  const [query, setQuery] = useState("");

  const filtered = kupci.filter(
    (k) =>
      k.ime.toLowerCase().includes(query.toLowerCase()) ||
      k.adresa.toLowerCase().includes(query.toLowerCase()),
  );

  const selected = kupci.find((k) => k.id === selectedKupacId);

  return (
    <div className="space-y-6" data-test="wizard-step-1">
      <div>
        <label className="text-sm font-medium block mb-2">Kupac</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Traži postojeće ili kreiraj novog kupca"
            data-test="wizard-kupac-search"
            className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-forest/40"
          />
        </div>
      </div>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[280px] overflow-auto">
        {filtered.map((k) => {
          const isSel = k.id === selectedKupacId;
          return (
            <li key={k.id}>
              <button
                type="button"
                data-test="wizard-kupac-option"
                data-kupac-id={k.id}
                data-selected={isSel ? "true" : "false"}
                onClick={() => onSelect(k.id)}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-colors flex items-start justify-between gap-2",
                  isSel
                    ? "border-forest bg-cream"
                    : "border-border bg-card hover:bg-cream/60",
                )}
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{k.ime}</div>
                  <div className="text-xs text-muted-foreground truncate">{k.adresa}</div>
                </div>
                {isSel && <Check className="w-4 h-4 text-forest shrink-0 mt-0.5" />}
              </button>
            </li>
          );
        })}
      </ul>

      {selected && (
        <div
          data-test="wizard-kupac-card"
          className="rounded-lg border border-border bg-card p-5 space-y-2"
        >
          <div className="text-sm font-semibold">{selected.ime}</div>
          <div className="text-xs text-muted-foreground">{selected.adresa}</div>
          <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
            <div>
              <span className="text-muted-foreground">Jezik: </span>
              <span className="font-medium">{selected.jezik}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Pošiljki: </span>
              <span className="font-medium">{selected.broj_posiljki}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Pakovanje: </span>
              <span className="font-medium">{selected.preferred_packaging}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Prevoznik: </span>
              <span className="font-medium">{selected.preferred_carrier}</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!selectedKupacId} data-test="wizard-next">
          Sljedeći korak
        </Button>
      </div>
    </div>
  );
}
