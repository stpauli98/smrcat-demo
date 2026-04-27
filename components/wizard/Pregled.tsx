"use client";

import { useAppStore } from "@/stores/useAppStore";
import { Button } from "@/components/ui/button";
import { formatKg, formatEUR, formatDate } from "@/lib/format";
import { GENERATION_DOC_ORDER } from "@/lib/mockAi";
import { Sparkles, FileText } from "lucide-react";

interface ProizvodEntry {
  proizvod: string;
  kolicina: number;
  jedinicna_cijena: number;
  lot_ids: string[];
}

interface Props {
  kupac_id: string;
  proizvodi: ProizvodEntry[];
  prevoznik: string;
  datum_otpreme: string;
  ruta: string;
  napomene: string;
  onGeneriraj: () => void;
  onBack: () => void;
}

export function Pregled({
  kupac_id,
  proizvodi,
  prevoznik,
  datum_otpreme,
  ruta,
  napomene,
  onGeneriraj,
  onBack,
}: Props) {
  const kupac = useAppStore((s) => s.kupci.find((k) => k.id === kupac_id));

  const ukupnoKg = proizvodi.reduce((s, p) => s + p.kolicina, 0);
  const ukupnoEur = proizvodi.reduce((s, p) => s + p.kolicina * p.jedinicna_cijena, 0);

  return (
    <div className="space-y-6" data-test="wizard-pregled">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground uppercase mb-1">Kupac</div>
          <div className="text-sm font-medium" data-test="pregled-kupac">{kupac?.ime ?? "—"}</div>
          <div className="text-xs text-muted-foreground">{kupac?.adresa}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground uppercase mb-1">Sadržaj</div>
          <div className="text-sm font-medium">{formatKg(ukupnoKg)}</div>
          <div className="text-xs text-muted-foreground" data-test="pregled-iznos">
            {formatEUR(ukupnoEur)}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground uppercase mb-1">Transport</div>
          <div className="text-sm font-medium">{prevoznik}</div>
          <div className="text-xs text-muted-foreground">
            {datum_otpreme ? formatDate(datum_otpreme) : "—"} · {ruta}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-forest" />
          <h2 className="text-sm font-semibold">Dokumenti koji će se generisati</h2>
        </div>
        <ul className="divide-y divide-border">
          {GENERATION_DOC_ORDER.map((d) => (
            <li
              key={d.docId}
              data-test="pregled-doc-row"
              className="px-5 py-2.5 flex items-center gap-3"
            >
              <FileText className="w-4 h-4 text-forest" />
              <span className="text-sm">{d.label}</span>
            </li>
          ))}
        </ul>
      </div>

      {napomene && (
        <div className="rounded-lg border border-border bg-cream/40 p-4 text-sm">
          <div className="text-xs text-muted-foreground uppercase mb-1">Napomene</div>
          <div>{napomene}</div>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Nazad
        </Button>
        <Button onClick={onGeneriraj} data-test="wizard-generiraj">
          <Sparkles className="w-4 h-4 mr-2" />
          Generiši dokumente
        </Button>
      </div>
    </div>
  );
}
