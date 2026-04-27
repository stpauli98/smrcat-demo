"use client";

import Link from "next/link";
import { useAppStore } from "@/stores/useAppStore";
import { StatusChip } from "@/components/shared/StatusChip";

export default function KupciPage() {
  const kupci = useAppStore((s) => s.kupci);
  const sorted = [...kupci].sort((a, b) => b.broj_posiljki - a.broj_posiljki);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-serif font-medium">Kupci</h1>
        <p className="text-sm text-muted-foreground">{kupci.length} aktivnih kupaca</p>
      </div>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-cream/60 text-xs text-muted-foreground uppercase">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Kupac</th>
              <th className="text-left px-5 py-3 font-medium">Adresa</th>
              <th className="text-left px-5 py-3 font-medium">Jezik</th>
              <th className="text-right px-5 py-3 font-medium">Pošiljki</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((k) => (
              <tr key={k.id} className="hover:bg-cream/40" data-test="kupac-row">
                <td className="px-5 py-3">
                  <Link href={`/kupci/${k.id}`} className="font-medium text-forest hover:underline">
                    {k.ime}
                  </Link>
                </td>
                <td className="px-5 py-3 text-sm text-muted-foreground">{k.adresa}</td>
                <td className="px-5 py-3 text-sm">{k.jezik}</td>
                <td className="px-5 py-3 text-sm text-right">{k.broj_posiljki}</td>
                <td className="px-5 py-3">
                  <StatusChip status={k.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
