"use client";

import { Button } from "@/components/ui/button";

interface Props {
  prevoznik: string;
  datum_otpreme: string;
  ruta: string;
  napomene: string;
  onUpdate: (patch: { prevoznik?: string; datum_otpreme?: string; ruta?: string; napomene?: string }) => void;
  onNext: () => void;
  onBack: () => void;
}

const PREVOZNICI = ["Cargo Express", "Balkan Kurir", "DHL Freight", "Schenker"];

export function Step3Transport({
  prevoznik,
  datum_otpreme,
  ruta,
  napomene,
  onUpdate,
  onNext,
  onBack,
}: Props) {
  return (
    <div className="space-y-5" data-test="wizard-step-3">
      <div>
        <label className="text-sm font-medium block mb-2">Prevoznik</label>
        <div className="flex gap-2 flex-wrap">
          {PREVOZNICI.map((p) => (
            <button
              key={p}
              type="button"
              data-test="wizard-prevoznik-option"
              data-prevoznik={p}
              data-selected={prevoznik === p ? "true" : "false"}
              onClick={() => onUpdate({ prevoznik: p })}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                prevoznik === p
                  ? "bg-forest text-primary-foreground border-forest"
                  : "bg-card border-border hover:bg-cream"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="datum-otpreme" className="text-sm font-medium block mb-2">
            Datum otpreme
          </label>
          <input
            id="datum-otpreme"
            type="date"
            value={datum_otpreme}
            data-test="wizard-datum-otpreme"
            onChange={(e) => onUpdate({ datum_otpreme: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg"
          />
        </div>
        <div>
          <label htmlFor="ruta" className="text-sm font-medium block mb-2">
            Ruta
          </label>
          <input
            id="ruta"
            type="text"
            value={ruta}
            data-test="wizard-ruta"
            onChange={(e) => onUpdate({ ruta: e.target.value })}
            placeholder="Zvornik → München"
            className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg"
          />
        </div>
      </div>

      <div>
        <label htmlFor="napomene" className="text-sm font-medium block mb-2">
          Posebne napomene
        </label>
        <textarea
          id="napomene"
          value={napomene}
          data-test="wizard-napomene"
          onChange={(e) => onUpdate({ napomene: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg"
        />
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Nazad
        </Button>
        <Button onClick={onNext} disabled={!prevoznik} data-test="wizard-next">
          Sljedeći korak
        </Button>
      </div>
    </div>
  );
}
