"use client";

import Link from "next/link";
import { useAppStore } from "@/stores/useAppStore";
import { StatusChip } from "@/components/shared/StatusChip";
import { formatDate, formatCurrency, formatKg } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function PosiljkePage() {
  const posiljke = useAppStore((s) => s.posiljke);
  const kupci = useAppStore((s) => s.kupci);
  const overrides = useAppStore((s) => s.posiljkaStatusOverrides);

  const sorted = [...posiljke].sort(
    (a, b) => new Date(b.datum_kreiranja).getTime() - new Date(a.datum_kreiranja).getTime(),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-serif font-medium">Pošiljke</h1>
          <p className="text-sm text-muted-foreground">{posiljke.length} pošiljki ukupno</p>
        </div>
        <Button asChild>
          <Link href="/posiljke/nova">
            <Plus className="w-4 h-4 mr-2" />
            Nova pošiljka
          </Link>
        </Button>
      </div>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-cream/60 text-xs text-muted-foreground uppercase">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Broj</th>
              <th className="text-left px-5 py-3 font-medium">Kupac</th>
              <th className="text-left px-5 py-3 font-medium">Datum otpreme</th>
              <th className="text-right px-5 py-3 font-medium">Težina</th>
              <th className="text-right px-5 py-3 font-medium">Vrijednost</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((p) => {
              const kupac = kupci.find((k) => k.id === p.kupac_id);
              const status = overrides[p.id] ?? p.status;
              return (
                <tr key={p.id} className="hover:bg-cream/40" data-test="posiljka-row">
                  <td className="px-5 py-3">
                    <Link
                      href={`/posiljke/${p.id}`}
                      className="font-mono font-medium text-forest hover:underline"
                    >
                      {p.broj}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-sm">{kupac?.ime ?? "—"}</td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">
                    {formatDate(p.datum_otpreme)}
                  </td>
                  <td className="px-5 py-3 text-sm text-right">{formatKg(p.ukupna_kg)}</td>
                  <td className="px-5 py-3 text-sm text-right">
                    {formatCurrency(p.vrijednost, p.valuta)}
                  </td>
                  <td className="px-5 py-3">
                    <StatusChip status={status} />
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
