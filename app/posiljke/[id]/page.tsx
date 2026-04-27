"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { notFound, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAppStore } from "@/stores/useAppStore";
import { PosiljkaHeader } from "@/components/posiljke/PosiljkaHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { SadrzajList } from "@/components/posiljke/SadrzajList";
import { DokumentiList } from "@/components/posiljke/DokumentiList";
import { AuditTimeline } from "@/components/posiljke/AuditTimeline";
import { Button } from "@/components/ui/button";
import { GenerationProgress } from "@/components/dokument/GenerationProgress";
import { AuditExportDialog } from "@/components/posiljke/AuditExportDialog";
import { Toast } from "@/components/shared/Toast";
import { formatCurrency } from "@/lib/format";
import { simulateSend } from "@/lib/mockAi";
import { Euro, Weight, Boxes, FileStack, FileSearch, Send, ChevronLeft } from "lucide-react";

function PosiljkaDetailInner({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isGenerating = searchParams.get("generating") === "1";
  const [showGen, setShowGen] = useState(isGenerating);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const setStoreGenerating = useAppStore((s) => s.setGenerating);
  const setPosiljkaStatus = useAppStore((s) => s.setPosiljkaStatus);
  const approveAllDocs = useAppStore((s) => s.approveAllDocs);

  useEffect(() => {
    if (isGenerating) setShowGen(true);
  }, [isGenerating]);

  const handleGenDone = () => {
    setShowGen(false);
    setStoreGenerating(false);
    router.replace(`/posiljke/${id}`);
  };

  const handleSend = async () => {
    setSending(true);
    await simulateSend();
    approveAllDocs(id);
    setPosiljkaStatus(id, "U tranzitu");
    setSending(false);
    setToast("Email otpremljen kupcu i prevozniku");
    setTimeout(() => setToast(null), 3500);
  };

  const allPosiljke = useAppStore((s) => s.posiljke);
  const allKupci = useAppStore((s) => s.kupci);
  const statusOverride = useAppStore((s) => s.posiljkaStatusOverrides[id]);
  const posiljka = useMemo(() => allPosiljke.find((p) => p.id === id), [allPosiljke, id]);
  const kupac = useMemo(
    () => (posiljka ? allKupci.find((k) => k.id === posiljka.kupac_id) ?? null : null),
    [posiljka, allKupci],
  );

  if (!posiljka) return notFound();

  const effective = statusOverride ? { ...posiljka, status: statusOverride } : posiljka;
  const lotCount = posiljka.proizvodi.reduce((sum, p) => sum + p.lot_ids.length, 0);
  const firstUnreviewedDoc = posiljka.dokumenti.find(
    (d) => d.status === "Čeka pregled" || d.status === "Upload",
  );

  return (
    <div className="space-y-6">
      <Link
        href="/posiljke"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-forest"
      >
        <ChevronLeft className="w-4 h-4" /> Sve pošiljke
      </Link>

      <PosiljkaHeader posiljka={effective} kupac={kupac} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Vrijednost"
          value={formatCurrency(posiljka.vrijednost, posiljka.valuta)}
          icon={Euro}
        />
        <StatCard label="Težina" value={`${posiljka.ukupna_kg} kg`} icon={Weight} />
        <StatCard label="Lot brojeva" value={lotCount} icon={Boxes} />
        <StatCard
          label="Dokumenata"
          value={posiljka.dokumenti.length}
          icon={FileStack}
        />
      </div>

      <SadrzajList posiljka={posiljka} />

      <DokumentiList posiljka={posiljka} />

      <AuditTimeline events={posiljka.audit_events} />

      <div className="flex flex-wrap gap-3 pt-2">
        {firstUnreviewedDoc && (
          <Button asChild>
            <Link href={`/posiljke/${posiljka.id}/dokumenti/${firstUnreviewedDoc.id}`}>
              <FileSearch className="w-4 h-4 mr-2" />
              Otvori prvi dokument za pregled
            </Link>
          </Button>
        )}
        <AuditExportDialog
          posiljkaBroj={posiljka.broj}
          trigger={
            <Button variant="secondary" data-test="action-eksport-audit">
              <FileStack className="w-4 h-4 mr-2" />
              Eksport audit log
            </Button>
          }
        />
        <Button
          variant="secondary"
          data-test="action-posalji-paket"
          onClick={handleSend}
          disabled={sending}
        >
          <Send className={`w-4 h-4 mr-2 ${sending ? "animate-pulse" : ""}`} />
          {sending ? "Slanje paketa..." : "Pošalji paket dokumenata"}
        </Button>
      </div>

      {showGen && <GenerationProgress onDone={handleGenDone} />}
      {toast && <Toast message={toast} />}
    </div>
  );
}

export default function PosiljkaDetailPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Učitavanje...</div>}>
      <PosiljkaDetailInner id={params.id} />
    </Suspense>
  );
}
