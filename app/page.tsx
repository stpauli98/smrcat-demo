"use client";

import Link from "next/link";
import { Inbox, FileCheck, AlertTriangle, Crown, Plus, Users, Map } from "lucide-react";
import { useAppStore } from "@/stores/useAppStore";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const posiljke = useAppStore((s) => s.posiljke);
  const kupci = useAppStore((s) => s.kupci);
  const emailovi = useAppStore((s) => s.emailovi);

  // Hardcoded demo date to avoid hydration mismatch
  const DEMO_MONTH = 3; // April (0-indexed)
  const DEMO_YEAR = 2026;
  const ovajMjesec = posiljke.filter((p) => {
    const d = new Date(p.datum_kreiranja);
    return d.getMonth() === DEMO_MONTH && d.getFullYear() === DEMO_YEAR;
  }).length;

  const dokumentataZaPregled = posiljke
    .flatMap((p) => p.dokumenti)
    .filter((d) => d.status === "Čeka pregled" || d.status === "Upload").length;

  const posiljkiKasni = posiljke.filter(
    (p) => p.status === "Čeka spoljni upload" || p.status === "Reklamacija",
  ).length;

  const najveciKupac = [...kupci].sort((a, b) => b.broj_posiljki - a.broj_posiljki)[0];

  const nepročitanihEmailova = emailovi.filter((e) => !e.procitan).length;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-serif font-medium">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pregled aktivnosti i pošiljki za današnji dan
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild data-test="quick-nova-posiljka">
            <Link href="/posiljke/nova">
              <Plus className="w-4 h-4 mr-2" />
              Nova pošiljka
            </Link>
          </Button>
          <Button asChild variant="secondary" data-test="quick-inbox">
            <Link href="/inbox">
              <Inbox className="w-4 h-4 mr-2" />
              Inbox ({nepročitanihEmailova})
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Pošiljki ovaj mjesec"
          value={ovajMjesec}
          hint={`${posiljke.length} ukupno`}
          icon={Inbox}
        />
        <StatCard
          label="Dokumenata za pregled"
          value={dokumentataZaPregled}
          hint="Čeka odobrenje ili upload"
          icon={FileCheck}
          tone="warning"
        />
        <StatCard
          label="Pošiljki kasni"
          value={posiljkiKasni}
          hint="Reklamacija ili spoljni upload"
          icon={AlertTriangle}
          tone={posiljkiKasni > 0 ? "danger" : "default"}
        />
        <StatCard
          label="Top kupac"
          value={najveciKupac?.ime.split(" ")[0] ?? "—"}
          hint={`${najveciKupac?.broj_posiljki ?? 0} pošiljki`}
          icon={Crown}
          tone="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityFeed limit={10} />
        </div>
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Brze akcije
          </h2>
          <Link
            href="/inbox"
            className="block rounded-lg border border-border bg-card p-4 hover:bg-cream transition-colors"
          >
            <Inbox className="w-5 h-5 text-forest mb-2" />
            <div className="text-sm font-medium">Otvori Inbox</div>
            <div className="text-xs text-muted-foreground">
              {nepročitanihEmailova} nepročitanih
            </div>
          </Link>
          <Link
            href="/posiljke"
            className="block rounded-lg border border-border bg-card p-4 hover:bg-cream transition-colors"
          >
            <FileCheck className="w-5 h-5 text-forest mb-2" />
            <div className="text-sm font-medium">Sve pošiljke</div>
            <div className="text-xs text-muted-foreground">
              {posiljke.length} aktivnih i završenih
            </div>
          </Link>
          <Link
            href="/kupci"
            className="block rounded-lg border border-border bg-card p-4 hover:bg-cream transition-colors"
          >
            <Users className="w-5 h-5 text-forest mb-2" />
            <div className="text-sm font-medium">Kupci</div>
            <div className="text-xs text-muted-foreground">{kupci.length} aktivnih</div>
          </Link>
          <Link
            href="/kooperanti"
            className="block rounded-lg border border-border bg-card p-4 hover:bg-cream transition-colors"
          >
            <Map className="w-5 h-5 text-forest mb-2" />
            <div className="text-sm font-medium">Kooperanti</div>
            <div className="text-xs text-muted-foreground">Sledljivost po lotovima</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
