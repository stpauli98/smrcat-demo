"use client";

import { useMemo } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useAppStore } from "@/stores/useAppStore";
import { StatusChip } from "@/components/shared/StatusChip";
import { Tabs } from "@/components/shared/Tabs";
import { PosiljkePoMjesecu } from "@/components/kupci/PosiljkePoMjesecuLazy";
import { KategorijaChip } from "@/components/shared/KategorijaChip";
import { JezikFlag } from "@/components/shared/JezikFlag";
import { formatCurrency, formatDate } from "@/lib/format";
import { ChevronLeft } from "lucide-react";

export default function KupacDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const allKupci = useAppStore((s) => s.kupci);
  const allPosiljke = useAppStore((s) => s.posiljke);
  const allEmailovi = useAppStore((s) => s.emailovi);
  const kupac = useMemo(() => allKupci.find((k) => k.id === id), [allKupci, id]);
  const posiljkePoKupcu = useMemo(
    () => allPosiljke.filter((p) => p.kupac_id === id),
    [allPosiljke, id],
  );
  const emailoviPoKupcu = useMemo(
    () => allEmailovi.filter((e) => e.povezani_kupac_id === id),
    [allEmailovi, id],
  );

  if (!kupac) return notFound();

  const ukupnoEur = posiljkePoKupcu
    .filter((p) => p.valuta === "EUR")
    .reduce((sum, p) => sum + p.vrijednost, 0);

  const tabs = [
    { id: "posiljke", label: "Pošiljke", count: posiljkePoKupcu.length },
    {
      id: "dokumenti",
      label: "Dokumenti",
      count: posiljkePoKupcu.flatMap((p) => p.dokumenti).length,
    },
    { id: "komunikacija", label: "Komunikacija", count: emailoviPoKupcu.length },
    { id: "biljeske", label: "Bilješke" },
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/kupci"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-forest"
      >
        <ChevronLeft className="w-4 h-4" /> Svi kupci
      </Link>

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
              KUPAC
            </div>
            <h1 className="text-2xl font-serif font-medium">{kupac.ime}</h1>
            <p className="text-sm text-muted-foreground mt-1">{kupac.adresa}</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span>Kontakt: {kupac.kontakt_osoba}</span>
              <span>·</span>
              <span>{kupac.email}</span>
              <span>·</span>
              <span>{kupac.payment_terms}</span>
            </div>
          </div>
          <StatusChip status={kupac.status} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div>
            <div className="text-xs text-muted-foreground uppercase">Pošiljki</div>
            <div className="text-xl font-serif font-semibold">{kupac.broj_posiljki}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase">Prosječna pošiljka</div>
            <div className="text-xl font-serif font-semibold">{kupac.prosjecna_kg} kg</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase">Pakovanje</div>
            <div className="text-xl font-serif font-semibold">{kupac.preferred_packaging}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase">Prevoznik</div>
            <div className="text-xl font-serif font-semibold">{kupac.preferred_carrier}</div>
          </div>
        </div>
      </div>

      <Tabs tabs={tabs} ariaLabel="Tabovi kupca">
        {(active) => {
          if (active === "posiljke") {
            return (
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-card p-5">
                  <h2 className="text-sm font-semibold mb-3">Pošiljke po mjesecu</h2>
                  <PosiljkePoMjesecu posiljke={posiljkePoKupcu} />
                </div>
                <div className="rounded-lg border border-border bg-card overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-cream/60 text-xs text-muted-foreground uppercase">
                      <tr>
                        <th className="text-left px-5 py-3 font-medium">Broj</th>
                        <th className="text-left px-5 py-3 font-medium">Datum</th>
                        <th className="text-right px-5 py-3 font-medium">Vrijednost</th>
                        <th className="text-left px-5 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {posiljkePoKupcu.map((p) => (
                        <tr key={p.id} data-test="kupac-posiljka-row">
                          <td className="px-5 py-2.5">
                            <Link
                              href={`/posiljke/${p.id}`}
                              className="font-mono text-forest hover:underline"
                            >
                              {p.broj}
                            </Link>
                          </td>
                          <td className="px-5 py-2.5 text-sm">{formatDate(p.datum_otpreme)}</td>
                          <td className="px-5 py-2.5 text-sm text-right">
                            {formatCurrency(p.vrijednost, p.valuta)}
                          </td>
                          <td className="px-5 py-2.5">
                            <StatusChip status={p.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {ukupnoEur > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Ukupan EUR promet: {formatCurrency(ukupnoEur, "EUR")}
                  </div>
                )}
              </div>
            );
          }
          if (active === "dokumenti") {
            const docs = posiljkePoKupcu.flatMap((p) =>
              p.dokumenti.map((d) => ({ ...d, posiljkaBroj: p.broj })),
            );
            if (docs.length === 0) {
              return (
                <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
                  Nema dokumenata za ovog kupca.
                </div>
              );
            }
            return (
              <ul className="rounded-lg border border-border bg-card divide-y divide-border">
                {docs.map((d) => (
                  <li key={d.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{d.ime}</div>
                      <div className="text-xs text-muted-foreground">
                        Pošiljka {d.posiljkaBroj}
                      </div>
                    </div>
                    <StatusChip status={d.status} />
                  </li>
                ))}
              </ul>
            );
          }
          if (active === "komunikacija") {
            if (emailoviPoKupcu.length === 0) {
              return (
                <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
                  Nema emailova razmijenjenih sa kupcem.
                </div>
              );
            }
            return (
              <ul className="rounded-lg border border-border bg-card divide-y divide-border">
                {emailoviPoKupcu.map((e) => (
                  <li key={e.id} className="px-5 py-3" data-test="komunikacija-email">
                    <div className="flex items-center gap-2 mb-1">
                      <KategorijaChip kategorija={e.kategorija} />
                      <JezikFlag jezik={e.jezik} />
                      <span className="text-xs text-muted-foreground">
                        {formatDate(e.vrijeme)}
                      </span>
                    </div>
                    <div className="text-sm font-medium">{e.subject}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {e.sender_ime ?? e.sender}
                    </div>
                  </li>
                ))}
              </ul>
            );
          }
          // biljeske
          return (
            <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
              Nema bilješki za ovog kupca.
            </div>
          );
        }}
      </Tabs>
    </div>
  );
}
