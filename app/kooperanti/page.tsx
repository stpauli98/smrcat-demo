"use client";

import Link from "next/link";
import { useAppStore } from "@/stores/useAppStore";
import { StatusChip } from "@/components/shared/StatusChip";
import { formatDate } from "@/lib/format";

export default function KooperantiPage() {
  const kooperanti = useAppStore((s) => s.kooperanti);
  const lotovi = useAppStore((s) => s.lotovi);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-serif font-medium">Kooperanti</h1>
        <p className="text-sm text-muted-foreground">
          {kooperanti.length} aktivnih kooperanata · sledljivost po lotovima
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-cream/60 text-xs text-muted-foreground uppercase">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Kooperant</th>
              <th className="text-left px-5 py-3 font-medium">Lokacija</th>
              <th className="text-right px-5 py-3 font-medium">Lotova</th>
              <th className="text-left px-5 py-3 font-medium">BioSuisse validan do</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {kooperanti.map((k) => {
              const lotCount = lotovi.filter((l) => l.kooperant_id === k.id).length;
              const statusLabel =
                k.status === "aktivan"
                  ? "Aktivan kupac"
                  : k.status === "obnova u toku"
                    ? "Na čekanju"
                    : "Novi";
              return (
                <tr key={k.id} className="hover:bg-cream/40" data-test="kooperant-row">
                  <td className="px-5 py-3">
                    <Link
                      href={`/kooperanti/${k.id}`}
                      className="font-medium text-forest hover:underline"
                    >
                      {k.ime_osobe}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-sm">{k.ime_lokacije}</td>
                  <td className="px-5 py-3 text-sm text-right">{lotCount}</td>
                  <td className="px-5 py-3 text-sm">{formatDate(k.biosuisse_validan_do)}</td>
                  <td className="px-5 py-3">
                    <StatusChip status={statusLabel} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
