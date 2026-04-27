"use client";

import Link from "next/link";
import { useAppStore } from "@/stores/useAppStore";
import { formatKg, formatCurrency } from "@/lib/format";
import type { Posiljka } from "@/types";

export function SadrzajList({ posiljka }: { posiljka: Posiljka }) {
  const lotovi = useAppStore((s) => s.lotovi);
  const kooperanti = useAppStore((s) => s.kooperanti);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden" data-test="sadrzaj-list">
      <div className="px-5 py-3 border-b border-border">
        <h2 className="text-sm font-semibold">Sadržaj pošiljke</h2>
      </div>
      <table className="w-full">
        <thead className="bg-cream/60 text-left text-xs text-muted-foreground uppercase">
          <tr>
            <th className="px-5 py-2.5 font-medium">Proizvod</th>
            <th className="px-5 py-2.5 font-medium">Lot</th>
            <th className="px-5 py-2.5 font-medium">Kooperant</th>
            <th className="px-5 py-2.5 font-medium text-right">Količina</th>
            <th className="px-5 py-2.5 font-medium text-right">Vrijednost</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {posiljka.proizvodi.flatMap((p) =>
            p.lot_ids.map((lotId) => {
              const lot = lotovi.find((l) => l.id === lotId);
              const kooperant = lot ? kooperanti.find((k) => k.id === lot.kooperant_id) : null;
              return (
                <tr key={`${p.proizvod}-${lotId}`} data-test="sadrzaj-row">
                  <td className="px-5 py-3 text-sm">{p.proizvod}</td>
                  <td className="px-5 py-3">
                    <span className="font-mono text-xs text-forest">{lotId}</span>
                  </td>
                  <td className="px-5 py-3 text-sm">
                    {kooperant ? (
                      <Link
                        href={`/kooperanti/${kooperant.id}?lot=${lotId}`}
                        data-test="lot-kooperant-link"
                        data-lot-id={lotId}
                        className="hover:text-forest hover:underline"
                      >
                        {kooperant.ime_osobe}, {kooperant.ime_lokacije}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-sm text-right">{formatKg(p.kolicina)}</td>
                  <td className="px-5 py-3 text-sm text-right">
                    {formatCurrency(p.kolicina * p.jedinicna_cijena, posiljka.valuta)}
                  </td>
                </tr>
              );
            }),
          )}
        </tbody>
        <tfoot className="bg-cream/60">
          <tr>
            <td colSpan={3} className="px-5 py-3 text-sm font-medium">
              Ukupno
            </td>
            <td className="px-5 py-3 text-sm font-medium text-right">
              {formatKg(posiljka.ukupna_kg)}
            </td>
            <td className="px-5 py-3 text-sm font-medium text-right" data-test="ukupna-vrijednost">
              {formatCurrency(posiljka.vrijednost, posiljka.valuta)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
