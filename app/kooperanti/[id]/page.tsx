"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { notFound, useSearchParams } from "next/navigation";
import { useAppStore } from "@/stores/useAppStore";
import { StatusChip } from "@/components/shared/StatusChip";
import { formatDate, formatKg } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { ChevronLeft, FileDown, MapPin } from "lucide-react";
import { simulateAuditExport } from "@/lib/mockAi";
import { cn } from "@/lib/utils";
import { MapaBiH } from "@/components/kooperanti/MapaBiH";

function KooperantContent({ id }: { id: string }) {
  const params = useSearchParams();
  const highlightedLot = params.get("lot");
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const allKooperanti = useAppStore((s) => s.kooperanti);
  const allLotovi = useAppStore((s) => s.lotovi);
  const allPosiljke = useAppStore((s) => s.posiljke);
  const kooperant = useMemo(() => allKooperanti.find((k) => k.id === id), [allKooperanti, id]);
  const lotovi = useMemo(
    () => allLotovi.filter((l) => l.kooperant_id === id),
    [allLotovi, id],
  );
  const lotsByPosiljka = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const p of allPosiljke) {
      for (const proizvod of p.proizvodi) {
        for (const lotId of proizvod.lot_ids) {
          const arr = map.get(lotId) ?? [];
          arr.push(p.broj);
          map.set(lotId, arr);
        }
      }
    }
    return map;
  }, [allPosiljke]);

  useEffect(() => {
    if (highlightedLot) {
      const el = document.querySelector(`[data-lot-id="${highlightedLot}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightedLot]);

  if (!kooperant) return notFound();

  const handleExport = async () => {
    setExporting(true);
    await simulateAuditExport(2500);
    setExporting(false);
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  return (
    <div className="space-y-6">
      <Link
        href="/kooperanti"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-forest"
      >
        <ChevronLeft className="w-4 h-4" /> Svi kooperanti
      </Link>

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
              KOOPERANT
            </div>
            <h1 className="text-2xl font-serif font-medium">{kooperant.ime_osobe}</h1>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="w-4 h-4" />
              {kooperant.ime_lokacije} · {kooperant.lat.toFixed(2)}°N, {kooperant.lng.toFixed(2)}°E
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              BioSuisse certifikat validan do{" "}
              <span className="font-medium text-foreground">
                {formatDate(kooperant.biosuisse_validan_do)}
              </span>
            </div>
          </div>
          <StatusChip
            status={
              kooperant.status === "aktivan"
                ? "Aktivan kupac"
                : kooperant.status === "obnova u toku"
                  ? "Na čekanju"
                  : "Novi"
            }
          />
        </div>
      </div>

      <MapaBiH highlightedKooperantId={kooperant.id} />

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold">Lotovi ovog kooperanta</h2>
          <span className="text-xs text-muted-foreground">{lotovi.length} lotova</span>
        </div>
        <table className="w-full">
          <thead className="bg-cream/60 text-xs text-muted-foreground uppercase">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Lot broj</th>
              <th className="text-left px-5 py-3 font-medium">Proizvod</th>
              <th className="text-left px-5 py-3 font-medium">Datum otkupa</th>
              <th className="text-right px-5 py-3 font-medium">Ulazno kg</th>
              <th className="text-right px-5 py-3 font-medium">Ostatak kg</th>
              <th className="text-left px-5 py-3 font-medium">Iskorišten u</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {lotovi.map((l) => {
              const inPosiljke = lotsByPosiljka.get(l.id) ?? [];
              const isHighlight = highlightedLot === l.id;
              return (
                <tr
                  key={l.id}
                  data-test="lot-row"
                  data-lot-id={l.id}
                  className={cn(isHighlight && "bg-warning/10")}
                >
                  <td className="px-5 py-2.5 font-mono text-xs text-forest">{l.id}</td>
                  <td className="px-5 py-2.5 text-sm">{l.proizvod}</td>
                  <td className="px-5 py-2.5 text-sm text-muted-foreground">
                    {formatDate(l.datum_otkupa)}
                  </td>
                  <td className="px-5 py-2.5 text-sm text-right">{formatKg(l.kolicina_ulaz)}</td>
                  <td className="px-5 py-2.5 text-sm text-right">
                    {formatKg(l.kolicina_ostatak)}
                  </td>
                  <td className="px-5 py-2.5 text-sm">
                    {inPosiljke.length === 0 ? (
                      <span className="text-muted-foreground italic">—</span>
                    ) : (
                      inPosiljke.map((broj) => (
                        <span key={broj} className="font-mono text-xs text-info mr-2">
                          {broj}
                        </span>
                      ))
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          onClick={handleExport}
          disabled={exporting}
          data-test="action-eksport-biosuisse"
        >
          <FileDown className="w-4 h-4 mr-2" />
          {exporting
            ? "Priprema BioSuisse paketa..."
            : exported
              ? "Paket spreman ✓"
              : "Eksport BioSuisse extract"}
        </Button>
      </div>
    </div>
  );
}

export default function KooperantDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Učitavanje...</div>}>
      <KooperantContent id={params.id} />
    </Suspense>
  );
}
