import kupciData from "@/data/kupci.json";
import posiljkeData from "@/data/posiljke.json";
import lotoviData from "@/data/lotovi.json";
import kooperantiData from "@/data/kooperanti.json";
import {
  buildScopeFilter,
  embedQuery,
  loadEnv,
  makeClients,
  searchTopK,
} from "@/lib/rag";
import type { Kupac, Posiljka, Lot, Kooperant } from "@/types";
import type { ChatScope } from "@/lib/rag";

type ToolHandler = (input: Record<string, unknown>) => Promise<unknown>;

// === pretrazi_dokumente — RAG kao tool ===
export const pretraziDokumente: ToolHandler = async (input) => {
  const upit = String(input.upit ?? "").trim();
  const scope = (input.scope as ChatScope | undefined) ?? "all";
  if (!upit) return { uspjeh: false, greska: "Upit je prazan" };

  try {
    const env = loadEnv();
    const { openai, index } = makeClients(env);
    const vector = await embedQuery(openai, upit);
    const filter = buildScopeFilter(scope);
    const sources = await searchTopK(index, vector, 5, filter);
    return {
      uspjeh: true,
      broj_rezultata: sources.length,
      izvori: sources.map((s) => ({
        source: s.source,
        score: Number(s.score.toFixed(3)),
        chunk_index: s.chunkIndex,
        text: s.text.slice(0, 600),
      })),
    };
  } catch (err) {
    return {
      uspjeh: false,
      greska: err instanceof Error ? err.message : String(err),
    };
  }
};

// === provjeri_lot_zalihe — FIFO alokacija ===
export const provjeriLotZalihe: ToolHandler = async (input) => {
  const proizvod = String(input.proizvod ?? "").trim();
  const trazena =
    typeof input.trazena_kolicina_kg === "number"
      ? input.trazena_kolicina_kg
      : undefined;
  const lotovi = lotoviData as Lot[];
  const kooperanti = kooperantiData as Kooperant[];

  const matching = lotovi.filter(
    (l) =>
      l.proizvod.toLowerCase() === proizvod.toLowerCase() &&
      l.kolicina_ostatak > 0,
  );
  if (matching.length === 0) {
    const dostupni = Array.from(new Set(lotovi.map((l) => l.proizvod)));
    return {
      uspjeh: false,
      greska: `Nema dostupnih LOT-ova za proizvod '${proizvod}'.`,
      dostupni_proizvodi: dostupni,
    };
  }

  const sorted = [...matching].sort(
    (a, b) =>
      new Date(a.datum_otkupa).getTime() - new Date(b.datum_otkupa).getTime(),
  );
  const ukupno = sorted.reduce((sum, l) => sum + l.kolicina_ostatak, 0);

  const enrichLot = (lot: Lot) => {
    const koop = kooperanti.find((k) => k.id === lot.kooperant_id);
    return {
      lot_id: lot.id,
      kooperant: koop?.ime_osobe ?? "?",
      lokacija: koop?.ime_lokacije ?? "?",
      datum_otkupa: lot.datum_otkupa,
      kolicina_ostatak_kg: lot.kolicina_ostatak,
    };
  };

  let fifo_predlog: ReturnType<typeof enrichLot>[] | undefined;
  let fifo_dostupno = false;
  if (typeof trazena === "number" && trazena > 0) {
    fifo_predlog = [];
    let ostalo = trazena;
    for (const lot of sorted) {
      if (ostalo <= 0) break;
      fifo_predlog.push(enrichLot(lot));
      ostalo -= lot.kolicina_ostatak;
    }
    fifo_dostupno = ostalo <= 0;
  }

  return {
    uspjeh: true,
    proizvod,
    ukupno_dostupno_kg: ukupno,
    broj_lotova: sorted.length,
    svi_lotovi: sorted.map(enrichLot),
    trazena_kolicina_kg: trazena,
    fifo_predlog,
    fifo_dostupno,
  };
};

// === nadji_kupca ===
export const nadjiKupca: ToolHandler = async (input) => {
  const upit = String(input.upit ?? "").trim().toLowerCase();
  if (!upit) return { uspjeh: false, greska: "Upit je prazan" };
  const kupci = kupciData as Kupac[];

  const matches = kupci.filter(
    (k) =>
      k.ime.toLowerCase().includes(upit) ||
      k.email.toLowerCase().includes(upit) ||
      k.id.toLowerCase().includes(upit),
  );

  if (matches.length === 0) {
    return {
      uspjeh: false,
      greska: `Kupac '${input.upit}' nije pronađen.`,
      lista_kupaca: kupci.map((k) => ({
        id: k.id,
        ime: k.ime,
        drzava: k.drzava,
      })),
    };
  }

  return {
    uspjeh: true,
    broj_rezultata: matches.length,
    kupci: matches.map((k) => ({
      id: k.id,
      ime: k.ime,
      adresa: k.adresa,
      drzava: k.drzava,
      jezik_komunikacije: k.jezik,
      valuta: k.valuta,
      payment_terms: k.payment_terms,
      preferred_packaging: k.preferred_packaging,
      preferred_carrier: k.preferred_carrier,
      broj_prethodnih_posiljki: k.broj_posiljki,
      kontakt_osoba: k.kontakt_osoba,
      email: k.email,
      status: k.status,
    })),
  };
};

