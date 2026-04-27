import emailoviData from "@/data/emailovi.json";
import lotoviData from "@/data/lotovi.json";
import type { Email, Lot } from "@/types";

export interface WizardSeed {
  kupac_id: string;
  proizvodi: Array<{
    proizvod: string;
    kolicina: number;
    jedinicna_cijena: number;
    lot_ids: string[];
  }>;
  prevoznik: string;
  ruta: string;
  napomene: string;
  fromEmailId: number;
}

const PRICE_BY_PRODUCT: Record<string, number> = {
  "Sušeni vrganji klasa A": 37,
  "Sušene lisičarke": 42,
  "Miks gljiva": 42,
};

function fifoLots(proizvod: string, kolicina: number, lotovi: Lot[]): string[] {
  const candidates = lotovi
    .filter((l) => l.proizvod === proizvod && l.kolicina_ostatak > 0)
    .sort((a, b) => new Date(a.datum_otkupa).getTime() - new Date(b.datum_otkupa).getTime());

  const picked: string[] = [];
  let remaining = kolicina;
  for (const lot of candidates) {
    if (remaining <= 0) break;
    picked.push(lot.id);
    remaining -= lot.kolicina_ostatak;
  }
  return picked;
}

export function buildSeedFromEmail(emailId: number): WizardSeed | null {
  const email = (emailoviData as Email[]).find((e) => e.id === emailId);
  if (!email || email.kategorija !== "NARUDZBA" || !email.povezani_kupac_id) {
    return null;
  }

  const lotovi = lotoviData as Lot[];
  const text = email.email_text.toLowerCase();

  let proizvod = "Sušeni vrganji klasa A";
  if (
    text.includes("finferli") ||
    text.includes("lisičarke") ||
    text.includes("pfifferling") ||
    text.includes("chanterelle")
  ) {
    proizvod = "Sušene lisičarke";
  } else if (text.includes("miks") || text.includes("misch")) {
    proizvod = "Miks gljiva";
  }

  const kgMatch = email.email_text.match(/(\d{2,4})\s*kg/i);
  const kolicina = kgMatch ? Number(kgMatch[1]) : 100;
  const cijena = PRICE_BY_PRODUCT[proizvod] ?? 40;

  const carrier =
    email.povezani_kupac_id === "sarajevo-delikatesa" ||
    email.povezani_kupac_id === "trgovina-bl" ||
    email.povezani_kupac_id === "restoran-dubrovnik"
      ? "Balkan Kurir"
      : "Cargo Express";

  return {
    kupac_id: email.povezani_kupac_id,
    proizvodi: [
      {
        proizvod,
        kolicina,
        jedinicna_cijena: cijena,
        lot_ids: fifoLots(proizvod, kolicina, lotovi),
      },
    ],
    prevoznik: carrier,
    ruta: "Zvornik → destinacija",
    napomene: `Kreirano iz emaila #${emailId}: "${email.subject}"`,
    fromEmailId: emailId,
  };
}
