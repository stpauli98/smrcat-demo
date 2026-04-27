"use client";

import { useAppStore } from "@/stores/useAppStore";
import { Button } from "@/components/ui/button";
import { formatKg, formatEUR } from "@/lib/format";

interface ProizvodEntry {
  proizvod: string;
  kolicina: number;
  jedinicna_cijena: number;
  lot_ids: string[];
}

interface Props {
  proizvodi: ProizvodEntry[];
  onUpdate: (proizvodi: ProizvodEntry[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step2Proizvodi({ proizvodi, onUpdate, onNext, onBack }: Props) {
  const lotovi = useAppStore((s) => s.lotovi);
  const kooperanti = useAppStore((s) => s.kooperanti);

  const updateKolicina = (idx: number, kolicina: number) => {
    const next = [...proizvodi];
    next[idx] = { ...next[idx], kolicina };
    onUpdate(next);
  };

  const ukupnoKg = proizvodi.reduce((sum, p) => sum + p.kolicina, 0);
  const ukupnoEur = proizvodi.reduce((sum, p) => sum + p.kolicina * p.jedinicna_cijena, 0);

  return (
    <div className="space-y-6" data-test="wizard-step-2">
      <div className="text-sm text-muted-foreground">
        AI je predložio proizvode i lotove na osnovu narudžbe. Lotovi su izabrani po FIFO logici
        (najstariji prvi).
      </div>

      <div className="space-y-3">
        {proizvodi.map((p, idx) => (
          <div
            key={idx}
            data-test="wizard-proizvod-row"
            data-proizvod={p.proizvod}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="text-sm font-medium">{p.proizvod}</div>
                <div className="text-xs text-muted-foreground">
                  {formatEUR(p.jedinicna_cijena)} / kg
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={p.kolicina}
                  data-test="wizard-kolicina"
                  onChange={(e) => updateKolicina(idx, Number(e.target.value))}
                  className="w-24 px-3 py-2 text-sm bg-card border border-border rounded-lg text-right"
                />
                <span className="text-sm text-muted-foreground">kg</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <div className="text-xs text-muted-foreground mb-2">
                Predloženi lotovi (FIFO):
              </div>
              <div className="flex flex-wrap gap-2">
                {p.lot_ids.map((lotId) => {
                  const lot = lotovi.find((l) => l.id === lotId);
                  const koop = lot ? kooperanti.find((k) => k.id === lot.kooperant_id) : null;
                  return (
                    <span
                      key={lotId}
                      data-test="wizard-lot-chip"
                      data-lot-id={lotId}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cream text-xs"
                    >
                      <span className="font-mono font-medium text-forest">{lotId}</span>
                      {koop && (
                        <span className="text-muted-foreground">
                          · {koop.ime_lokacije}
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-lg bg-cream p-4">
        <div className="text-sm">
          <span className="text-muted-foreground">Ukupno: </span>
          <span className="font-medium" data-test="wizard-ukupno-kg">{formatKg(ukupnoKg)}</span>
        </div>
        <div className="text-sm font-medium" data-test="wizard-ukupno-eur">
          {formatEUR(ukupnoEur)}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Nazad
        </Button>
        <Button onClick={onNext} data-test="wizard-next">
          Sljedeći korak
        </Button>
      </div>
    </div>
  );
}
