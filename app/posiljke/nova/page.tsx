"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { WizardStepper } from "@/components/wizard/WizardStepper";
import { Step1Kupac } from "@/components/wizard/Step1Kupac";
import { Step2Proizvodi } from "@/components/wizard/Step2Proizvodi";
import { Step3Transport } from "@/components/wizard/Step3Transport";
import { Pregled } from "@/components/wizard/Pregled";
import { buildSeedFromEmail } from "@/lib/wizardSeed";
import { useAppStore } from "@/stores/useAppStore";

interface ProizvodEntry {
  proizvod: string;
  kolicina: number;
  jedinicna_cijena: number;
  lot_ids: string[];
}

function plus7Days(): string {
  const d = new Date(Date.UTC(2026, 3, 27));
  d.setUTCDate(d.getUTCDate() + 7);
  return d.toISOString().slice(0, 10);
}

function NovaPosiljkaInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromEmail = searchParams.get("fromEmail");
  const setGenerating = useAppStore((s) => s.setGenerating);

  const seed = useMemo(
    () => (fromEmail ? buildSeedFromEmail(Number(fromEmail)) : null),
    [fromEmail],
  );

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [kupacId, setKupacId] = useState<string | null>(seed?.kupac_id ?? null);
  const [proizvodi, setProizvodi] = useState<ProizvodEntry[]>(
    seed?.proizvodi ?? [
      { proizvod: "Sušeni vrganji klasa A", kolicina: 100, jedinicna_cijena: 37, lot_ids: [] },
    ],
  );
  const [prevoznik, setPrevoznik] = useState<string>(seed?.prevoznik ?? "Cargo Express");
  const [datumOtpreme, setDatumOtpreme] = useState<string>(plus7Days());
  const [ruta, setRuta] = useState<string>(seed?.ruta ?? "Zvornik → München");
  const [napomene, setNapomene] = useState<string>(seed?.napomene ?? "");

  useEffect(() => {
    if (seed) {
      setKupacId(seed.kupac_id);
      setProizvodi(seed.proizvodi);
      setPrevoznik(seed.prevoznik);
      setNapomene(seed.napomene);
    }
  }, [seed]);

  const handleGenerate = () => {
    setGenerating(true);
    router.push(`/posiljke/2026-0143?generating=1`);
  };

  return (
    <div className="space-y-6">
      <Link
        href="/posiljke"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-forest"
      >
        <ChevronLeft className="w-4 h-4" /> Sve pošiljke
      </Link>

      <div>
        <h1 className="text-2xl font-serif font-medium">Nova pošiljka</h1>
        {fromEmail && (
          <p className="text-sm text-muted-foreground mt-1">
            AI je popunio podatke iz emaila. Provjeri i potvrdi.
          </p>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card py-5">
        <WizardStepper current={step} />
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        {step === 1 && (
          <Step1Kupac
            selectedKupacId={kupacId}
            onSelect={setKupacId}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <Step2Proizvodi
            proizvodi={proizvodi}
            onUpdate={setProizvodi}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <Step3Transport
            prevoznik={prevoznik}
            datum_otpreme={datumOtpreme}
            ruta={ruta}
            napomene={napomene}
            onUpdate={(patch) => {
              if (patch.prevoznik !== undefined) setPrevoznik(patch.prevoznik);
              if (patch.datum_otpreme !== undefined) setDatumOtpreme(patch.datum_otpreme);
              if (patch.ruta !== undefined) setRuta(patch.ruta);
              if (patch.napomene !== undefined) setNapomene(patch.napomene);
            }}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && kupacId && (
          <Pregled
            kupac_id={kupacId}
            proizvodi={proizvodi}
            prevoznik={prevoznik}
            datum_otpreme={datumOtpreme}
            ruta={ruta}
            napomene={napomene}
            onGeneriraj={handleGenerate}
            onBack={() => setStep(3)}
          />
        )}
      </div>
    </div>
  );
}

export default function NovaPosiljkaPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Učitavanje...</div>}>
      <NovaPosiljkaInner />
    </Suspense>
  );
}
