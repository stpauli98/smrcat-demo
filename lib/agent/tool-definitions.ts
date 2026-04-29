import type { AgentTool } from "./types";

export const TOOLS: AgentTool[] = [
  {
    name: "pretrazi_dokumente",
    description:
      "Pretražuje internu bazu znanja firme Smrčak (proizvodi, cijene, " +
      "sertifikati, procedure izvoza, FAQ, korištenje aplikacije). " +
      "KORISTI za pitanja o tome šta firma nudi, kako se nešto radi, " +
      "ili koja su pravila/procedure. Vraća chunkove sa source filename i score.",
    input_schema: {
      type: "object",
      properties: {
        upit: {
          type: "string",
          description: "Pitanje ili tema koju treba pretražiti.",
        },
        scope: {
          type: "string",
          enum: ["biznis", "app", "all"],
          description:
            "Filter po izvoru: 'biznis' za poslovne dokumente (cjenovnik, " +
            "katalog, sertifikati, procedure, FAQ), 'app' samo uputstvo " +
            "aplikacije, 'all' bez filtera (default).",
        },
      },
      required: ["upit"],
    },
  },
  {
    name: "provjeri_lot_zalihe",
    description:
      "Provjeri trenutne zalihe LOT-ova za dati proizvod sa FIFO predlogom " +
      "(najstariji LOT-ovi prvi). KORISTI za pitanja kao 'imamo li X na zalihi', " +
      "'koliko ima Y'. Vraća listu LOT-ova sa preostalim količinama, kooperantom " +
      "i datumom otkupa, plus FIFO predlog za zadatu količinu.",
    input_schema: {
      type: "object",
      properties: {
        proizvod: {
          type: "string",
          description:
            "Tačan naziv proizvoda kao u bazi (npr. 'Sušeni vrganji klasa A', " +
            "'Sušene lisičarke', 'Miks gljiva').",
        },
        trazena_kolicina_kg: {
          type: "number",
          description:
            "Opciono — željena količina u kg za FIFO alokaciju. " +
            "Ako je data, vraća konkretne LOT-ove koje treba uzeti.",
        },
      },
      required: ["proizvod"],
    },
  },
  {
    name: "nadji_kupca",
    description:
      "Pronalazi kupca po imenu firme ili emailu. Vraća profil sa " +
      "preferred packaging, prevoznikom, jezikom komunikacije, " +
      "broj prethodnih pošiljki, payment terms.",
    input_schema: {
      type: "object",
      properties: {
        upit: {
          type: "string",
          description:
            "Ime firme ili email (npr. 'Bio Naturkost', 'Bio Naturkost GmbH', " +
            "'thomas.weber@bio-naturkost.de').",
        },
      },
      required: ["upit"],
    },
  },
  {
    name: "nadji_posiljku",
    description:
      "Vraća detalje pošiljke po broju (npr. '2026/0143' ili '2026-0143'). " +
      "Sadrži kupca, status, vrijednost, težinu, listu proizvoda i lotova, " +
      "prevoznika, datum otpreme, statuse dokumenata.",
    input_schema: {
      type: "object",
      properties: {
        broj: {
          type: "string",
          description:
            "Broj pošiljke u formatu YYYY/NNNN ili YYYY-NNNN.",
        },
      },
      required: ["broj"],
    },
  },
  {
    name: "izracunaj_dostavu",
    description:
      "Računa cijenu DAP dostave po destinaciji i ukupnoj težini. " +
      "Vraća osnovnu cijenu po kg + ukupno EUR.",
    input_schema: {
      type: "object",
      properties: {
        destinacija: {
          type: "string",
          description:
            "Grad ili zemlja destinacije (npr. 'München', 'Milano', 'Beč', " +
            "'Pariz', 'Zürich', 'Amsterdam').",
        },
        kilogrami: {
          type: "number",
          description: "Ukupna težina pošiljke u kilogramima.",
        },
      },
      required: ["destinacija", "kilogrami"],
    },
  },
  {
    name: "lista_kooperanata",
    description:
      "Vraća listu svih kooperanata Smrčaka sa lokacijom, koordinatama " +
      "i statusom BioSuisse certifikata. KORISTI za pitanja o sljedivosti " +
      "i pokrivenosti regije.",
    input_schema: {
      type: "object",
      properties: {
        regija: {
          type: "string",
          description:
            "Opciono — filter po regiji (npr. 'Karakaj', 'Bratunac', 'Srebrenica'). " +
            "Bez filtera vraća sve.",
        },
      },
    },
  },
];

export const TOOL_NAMES = TOOLS.map((t) => t.name);
