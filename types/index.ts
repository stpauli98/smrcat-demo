export type Jezik = "DE" | "IT" | "BCS" | "EN" | "FR" | "NL";
export type Valuta = "EUR" | "BAM" | "CHF";
export type Prioritet = "visok" | "srednji" | "nizak";

export type EmailKategorija =
  | "NARUDZBA"
  | "UPIT"
  | "REKLAMACIJA"
  | "DOKUMENTACIJA"
  | "LOGISTIKA"
  | "SPAM"
  | "INTERNI";

export type PosiljkaStatus =
  | "Draft"
  | "Čeka pregled"
  | "Čeka spoljni upload"
  | "Spremno za otpremu"
  | "U tranzitu"
  | "Završeno"
  | "Reklamacija";

export type DokumentStatus =
  | "U izradi"
  | "Čeka pregled"
  | "Odobreno"
  | "Vraćeno"
  | "Upload";

export type DokumentTip =
  | "komercijalna_faktura"
  | "packing_list"
  | "cmr"
  | "eur1"
  | "biosuisse_organic"
  | "fitosanitarni"
  | "izvozna_deklaracija"
  | "komorski_certifikat";

export interface Kupac {
  id: string;
  ime: string;
  adresa: string;
  drzava: string;
  jezik: Jezik;
  valuta: Valuta;
  payment_terms: string;
  preferred_packaging: string;
  preferred_carrier: string;
  broj_posiljki: number;
  prosjecna_kg: number;
  kontakt_osoba: string;
  email: string;
  status: "Aktivan kupac" | "Novi" | "Na čekanju";
}

export interface Kooperant {
  id: string;
  ime_lokacije: string;
  ime_osobe: string;
  lat: number;
  lng: number;
  biosuisse_validan_do: string;
  status: "aktivan" | "obnova u toku" | "neaktivan";
}

export interface Lot {
  id: string;
  proizvod: string;
  kooperant_id: string;
  datum_otkupa: string;
  kolicina_ulaz: number;
  kolicina_ostatak: number;
}

export interface ProizvodUPosiljki {
  proizvod: string;
  kolicina: number;
  jedinicna_cijena: number;
  lot_ids: string[];
}

export interface Dokument {
  id: string;
  posiljka_id: string;
  tip: DokumentTip;
  ime: string;
  jezik: Jezik | "DE/EN";
  status: DokumentStatus;
  generisao: string;
  generisano_u: string;
  pdf_path: string | null;
  ai_polja?: Record<string, string | number>;
}

export interface AuditEvent {
  id: string;
  posiljka_id: string;
  vrijeme: string;
  autor: string;
  tip: "kreirano" | "generisano" | "odobreno" | "poslano" | "primljeno" | "uploadovano";
  opis: string;
}

export interface Posiljka {
  id: string;
  broj: string;
  kupac_id: string;
  datum_kreiranja: string;
  datum_otpreme: string;
  status: PosiljkaStatus;
  vrijednost: number;
  valuta: Valuta;
  ukupna_kg: number;
  proizvodi: ProizvodUPosiljki[];
  prevoznik: string;
  ruta: string;
  napomene: string;
  dokumenti: Dokument[];
  audit_events: AuditEvent[];
}

export interface Email {
  id: number;
  kategorija: EmailKategorija;
  ocekivana_kategorija: EmailKategorija;
  prioritet: Prioritet;
  jezik: Jezik;
  sender: string;
  sender_ime?: string;
  subject: string;
  email_text: string;
  vrijeme: string;
  procitan: boolean;
  ai_sazetak: string;
  povezana_posiljka_broj?: string;
  povezani_kupac_id?: string;
}