// === nadji_posiljku ===
export const nadjiPosiljku: ToolHandler = async (input) => {
  const broj = String(input.broj ?? "").trim();
  const id = broj.replace("/", "-");
  const posiljke = posiljkeData as Posiljka[];
  const p = posiljke.find((x) => x.id === id || x.broj === broj);
  if (!p) {
    return {
      uspjeh: false,
      greska: `Pošiljka '${broj}' nije pronađena.`,
      dostupni_brojevi: posiljke.map((x) => x.broj),
    };
  }
  return {
    uspjeh: true,
    broj: p.broj,
    kupac_id: p.kupac_id,
    status: p.status,
    datum_kreiranja: p.datum_kreiranja,
    datum_otpreme: p.datum_otpreme,
    vrijednost: p.vrijednost,
    valuta: p.valuta,
    ukupna_kg: p.ukupna_kg,
    proizvodi: p.proizvodi,
    prevoznik: p.prevoznik,
    ruta: p.ruta,
    napomene: p.napomene,
    broj_dokumenata: p.dokumenti.length,
    dokumenti_status: p.dokumenti.map((d) => ({
      ime: d.ime,
      status: d.status,
    })),
  };
};

// === izracunaj_dostavu ===
const DAP_DOPLATA: Record<string, number> = {
  münchen: 0.18,
  munchen: 0.18,
  munich: 0.18,
  berlin: 0.22,
  milano: 0.22,
  milan: 0.22,
  bologna: 0.2,
  beč: 0.15,
  wien: 0.15,
  vienna: 0.15,
  pariz: 0.32,
  paris: 0.32,
  lyon: 0.28,
  zürich: 0.28,
  zurich: 0.28,
  genève: 0.3,
  geneva: 0.3,
  amsterdam: 0.26,
  madrid: 0.42,
};

export const izracunajDostavu: ToolHandler = async (input) => {
  const dest = String(input.destinacija ?? "").trim();
  const kg = Number(input.kilogrami);
  if (!dest) return { uspjeh: false, greska: "Destinacija je prazna" };
  if (!Number.isFinite(kg) || kg <= 0) {
    return { uspjeh: false, greska: "Težina mora biti broj veći od 0" };
  }
  const key = dest.toLowerCase();
  const eurPerKg = DAP_DOPLATA[key];
  if (eurPerKg === undefined) {
    return {
      uspjeh: false,
      greska: `Ne dostavljamo DAP do '${dest}' u standardnoj listi.`,
      dostupne_destinacije: Object.keys(DAP_DOPLATA).filter((k) =>
        /^[a-zšđčćž]+$/i.test(k),
      ),
    };
  }
  return {
    uspjeh: true,
    destinacija: dest,
    kilogrami: kg,
    cijena_po_kg_eur: eurPerKg,
    ukupno_eur: Math.round(kg * eurPerKg * 100) / 100,
    napomena: "Cijena se dodaje na FCA Zvornik cijenu proizvoda.",
  };
};

// === lista_kooperanata ===
export const listaKooperanata: ToolHandler = async (input) => {
  const regija =
    typeof input.regija === "string" ? input.regija.toLowerCase() : "";
  const kooperanti = kooperantiData as Kooperant[];
  const filtered = regija
    ? kooperanti.filter((k) => k.ime_lokacije.toLowerCase().includes(regija))
    : kooperanti;
  return {
    uspjeh: true,
    broj: filtered.length,
    kooperanti: filtered.map((k) => ({
      id: k.id,
      ime_osobe: k.ime_osobe,
      lokacija: k.ime_lokacije,
      koordinate: { lat: k.lat, lng: k.lng },
      biosuisse_validan_do: k.biosuisse_validan_do,
      status: k.status,
    })),
  };
};

// === Registar ===
export const TOOL_HANDLERS: Record<string, ToolHandler> = {
  pretrazi_dokumente: pretraziDokumente,
  provjeri_lot_zalihe: provjeriLotZalihe,
  nadji_kupca: nadjiKupca,
  nadji_posiljku: nadjiPosiljku,
  izracunaj_dostavu: izracunajDostavu,
  lista_kooperanata: listaKooperanata,
};
