# Full Package — Agent + Widget Production Patterns

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **VERIFIKACIJSKO PRAVILO:** Faza nije završena dok ne prolaze sva 4 gate-a:
> 1. `npm run build` (Next.js production compile, exit 0, bez TS greški)
> 2. `npm run lint` (ESLint čist)
> 3. Playwright e2e testovi specifični za fazu (chromium + webkit)
> 4. Playwright full suite ne smije regresovati (sve ranije faze i dalje prolaze)
>
> **Tek kad sva 4 prolaze, prelazi se na sljedeću fazu.**

**Goal:** Pretvoriti postojeći RAG chatbot u **AI Agent** sa tool use pattern-om i nadograditi widget sa **production patternima** iz AGENT_GUIDE i WIDGET_GUIDE — perzistencija razgovora, tool call indikatori, dinamičke quick replies, operativni mode koji koristi alate.

**Architecture:** Pet faza, svaka samodovoljna sa verifikacijom. Faza 11 dodaje agent backend (`lib/agent/`) i refactoruje `/api/chat` na petlju Claude → tool_use → execute → repeat. SSE protokol se proširuje sa `tool_call_start`/`tool_call_end` event-ima. Faza 12 dodaje UI komponente koje vizualizuju alat u toku ("Provjeravam zalihe..."). Faza 13 perzistira conversation history u localStorage sa 7-day TTL. Faza 14 uvodi treći mode "Operativni" koji aktivira agent pristup, plus dinamičke welcome poruke i quick replies po mode-u. Faza 15 je polish (a11y, console clean, hard refresh) + final commit.

**Tech Stack:** Next.js 14 App Router · TypeScript · Anthropic SDK (tool use) · Pinecone (RAG kao prvi tool) · Playwright (e2e) · localStorage (history)

---

## Background

Trenutni chatbot je RAG-only — odgovara iz dokumenata kroz Pinecone search. Ne može da:
- Provjeri trenutne LOT zalihe sa FIFO alokacijom
- Lookup-uje konkretnog kupca i njegov profil
- Računa transport sa popustom za količinu
- Kombinuje više izvora podataka (kupac + zalihe + transport) u jednom odgovoru

AGENT_GUIDE.md pokazuje **tool use pattern** — LLM dobija listu alata sa opisima i sam odlučuje šta poziva. WIDGET_GUIDE.md pokazuje production widget patterne (perzistencija, tool indikatori, branding).

Kombinacijom: chatbot postaje **agent** koji u "Operativni" modu može stvarno raditi multi-step rezonovanje nad podacima, dok zadržava RAG funkcionalnost u "Interno znanje" / "Aplikacija" modovima.

---

## Globalna File Structure (cilj nakon svih faza)

```
smrcak-demo/
├── lib/
│   ├── agent/                          # 🆕 Agent core
│   │   ├── tools.ts                    # implementacije alata
│   │   ├── tool-definitions.ts         # JSON schema za Claude
│   │   ├── runner.ts                   # agent petlja sa max_iterations
│   │   └── types.ts                    # ChatScope ostaje, dodaju se ToolCall, AgentEvent
│   ├── rag.ts                          # postojeći; refactor — `pretrazi_dokumente` postaje tool
│   ├── format.ts                       # postojeći
│   └── relativeTime.ts                 # postojeći
├── app/
│   └── api/
│       └── chat/
│           └── route.ts                # ✏️ refactor — koristi runAgent() iz lib/agent/runner
├── components/
│   └── chatbot/
│       ├── ChatPanel.tsx               # ✏️ 3 moda + dinamičke quick replies
│       ├── FloatingChatbot.tsx         # ✏️ a11y improvements
│       ├── MessageBubble.tsx           # ✏️ integriše ToolCallIndicator
│       ├── SourcesPopover.tsx          # postojeći
│       ├── ToolCallIndicator.tsx       # 🆕 vizualizacija alat u toku
│       ├── useChatStream.ts            # ✏️ parsira tool_call_* event-ove
│       ├── useChatHistory.ts           # 🆕 localStorage perzistencija
│       └── types.ts                    # ✏️ dodaje ChatToolCall tip
├── data/
│   ├── system_prompt.md                # ✏️ proširen sa <agent_tools> sekcijom
│   └── dokumenti/                      # postojeći
└── e2e/
    ├── faza-11-agent-backend.spec.ts   # 🆕
    ├── faza-12-tool-indicators.spec.ts # 🆕
    ├── faza-13-history.spec.ts         # 🆕
    ├── faza-14-operativni-mode.spec.ts # 🆕
    └── faza-15-polish.spec.ts          # 🆕
```

---

## Faza 11 — Agent Backend (tools + runner + API refactor)

**Cilj:** Tool use pattern pokrenut server-side. `/api/chat` može da pozove Claude sa alatima i izvrši njegove tool_use blokove kroz petlju. SSE protokol prošireniji za tool eventove.

**Vrijeme:** 4-6 sati

### File Structure faze

- Create: `lib/agent/types.ts`
- Create: `lib/agent/tool-definitions.ts`
- Create: `lib/agent/tools.ts`
- Create: `lib/agent/runner.ts`
- Modify: `app/api/chat/route.ts`
- Create: `scripts/test-tools.mjs` (smoke test za tools layer)
- Create: `e2e/faza-11-agent-backend.spec.ts`

### Task 11.1: Tool definitions (JSON schemas)

**Files:**
- Create: `lib/agent/types.ts`
- Create: `lib/agent/tool-definitions.ts`

- [ ] **Step 1: Definiši TypeScript tipove**

Kreiraj `lib/agent/types.ts`:

```typescript
import type { Tool } from "@anthropic-ai/sdk/resources/messages";
import type { ChatScope } from "@/lib/rag";

export type AgentTool = Tool;

export interface ToolCallRecord {
  id: string;
  name: string;
  input: unknown;
  result: unknown;
  durationMs: number;
  error?: string;
}

export interface AgentResult {
  finalText: string;
  toolCalls: ToolCallRecord[];
  iterations: number;
  inputTokens: number;
  outputTokens: number;
}

export type SseEvent =
  | { type: "sources"; sources: Array<{ source: string; score: number; chunkIndex: number; preview: string }> }
  | { type: "tool_call_start"; id: string; name: string; input: unknown }
  | { type: "tool_call_end"; id: string; name: string; result: unknown; durationMs: number }
  | { type: "tool_call_error"; id: string; name: string; error: string }
  | { type: "delta"; content: string }
  | { type: "done" }
  | { type: "error"; message: string };

export type { ChatScope };
```

- [ ] **Step 2: Definiši tool schemas**

Kreiraj `lib/agent/tool-definitions.ts`:

```typescript
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
      "Vraća osnovnu cijenu + doplatu za težinu i ukupno EUR.",
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
          description:
            "Ukupna težina pošiljke u kilogramima.",
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
```

- [ ] **Step 3: Verifikuj kompilaciju**

Run: `cd /Users/nmil/Desktop/smrcak-demo && npx tsc --noEmit`

Expected: bez greški.

### Task 11.2: Tool implementacije (read JSON, FIFO logika)

**Files:**
- Create: `lib/agent/tools.ts`

- [ ] **Step 1: Implementacije svih 6 alata**

Kreiraj `lib/agent/tools.ts`:

```typescript
import kupciData from "@/data/kupci.json";
import posiljkeData from "@/data/posiljke.json";
import lotoviData from "@/data/lotovi.json";
import kooperantiData from "@/data/kooperanti.json";
import { embedQuery, makeClients, searchTopK, buildScopeFilter, loadEnv } from "@/lib/rag";
import type { Kupac, Posiljka, Lot, Kooperant, ChatScope } from "@/types";

interface ToolHandler {
  (input: Record<string, unknown>): Promise<unknown>;
}

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
  const trazena = typeof input.trazena_kolicina_kg === "number"
    ? input.trazena_kolicina_kg
    : undefined;
  const lotovi = lotoviData as Lot[];
  const kooperanti = kooperantiData as Kooperant[];

  const matching = lotovi.filter(
    (l) => l.proizvod.toLowerCase() === proizvod.toLowerCase() && l.kolicina_ostatak > 0,
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
    (a, b) => new Date(a.datum_otkupa).getTime() - new Date(b.datum_otkupa).getTime(),
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
      lista_kupaca: kupci.map((k) => ({ id: k.id, ime: k.ime, drzava: k.drzava })),
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
  "münchen": 0.18, munchen: 0.18, munich: 0.18,
  "berlin": 0.22,
  "milano": 0.22, milan: 0.22,
  "bologna": 0.20,
  "beč": 0.15, "wien": 0.15, vienna: 0.15,
  "pariz": 0.32, paris: 0.32,
  "lyon": 0.28,
  "zürich": 0.28, "zurich": 0.28,
  "genève": 0.30, "geneva": 0.30,
  "amsterdam": 0.26,
  "madrid": 0.42,
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
      dostupne_destinacije: Object.keys(DAP_DOPLATA).filter((k) => /^[a-zšđčćž]+$/i.test(k)),
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
  const regija = typeof input.regija === "string" ? input.regija.toLowerCase() : "";
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
```

- [ ] **Step 2: Verifikuj TypeScript build**

Run: `cd /Users/nmil/Desktop/smrcak-demo && npx tsc --noEmit`

Expected: bez greški.

### Task 11.3: Smoke test za tools (no API keys needed)

**Files:**
- Create: `scripts/test-tools.mjs`

- [ ] **Step 1: Smoke test bez Anthropic/OpenAI**

Kreiraj `scripts/test-tools.mjs`:

```javascript
#!/usr/bin/env node
/**
 * Smoke test za lib/agent/tools.ts.
 * Pokreće svih 5 alata koji ne traže Pinecone/OpenAI/Anthropic
 * (pretrazi_dokumente preskačemo jer traži API ključeve).
 *
 * Run: node scripts/test-tools.mjs
 */
import { register } from "node:module";
import { pathToFileURL } from "node:url";

// Učitaj TS preko tsx loader-a (tsx je dev dep)
register("tsx/esm", pathToFileURL("./"));

const {
  provjeriLotZalihe,
  nadjiKupca,
  nadjiPosiljku,
  izracunajDostavu,
  listaKooperanata,
} = await import("./lib/agent/tools.ts");

let pass = 0;
let fail = 0;

function check(name, cond, detail = "") {
  if (cond) {
    console.log(`  ✓ ${name}`);
    pass++;
  } else {
    console.log(`  ✗ ${name} ${detail}`);
    fail++;
  }
}

console.log("\n=== provjeri_lot_zalihe ===");
{
  const r = await provjeriLotZalihe({ proizvod: "Sušeni vrganji klasa A", trazena_kolicina_kg: 500 });
  check("uspjeh", r.uspjeh === true);
  check("broj_lotova > 0", r.broj_lotova > 0);
  check("fifo_predlog je array", Array.isArray(r.fifo_predlog));
  check("fifo_dostupno za 500kg", r.fifo_dostupno === true, JSON.stringify({ fifo_dostupno: r.fifo_dostupno, ukupno: r.ukupno_dostupno_kg }));
}
{
  const r = await provjeriLotZalihe({ proizvod: "Nepostojeci proizvod" });
  check("greska za nepostojeci", r.uspjeh === false);
  check("dostupni_proizvodi je array", Array.isArray(r.dostupni_proizvodi));
}

console.log("\n=== nadji_kupca ===");
{
  const r = await nadjiKupca({ upit: "Bio Naturkost" });
  check("uspjeh", r.uspjeh === true);
  check("nasao 1 ili vise", r.broj_rezultata >= 1);
  check("kupci[0] ima ime", typeof r.kupci?.[0]?.ime === "string");
}
{
  const r = await nadjiKupca({ upit: "thomas.weber@bio-naturkost.de" });
  check("nasao po emailu", r.uspjeh === true && r.broj_rezultata >= 1);
}

console.log("\n=== nadji_posiljku ===");
{
  const r = await nadjiPosiljku({ broj: "2026/0143" });
  check("uspjeh", r.uspjeh === true);
  check("broj === 2026/0143", r.broj === "2026/0143");
  check("status postoji", typeof r.status === "string");
}

console.log("\n=== izracunaj_dostavu ===");
{
  const r = await izracunajDostavu({ destinacija: "München", kilogrami: 200 });
  check("uspjeh", r.uspjeh === true);
  check("ukupno_eur === 36", r.ukupno_eur === 36, `dobio ${r.ukupno_eur}`);
}
{
  const r = await izracunajDostavu({ destinacija: "Bagdad", kilogrami: 100 });
  check("greska za nepoznatu destinaciju", r.uspjeh === false);
}

console.log("\n=== lista_kooperanata ===");
{
  const r = await listaKooperanata({});
  check("uspjeh", r.uspjeh === true);
  check("broj === 8", r.broj === 8);
}
{
  const r = await listaKooperanata({ regija: "karakaj" });
  check("filter po regiji", r.broj === 1, `dobio ${r.broj}`);
}

console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
```

- [ ] **Step 2: Pokreni smoke test**

Run: `cd /Users/nmil/Desktop/smrcak-demo && node scripts/test-tools.mjs`

Expected output:
```
=== provjeri_lot_zalihe ===
  ✓ uspjeh
  ✓ broj_lotova > 0
  ✓ fifo_predlog je array
  ✓ fifo_dostupno za 500kg
  ✓ greska za nepostojeci
  ✓ dostupni_proizvodi je array
=== nadji_kupca ===
  ✓ uspjeh
  ...
14 pass, 0 fail
```

### Task 11.4: Agent runner

**Files:**
- Create: `lib/agent/runner.ts`

- [ ] **Step 1: Agent petlja sa max_iterations**

Kreiraj `lib/agent/runner.ts`:

```typescript
import Anthropic from "@anthropic-ai/sdk";
import type {
  Message,
  MessageParam,
  ToolUseBlock,
} from "@anthropic-ai/sdk/resources/messages";
import { CHAT_MODEL, TEMPERATURE } from "@/lib/rag";
import { TOOLS } from "./tool-definitions";
import { TOOL_HANDLERS } from "./tools";
import type { AgentResult, ToolCallRecord, SseEvent } from "./types";

const MAX_ITERATIONS = 6;

export interface RunAgentOptions {
  anthropic: Anthropic;
  systemPrompt: string;
  history: MessageParam[];
  emit: (event: SseEvent) => void;
}

export async function runAgent({
  anthropic,
  systemPrompt,
  history,
  emit,
}: RunAgentOptions): Promise<AgentResult> {
  const toolCalls: ToolCallRecord[] = [];
  let inputTokens = 0;
  let outputTokens = 0;
  let finalText = "";

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response: Message = await anthropic.messages.create({
      model: CHAT_MODEL,
      max_tokens: 1500,
      temperature: TEMPERATURE,
      system: systemPrompt,
      tools: TOOLS,
      messages: history,
    });

    inputTokens += response.usage.input_tokens;
    outputTokens += response.usage.output_tokens;

    history.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "end_turn") {
      const textBlocks = response.content.filter(
        (b): b is { type: "text"; text: string } => b.type === "text",
      );
      finalText = textBlocks.map((b) => b.text).join("\n");
      // Stream finalni tekst kao deltu (odjednom — agent loop nije pravo streaming)
      if (finalText) emit({ type: "delta", content: finalText });
      return {
        finalText,
        toolCalls,
        iterations: i + 1,
        inputTokens,
        outputTokens,
      };
    }

    if (response.stop_reason === "tool_use") {
      const toolUseBlocks = response.content.filter(
        (b): b is ToolUseBlock => b.type === "tool_use",
      );

      const results = await Promise.all(
        toolUseBlocks.map(async (block) => {
          const start = Date.now();
          emit({
            type: "tool_call_start",
            id: block.id,
            name: block.name,
            input: block.input,
          });

          const handler = TOOL_HANDLERS[block.name];
          let result: unknown;
          let errorMsg: string | undefined;
          try {
            result = handler
              ? await handler(block.input as Record<string, unknown>)
              : { uspjeh: false, greska: `Nepoznat alat: ${block.name}` };
          } catch (err) {
            errorMsg = err instanceof Error ? err.message : String(err);
            result = { uspjeh: false, greska: errorMsg };
          }
          const durationMs = Date.now() - start;

          if (errorMsg) {
            emit({
              type: "tool_call_error",
              id: block.id,
              name: block.name,
              error: errorMsg,
            });
          } else {
            emit({
              type: "tool_call_end",
              id: block.id,
              name: block.name,
              result,
              durationMs,
            });
          }

          toolCalls.push({
            id: block.id,
            name: block.name,
            input: block.input,
            result,
            durationMs,
            error: errorMsg,
          });

          return {
            type: "tool_result" as const,
            tool_use_id: block.id,
            content: JSON.stringify(result),
          };
        }),
      );

      history.push({ role: "user", content: results });
      continue;
    }

    // Drugi stop razlozi
    finalText = `[Agent stop: ${response.stop_reason}]`;
    emit({ type: "delta", content: finalText });
    return {
      finalText,
      toolCalls,
      iterations: i + 1,
      inputTokens,
      outputTokens,
    };
  }

  finalText = "[Agent: dostignut limit od 6 koraka.]";
  emit({ type: "delta", content: finalText });
  return {
    finalText,
    toolCalls,
    iterations: MAX_ITERATIONS,
    inputTokens,
    outputTokens,
  };
}
```

- [ ] **Step 2: Verifikuj kompilaciju**

Run: `cd /Users/nmil/Desktop/smrcak-demo && npx tsc --noEmit`

Expected: bez greški.

### Task 11.5: Refactor /api/chat da koristi runAgent

**Files:**
- Modify: `app/api/chat/route.ts`
- Modify: `data/system_prompt.md` (proširen sa <agent_tools> sekcijom)

- [ ] **Step 1: Ažuriraj system prompt sa listom alata**

U `data/system_prompt.md`, **prije** zatvaranja `</guardrails>`, dodaj novu sekciju:

```markdown
<agent_tools>
Za "Operativni" mod (i u opštem slučaju kad je relevantno) imaš pristup
sljedećim alatima preko Tool Use pattern-a:

1. pretrazi_dokumente(upit, scope?) — pretražuje internu bazu znanja (Pinecone).
   Koristi za pitanja "šta firma nudi", "kako se nešto radi", FAQ teme.

2. provjeri_lot_zalihe(proizvod, trazena_kolicina_kg?) — vraća LOT-ove sa
   FIFO predlogom. Koristi za pitanja "imamo li X", "koliko ima Y".

3. nadji_kupca(upit) — lookup kupca po imenu/emailu, vraća profil
   (preferred packaging, prevoznik, jezik, broj prethodnih pošiljki).

4. nadji_posiljku(broj) — detalji konkretne pošiljke po broju.

5. izracunaj_dostavu(destinacija, kilogrami) — DAP transport kalkulator.

6. lista_kooperanata(regija?) — sakupljači i njihova BioSuisse validnost.

KAD KORISTITI ALATE:
- Realtime/dinamička pitanja (zalihe, lookup kupca, transport) → koristi alat
- Statički podaci u bazi znanja (cijene, sertifikati, procedure, FAQ) → 
  pretrazi_dokumente
- Multi-step pitanja koja kombinuju izvore (npr. "klijent X traži Y kg, koliko") →
  zovi više alata

PRAVILA:
- Možeš pozvati više alata u istom turn-u (paralelno) ako su nezavisni.
- Ako alat vrati grešku ili praznu listu, NE izmišljaj — reci jasno korisniku.
- Limit: max 6 koraka po pitanju (security guardrail).
</agent_tools>
```

- [ ] **Step 2: Refactor route.ts**

Zamijeni cijeli `app/api/chat/route.ts` sa:

```typescript
import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { runAgent } from "@/lib/agent/runner";
import { loadEnv, RagConfigError, SYSTEM_PROMPT } from "@/lib/rag";
import type { ChatScope, SseEvent } from "@/lib/agent/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const VALID_SCOPES: ChatScope[] = ["biznis", "app", "all"];
const MAX_USER_INPUT = 4000;
const MAX_HISTORY = 10;

function sseEncoder() {
  const encoder = new TextEncoder();
  return (event: SseEvent) => encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
}

function sseHeaders() {
  return {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  };
}

export async function POST(req: NextRequest) {
  let body: { messages?: ChatMessage[]; scope?: ChatScope };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const scope: ChatScope =
    body.scope && VALID_SCOPES.includes(body.scope) ? body.scope : "all";
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser?.content?.trim()) {
    return new Response(
      JSON.stringify({ error: "Last message must be a non-empty user message" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  if (lastUser.content.length > MAX_USER_INPUT) {
    return new Response(
      JSON.stringify({ error: `Question too long (max ${MAX_USER_INPUT} chars)` }),
      { status: 413, headers: { "Content-Type": "application/json" } },
    );
  }

  const encode = sseEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: SseEvent) => controller.enqueue(encode(event));
      const close = () => controller.close();

      try {
        const env = loadEnv();
        const anthropic = new Anthropic({ apiKey: env.anthropicKey });

        // Pretvori messages history u Anthropic format
        const history = messages
          .slice(-MAX_HISTORY - 1)
          .map((m) => ({ role: m.role, content: m.content }));

        // Augment user prompt sa scope hint-om za pretrazi_dokumente
        const lastMessage = history[history.length - 1];
        if (lastMessage && lastMessage.role === "user") {
          lastMessage.content =
            `[Mode: ${scope}] ` + lastMessage.content;
        }

        const result = await runAgent({
          anthropic,
          systemPrompt: SYSTEM_PROMPT,
          history,
          emit: send,
        });

        // Pošalji sources event za UI sa sources iz pretrazi_dokumente alata
        const ragCalls = result.toolCalls.filter(
          (tc) => tc.name === "pretrazi_dokumente",
        );
        if (ragCalls.length > 0) {
          const allSources = ragCalls.flatMap((tc) => {
            const r = tc.result as {
              uspjeh?: boolean;
              izvori?: Array<{ source: string; score: number; chunk_index: number; text: string }>;
            };
            if (!r.uspjeh || !r.izvori) return [];
            return r.izvori.map((s) => ({
              source: s.source,
              score: s.score,
              chunkIndex: s.chunk_index,
              preview: s.text.slice(0, 220),
            }));
          });
          if (allSources.length > 0) {
            send({ type: "sources", sources: allSources });
          }
        }

        send({ type: "done" });
        close();
      } catch (err) {
        const message =
          err instanceof RagConfigError
            ? `RAG nije konfigurisan: ${err.missing.join(", ")}.`
            : err instanceof Error
              ? err.message
              : "Nepoznata greška";
        try {
          send({ type: "error", message });
        } catch {
          // controller already closed
        }
        close();
      }
    },
  });

  return new Response(stream, { headers: sseHeaders() });
}
```

- [ ] **Step 3: Verifikuj build**

Run: `cd /Users/nmil/Desktop/smrcak-demo && npm run build 2>&1 | tail -5`

Expected: ✓ Compiled successfully.

- [ ] **Step 4: Verifikuj lint**

Run: `cd /Users/nmil/Desktop/smrcak-demo && npm run lint 2>&1 | tail -3`

Expected: ✔ No ESLint warnings or errors.

### Task 11.6: E2E test za Faza 11

**Files:**
- Create: `e2e/faza-11-agent-backend.spec.ts`

- [ ] **Step 1: Test koji mock-uje API i provjerava da se SSE i dalje šalje pravilno (existing UI ne smije se polomiti)**

Kreiraj `e2e/faza-11-agent-backend.spec.ts`:

```typescript
import { test, expect, type Route } from "@playwright/test";

function buildSseResponse(events: object[]): string {
  return events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("");
}

async function mockChatRoute(route: Route, events: object[], delayMs = 50) {
  await new Promise((r) => setTimeout(r, delayMs));
  await route.fulfill({
    status: 200,
    headers: { "Content-Type": "text/event-stream; charset=utf-8" },
    body: buildSseResponse(events),
  });
}

test.describe("Faza 11 — Agent backend SSE compatibility", () => {
  test("backward compat: postojeći SSE shape (sources + delta + done) i dalje radi", async ({ page }) => {
    await page.route("**/api/chat", async (route) => {
      await mockChatRoute(route, [
        {
          type: "sources",
          sources: [
            { source: "test.md", score: 0.9, chunkIndex: 0, preview: "x" },
          ],
        },
        { type: "delta", content: "OK" },
        { type: "done" },
      ]);
    });

    await page.goto("/");
    await page.locator('[data-test="floating-chatbot-toggle"]').click();
    await page.locator('[data-test="chat-input"]').fill("test");
    await page.locator('[data-test="chat-send"]').click();

    const aiMsg = page.locator('[data-test="chat-message"][data-role="assistant"]').last();
    await expect(aiMsg).toContainText("OK");
  });

  test("novi tool_call_start/end eventovi ne lome UI (silently ignored za sad)", async ({ page }) => {
    await page.route("**/api/chat", async (route) => {
      await mockChatRoute(route, [
        { type: "tool_call_start", id: "t1", name: "pretrazi_dokumente", input: { upit: "x" } },
        { type: "tool_call_end", id: "t1", name: "pretrazi_dokumente", result: { uspjeh: true }, durationMs: 100 },
        { type: "delta", content: "Tool ok." },
        { type: "done" },
      ]);
    });

    await page.goto("/");
    await page.locator('[data-test="floating-chatbot-toggle"]').click();
    await page.locator('[data-test="chat-input"]').fill("test");
    await page.locator('[data-test="chat-send"]').click();

    const aiMsg = page.locator('[data-test="chat-message"][data-role="assistant"]').last();
    await expect(aiMsg).toContainText("Tool ok.");
  });
});
```

- [ ] **Step 2: Pokreni Faza 11 e2e**

Run:
```bash
cd /Users/nmil/Desktop/smrcak-demo && PW_USE_BUILD=1 npx playwright test --grep "faza-11" --workers=1 2>&1 | tail -10
```

Expected: 4 passed (2 testa × 2 browsera).

- [ ] **Step 3: Pokreni full suite (regression check)**

Run:
```bash
cd /Users/nmil/Desktop/smrcak-demo && PW_USE_BUILD=1 npx playwright test --workers=2 2>&1 | tail -5
```

Expected: 100/100 passed (98 prethodnih + 4 nova testa minus duplikati = exact broj zavisi).

### ✅ Faza 11 DoD

Sve mora proći prije Faze 12:
- ✅ `node scripts/test-tools.mjs` — 14/14 pass
- ✅ `npm run build` clean
- ✅ `npm run lint` clean
- ✅ `npx playwright test --grep "faza-11"` — 4/4 pass
- ✅ Full Playwright suite ne regresira

---

## Faza 12 — Tool Indicators u UI

**Cilj:** Korisnik vidi vizualnu informaciju kad agent koristi alat. UI parsira nove SSE eventove i renderuje "Provjeravam zalihe..." chip između user pitanja i AI odgovora.

**Vrijeme:** 2-3 sata

### File Structure faze

- Modify: `components/chatbot/types.ts` (proširi sa `ChatToolCall`)
- Modify: `components/chatbot/useChatStream.ts` (parse novih event-ova)
- Create: `components/chatbot/ToolCallIndicator.tsx`
- Modify: `components/chatbot/MessageBubble.tsx` (renderuje indicator)
- Create: `e2e/faza-12-tool-indicators.spec.ts`

### Task 12.1: Types proširenje

**Files:**
- Modify: `components/chatbot/types.ts`

- [ ] **Step 1: Dodaj ChatToolCall i prošireni ChatMessage**

Modifikuj `components/chatbot/types.ts`:

```typescript
export interface ChatSource {
  source: string;
  score: number;
  chunkIndex: number;
  preview: string;
}

export type ToolCallStatus = "running" | "done" | "error";

export interface ChatToolCall {
  id: string;
  name: string;
  status: ToolCallStatus;
  input?: unknown;
  result?: unknown;
  durationMs?: number;
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  toolCalls?: ChatToolCall[];
  error?: string;
  pending?: boolean;
}
```

### Task 12.2: useChatStream parsira tool eventove

**Files:**
- Modify: `components/chatbot/useChatStream.ts`

- [ ] **Step 1: Dodaj handling za nova 3 event tipa**

Pronađi blok za parsiranje server eventova u `useChatStream.ts`. Trenutno ima logiku samo za `sources`, `delta`, `error`, `done`. Dodaj `tool_call_start`, `tool_call_end`, `tool_call_error`.

Replace postojeći ServerEvent interfejs i parsing blok:

```typescript
interface ServerEvent {
  type: "sources" | "delta" | "done" | "error" | "tool_call_start" | "tool_call_end" | "tool_call_error";
  sources?: ChatSource[];
  content?: string;
  message?: string;
  // tool_call fields
  id?: string;
  name?: string;
  input?: unknown;
  result?: unknown;
  durationMs?: number;
  error?: string;
}
```

Unutar `for (const block of events)` petlje, zamijeni postojeći `if/else if` lanac sa:

```typescript
if (event.type === "sources") {
  updateAssistant({ sources: event.sources ?? [] });
} else if (event.type === "delta") {
  setMessages((prev) =>
    prev.map((m) =>
      m.id === assistantId
        ? { ...m, content: m.content + (event.content ?? "") }
        : m,
    ),
  );
} else if (event.type === "tool_call_start") {
  setMessages((prev) =>
    prev.map((m) => {
      if (m.id !== assistantId) return m;
      const existing = m.toolCalls ?? [];
      return {
        ...m,
        toolCalls: [
          ...existing,
          {
            id: event.id ?? "?",
            name: event.name ?? "?",
            input: event.input,
            status: "running" as const,
          },
        ],
      };
    }),
  );
} else if (event.type === "tool_call_end") {
  setMessages((prev) =>
    prev.map((m) => {
      if (m.id !== assistantId) return m;
      return {
        ...m,
        toolCalls: (m.toolCalls ?? []).map((tc) =>
          tc.id === event.id
            ? { ...tc, status: "done" as const, result: event.result, durationMs: event.durationMs }
            : tc,
        ),
      };
    }),
  );
} else if (event.type === "tool_call_error") {
  setMessages((prev) =>
    prev.map((m) => {
      if (m.id !== assistantId) return m;
      return {
        ...m,
        toolCalls: (m.toolCalls ?? []).map((tc) =>
          tc.id === event.id
            ? { ...tc, status: "error" as const, error: event.error }
            : tc,
        ),
      };
    }),
  );
} else if (event.type === "error") {
  updateAssistant({ error: event.message ?? "Greška", pending: false });
} else if (event.type === "done") {
  updateAssistant({ pending: false });
}
```

### Task 12.3: ToolCallIndicator komponenta

**Files:**
- Create: `components/chatbot/ToolCallIndicator.tsx`

- [ ] **Step 1: Dodaj komponentu**

Kreiraj `components/chatbot/ToolCallIndicator.tsx`:

```typescript
"use client";

import { Loader2, CheckCircle2, AlertCircle, Search, Database, MapPin, Truck, FileSearch } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatToolCall } from "./types";

const TOOL_LABELS: Record<string, { label: string; icon: typeof Loader2 }> = {
  pretrazi_dokumente: { label: "Pretražujem bazu znanja", icon: FileSearch },
  provjeri_lot_zalihe: { label: "Provjeravam zalihe", icon: Database },
  nadji_kupca: { label: "Tražim kupca", icon: Search },
  nadji_posiljku: { label: "Učitavam pošiljku", icon: Search },
  izracunaj_dostavu: { label: "Računam dostavu", icon: Truck },
  lista_kooperanata: { label: "Učitavam kooperante", icon: MapPin },
};

export function ToolCallIndicator({ toolCalls }: { toolCalls: ChatToolCall[] }) {
  if (!toolCalls || toolCalls.length === 0) return null;
  return (
    <ul
      data-test="tool-call-indicators"
      className="flex flex-col gap-1 mb-2"
    >
      {toolCalls.map((tc) => {
        const meta = TOOL_LABELS[tc.name] ?? { label: tc.name, icon: Loader2 };
        const Icon = meta.icon;
        return (
          <li
            key={tc.id}
            data-test="tool-call-row"
            data-tool-name={tc.name}
            data-tool-status={tc.status}
            className={cn(
              "inline-flex items-center gap-2 self-start px-2.5 py-1 rounded-md text-[11px] font-medium border",
              tc.status === "running" && "bg-cream/60 border-border text-forest",
              tc.status === "done" && "bg-success/10 border-success/30 text-success",
              tc.status === "error" && "bg-danger/10 border-danger/30 text-danger",
            )}
          >
            {tc.status === "running" && <Loader2 className="w-3 h-3 animate-spin" />}
            {tc.status === "done" && <CheckCircle2 className="w-3 h-3" />}
            {tc.status === "error" && <AlertCircle className="w-3 h-3" />}
            <Icon className="w-3 h-3 opacity-60" />
            <span>{meta.label}</span>
            {tc.status === "done" && tc.durationMs != null && (
              <span className="text-[10px] opacity-60">
                ({Math.round(tc.durationMs)}ms)
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
```

### Task 12.4: MessageBubble integriše indikator

**Files:**
- Modify: `components/chatbot/MessageBubble.tsx`

- [ ] **Step 1: Importuj i renderuj ToolCallIndicator**

U `MessageBubble.tsx` dodati import na vrhu:

```typescript
import { ToolCallIndicator } from "./ToolCallIndicator";
```

I unutar render bloka, **prije** `<div className="text-sm" data-test="message-content">` dodati:

```tsx
{!isUser && message.toolCalls && message.toolCalls.length > 0 && (
  <ToolCallIndicator toolCalls={message.toolCalls} />
)}
```

### Task 12.5: E2E test

**Files:**
- Create: `e2e/faza-12-tool-indicators.spec.ts`

- [ ] **Step 1: Tool indicator render test**

Kreiraj `e2e/faza-12-tool-indicators.spec.ts`:

```typescript
import { test, expect, type Route } from "@playwright/test";

function buildSseResponse(events: object[]): string {
  return events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("");
}

async function mockChatRoute(route: Route, events: object[], delayMs = 50) {
  await new Promise((r) => setTimeout(r, delayMs));
  await route.fulfill({
    status: 200,
    headers: { "Content-Type": "text/event-stream; charset=utf-8" },
    body: buildSseResponse(events),
  });
}

test.describe("Faza 12 — Tool indicators u UI", () => {
  test("running indikator se pojavljuje za tool_call_start", async ({ page }) => {
    await page.route("**/api/chat", async (route) => {
      await mockChatRoute(route, [
        {
          type: "tool_call_start",
          id: "t1",
          name: "provjeri_lot_zalihe",
          input: { proizvod: "Sušeni vrganji klasa A" },
        },
        {
          type: "tool_call_end",
          id: "t1",
          name: "provjeri_lot_zalihe",
          result: { uspjeh: true, ukupno_dostupno_kg: 630 },
          durationMs: 145,
        },
        { type: "delta", content: "Imamo 630kg." },
        { type: "done" },
      ]);
    });

    await page.goto("/");
    await page.locator('[data-test="floating-chatbot-toggle"]').click();
    await page.locator('[data-test="chat-input"]').fill("Imamo li vrganje?");
    await page.locator('[data-test="chat-send"]').click();

    const indicator = page.locator(
      '[data-test="tool-call-row"][data-tool-name="provjeri_lot_zalihe"]',
    );
    await expect(indicator).toBeVisible();
    await expect(indicator).toHaveAttribute("data-tool-status", "done");
    await expect(indicator).toContainText("Provjeravam zalihe");
  });

  test("error status se prikaže za tool_call_error", async ({ page }) => {
    await page.route("**/api/chat", async (route) => {
      await mockChatRoute(route, [
        {
          type: "tool_call_start",
          id: "t2",
          name: "nadji_kupca",
          input: { upit: "Bagdad" },
        },
        {
          type: "tool_call_error",
          id: "t2",
          name: "nadji_kupca",
          error: "Network error",
        },
        { type: "delta", content: "Greška." },
        { type: "done" },
      ]);
    });

    await page.goto("/");
    await page.locator('[data-test="floating-chatbot-toggle"]').click();
    await page.locator('[data-test="chat-input"]').fill("test");
    await page.locator('[data-test="chat-send"]').click();

    const errorIndicator = page.locator(
      '[data-test="tool-call-row"][data-tool-name="nadji_kupca"]',
    );
    await expect(errorIndicator).toHaveAttribute("data-tool-status", "error");
  });

  test("multiple tools se pojavljuju u redu", async ({ page }) => {
    await page.route("**/api/chat", async (route) => {
      await mockChatRoute(route, [
        { type: "tool_call_start", id: "t1", name: "provjeri_lot_zalihe", input: {} },
        { type: "tool_call_start", id: "t2", name: "izracunaj_dostavu", input: {} },
        { type: "tool_call_end", id: "t1", name: "provjeri_lot_zalihe", result: {}, durationMs: 100 },
        { type: "tool_call_end", id: "t2", name: "izracunaj_dostavu", result: {}, durationMs: 80 },
        { type: "delta", content: "OK" },
        { type: "done" },
      ]);
    });

    await page.goto("/");
    await page.locator('[data-test="floating-chatbot-toggle"]').click();
    await page.locator('[data-test="chat-input"]').fill("kombo");
    await page.locator('[data-test="chat-send"]').click();

    const rows = page.locator('[data-test="tool-call-row"]');
    await expect(rows).toHaveCount(2);
  });
});
```

- [ ] **Step 2: Build + lint + tests**

Run:
```bash
cd /Users/nmil/Desktop/smrcak-demo && \
  npm run build 2>&1 | tail -5 && \
  npm run lint 2>&1 | tail -3 && \
  PW_USE_BUILD=1 npx playwright test --grep "faza-12" --workers=1 2>&1 | tail -10
```

Expected: build ✓, lint ✔, 6/6 tool indicator testova prolazi.

- [ ] **Step 3: Full suite regression**

Run: `PW_USE_BUILD=1 npx playwright test --workers=2 2>&1 | tail -5`

Expected: sve prolazi (svi prethodni + Faza 11 + Faza 12).

### ✅ Faza 12 DoD

- ✅ build clean
- ✅ lint clean
- ✅ Faza 12 e2e: 6/6 pass
- ✅ Full suite: bez regresije

---

## Faza 13 — Conversation history persistence (localStorage)

**Cilj:** Razgovor se zapamti u localStorage sa TTL 7 dana. Refresh stranice vraća istoriju. Reset razgovora briše localStorage.

**Vrijeme:** 1.5-2 sata

### File Structure faze

- Create: `components/chatbot/useChatHistory.ts`
- Modify: `components/chatbot/useChatStream.ts` (load + save)
- Modify: `components/chatbot/ChatPanel.tsx` (čisti i localStorage na clear)
- Create: `e2e/faza-13-history.spec.ts`

### Task 13.1: useChatHistory hook

**Files:**
- Create: `components/chatbot/useChatHistory.ts`

- [ ] **Step 1: Dodaj localStorage hook**

Kreiraj `components/chatbot/useChatHistory.ts`:

```typescript
"use client";

import { useEffect, useState } from "react";
import type { ChatMessage } from "./types";

const STORAGE_KEY = "smrcak-chatbot-history";
const TTL_DAYS = 7;
const TTL_MS = TTL_DAYS * 24 * 60 * 60 * 1000;

interface StoredHistory {
  messages: ChatMessage[];
  savedAt: number;
}

export function loadStoredHistory(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredHistory;
    if (!parsed.savedAt || Date.now() - parsed.savedAt > TTL_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return [];
    }
    return parsed.messages.filter((m) => !m.pending);
  } catch {
    return [];
  }
}

export function saveHistory(messages: ChatMessage[]) {
  if (typeof window === "undefined") return;
  try {
    const payload: StoredHistory = {
      messages: messages
        .filter((m) => !m.pending && !m.error)
        .map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          sources: m.sources,
          toolCalls: m.toolCalls?.filter((tc) => tc.status === "done"),
        })),
      savedAt: Date.now(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore quota errors
  }
}

export function clearHistory() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** React hook za perzistirani array poruka */
export function usePersistedMessages(): [
  ChatMessage[],
  React.Dispatch<React.SetStateAction<ChatMessage[]>>,
] {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setMessages(loadStoredHistory());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    saveHistory(messages);
  }, [messages, loaded]);

  return [messages, setMessages];
}
```

### Task 13.2: useChatStream koristi persistance

**Files:**
- Modify: `components/chatbot/useChatStream.ts`

- [ ] **Step 1: Importuj i koristi usePersistedMessages**

Na vrhu `useChatStream.ts`:

```typescript
import { usePersistedMessages, clearHistory } from "./useChatHistory";
```

Zamijeni:
```typescript
const [messages, setMessages] = useState<ChatMessage[]>([]);
```
sa:
```typescript
const [messages, setMessages] = usePersistedMessages();
```

I u `clear` funkciji, dodati poziv `clearHistory()`:

```typescript
const clear = useCallback(() => {
  if (streaming) abortRef.current?.abort();
  setMessages([]);
  clearHistory();
}, [streaming, setMessages]);
```

### Task 13.3: E2E test za persistence

**Files:**
- Create: `e2e/faza-13-history.spec.ts`

- [ ] **Step 1: Test perzistencije kroz reload**

Kreiraj `e2e/faza-13-history.spec.ts`:

```typescript
import { test, expect, type Route } from "@playwright/test";

function buildSseResponse(events: object[]): string {
  return events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("");
}

async function mockChatRoute(route: Route, events: object[]) {
  await new Promise((r) => setTimeout(r, 50));
  await route.fulfill({
    status: 200,
    headers: { "Content-Type": "text/event-stream; charset=utf-8" },
    body: buildSseResponse(events),
  });
}

test.describe("Faza 13 — Conversation history persistence", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
    await context.addInitScript(() => {
      try { window.localStorage.removeItem("smrcak-chatbot-history"); } catch {}
    });
  });

  test("messages se zapamte i vrate nakon reload-a", async ({ page }) => {
    await page.route("**/api/chat", async (route) => {
      await mockChatRoute(route, [
        { type: "delta", content: "Odgovor 1" },
        { type: "done" },
      ]);
    });

    await page.goto("/");
    await page.locator('[data-test="floating-chatbot-toggle"]').click();
    await page.locator('[data-test="chat-input"]').fill("Pitanje 1");
    await page.locator('[data-test="chat-send"]').click();
    await expect(page.locator('[data-test="chat-message"]')).toHaveCount(2);

    // Reload
    await page.reload();
    await page.locator('[data-test="floating-chatbot-toggle"]').click();
    await expect(page.locator('[data-test="chat-message"]')).toHaveCount(2);
    await expect(page.locator('[data-test="chat-message"]').first()).toContainText("Pitanje 1");
    await expect(page.locator('[data-test="chat-message"]').last()).toContainText("Odgovor 1");
  });

  test("clear razgovora briše localStorage i empty state se vrati", async ({ page }) => {
    await page.route("**/api/chat", async (route) => {
      await mockChatRoute(route, [
        { type: "delta", content: "Odgovor" },
        { type: "done" },
      ]);
    });

    await page.goto("/");
    await page.locator('[data-test="floating-chatbot-toggle"]').click();
    await page.locator('[data-test="chat-input"]').fill("Pitanje");
    await page.locator('[data-test="chat-send"]').click();
    await expect(page.locator('[data-test="chat-message"]')).toHaveCount(2);

    await page.locator('[data-test="chat-clear"]').click();
    await expect(page.locator('[data-test="chat-message"]')).toHaveCount(0);
    await expect(page.locator('[data-test="chat-empty-state"]')).toBeVisible();

    // Reload — empty state još uvijek
    await page.reload();
    await page.locator('[data-test="floating-chatbot-toggle"]').click();
    await expect(page.locator('[data-test="chat-empty-state"]')).toBeVisible();
  });

  test("pending poruke se NE perzistiraju (samo done/error filtri)", async ({ page }) => {
    // Mock koji nikad ne završava — pending state
    await page.route("**/api/chat", async () => {
      await new Promise(() => {}); // hangs forever
    });

    await page.goto("/");
    await page.locator('[data-test="floating-chatbot-toggle"]').click();
    await page.locator('[data-test="chat-input"]').fill("Hangs");
    await page.locator('[data-test="chat-send"]').click();
    // User msg vidljiva, pending assistant msg vidljiva
    await expect(page.locator('[data-test="chat-message"]')).toHaveCount(2);

    // Reload — pending poruka NE bi smjela ostati
    await page.reload();
    await page.locator('[data-test="floating-chatbot-toggle"]').click();
    // User msg ostaje, ali pending assistant msg se filtrira
    const messages = page.locator('[data-test="chat-message"]');
    const count = await messages.count();
    expect(count).toBeLessThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Verifikacija**

Run:
```bash
cd /Users/nmil/Desktop/smrcak-demo && \
  npm run build 2>&1 | tail -5 && \
  npm run lint 2>&1 | tail -3 && \
  PW_USE_BUILD=1 npx playwright test --grep "faza-13" --workers=1 2>&1 | tail -10
```

Expected: 6/6 testova prolazi (3 testa × 2 browsera).

- [ ] **Step 3: Full suite regression**

Run: `PW_USE_BUILD=1 npx playwright test --workers=2 2>&1 | tail -5`

### ✅ Faza 13 DoD

- ✅ build, lint clean
- ✅ Faza 13: 6/6 pass
- ✅ Full suite: bez regresije

---

## Faza 14 — Operativni mode + dynamic welcome

**Cilj:** Treći mode "Operativni" koji aktivira agent (vs. samo RAG). Welcome poruka se mijenja po mode-u, isto i quick replies. Agent može da koristi sve alate u Operativni modu, dok ostali modovi (biznis/app) koriste samo `pretrazi_dokumente` alat.

**Vrijeme:** 2-3 sata

### File Structure faze

- Modify: `components/chatbot/ChatPanel.tsx` (3 mode tabs + dinamička welcome)
- Modify: `components/chatbot/useChatStream.ts` (export ChatScope sa "operativni")
- Modify: `lib/agent/types.ts` (proširi ChatScope sa "operativni")
- Modify: `lib/rag.ts` (buildScopeFilter ostaje za biznis/app, "operativni" → undefined)
- Modify: `app/api/chat/route.ts` (operativni → svi alati, ostali → tool_choice samo pretrazi_dokumente)
- Create: `e2e/faza-14-operativni-mode.spec.ts`

### Task 14.1: Proširi ChatScope sa "operativni"

**Files:**
- Modify: `lib/agent/types.ts` ili `lib/rag.ts` (gdje god je definisan ChatScope)

- [ ] **Step 1: Dodaj "operativni" u tip**

U `lib/rag.ts`:

```typescript
export type ChatScope = "biznis" | "app" | "operativni" | "all";
```

I u `buildScopeFilter`:

```typescript
export function buildScopeFilter(scope: ChatScope) {
  if (scope === "biznis") return { source: { $ne: APP_DOC_FILE } };
  if (scope === "app") return { source: { $eq: APP_DOC_FILE } };
  // "operativni" i "all" — bez filtera
  return undefined;
}
```

I u `useChatStream.ts` proširi tip ChatScope:

```typescript
export type ChatScope = "biznis" | "app" | "operativni" | "all";
```

### Task 14.2: API route per-mode tool_choice

**Files:**
- Modify: `app/api/chat/route.ts`

- [ ] **Step 1: Restrict alate za biznis/app mode**

U `app/api/chat/route.ts` modifikuj `runAgent` poziv da ograniči alate:

Pronađi:
```typescript
const result = await runAgent({
  anthropic,
  systemPrompt: SYSTEM_PROMPT,
  history,
  emit: send,
});
```

Dodaj logiku za per-mode alate. Modifikuj `lib/agent/runner.ts` `RunAgentOptions` da prima `allowedTools?: string[]`:

```typescript
export interface RunAgentOptions {
  anthropic: Anthropic;
  systemPrompt: string;
  history: MessageParam[];
  emit: (event: SseEvent) => void;
  allowedTools?: string[];
}
```

I u `runAgent` filtrira:
```typescript
const tools = allowedTools
  ? TOOLS.filter((t) => allowedTools.includes(t.name))
  : TOOLS;
// ...
const response = await anthropic.messages.create({
  // ...
  tools,
  // ...
});
```

A u `app/api/chat/route.ts`:

```typescript
// Operativni mode dobija sve alate; biznis/app dobijaju samo pretrazi_dokumente.
const allowedTools = scope === "operativni" || scope === "all"
  ? undefined
  : ["pretrazi_dokumente"];

const result = await runAgent({
  anthropic,
  systemPrompt: SYSTEM_PROMPT,
  history,
  emit: send,
  allowedTools,
});
```

### Task 14.3: ChatPanel — 3 moda + dinamička welcome poruka

**Files:**
- Modify: `components/chatbot/ChatPanel.tsx`

- [ ] **Step 1: Proširi QUESTIONS_BY_MODE i mode tipove**

Zamijeni `QUESTIONS_BY_MODE` sa:

```typescript
const MODES: Array<{ id: "biznis" | "app" | "operativni"; label: string; welcome: string; questions: string[] }> = [
  {
    id: "biznis",
    label: "Interno znanje",
    welcome:
      "Pitajte me o proizvodima, cijenama, sertifikatima ili procedurama izvoza.",
    questions: [
      "Koja je MOQ za vrganj sušen klasa A?",
      "Šta sve ide u dokumentaciji za EU pošiljku?",
      "Koliko košta DAP do Münchena za 200kg?",
      "Šta razlikuje Smrčak od konkurencije?",
    ],
  },
  {
    id: "app",
    label: "Aplikacija",
    welcome:
      "Pitajte me kako se koristi sistem — ekrani, statusi, tokovi.",
    questions: [
      "Kako kreiram novu pošiljku iz emaila?",
      "Šta znači status Čeka pregled?",
      "Kako da odobrim ili odbijem dokument?",
      "Kako pratim sledljivost lota do kooperanta?",
    ],
  },
  {
    id: "operativni",
    label: "Operativni",
    welcome:
      "Operativni mode — koristim alate da provjerim zalihe, lookup-ujem kupce, računam dostavu.",
    questions: [
      "Imamo li 500kg vrganja sušenih klase A na zalihi?",
      "Bio Naturkost traži 200kg lisičarki — koliko će koštati DAP do Münchena?",
      "Daj mi detalje pošiljke 2026/0143.",
      "Koji kooperanti imaju validan BioSuisse certifikat 2027+?",
    ],
  },
];
```

- [ ] **Step 2: Render 3 tab-a u tablist-u**

Pronađi:
```tsx
{(["biznis", "app"] as const).map((m) => (
  <button ...>
    {QUESTIONS_BY_MODE[m].label}
  </button>
))}
```

Zamijeni sa:
```tsx
{MODES.map((m) => (
  <button
    key={m.id}
    role="tab"
    type="button"
    onClick={() => setMode(m.id)}
    data-test={`mode-${m.id}`}
    data-active={mode === m.id ? "true" : "false"}
    aria-selected={mode === m.id}
    className={cn(
      "flex-1 py-1.5 px-2 rounded-md text-[11px] font-medium transition-colors",
      mode === m.id
        ? "bg-card text-forest shadow-sm"
        : "text-muted-foreground hover:text-foreground",
    )}
  >
    {m.label}
  </button>
))}
```

- [ ] **Step 3: Welcome poruka i pitanja po mode-u**

Pronađi current welcome paragraph:
```tsx
<p className="text-sm text-muted-foreground">
  Izaberite temu razgovora pa pitajte. Odgovaram iz baze znanja Smrčaka.
</p>
```

Zamijeni sa:
```tsx
<p className="text-sm text-muted-foreground" data-test="welcome-message">
  {MODES.find((m) => m.id === mode)?.welcome}
</p>
```

I za pitanja zamjeni:
```tsx
{QUESTIONS_BY_MODE[mode].questions.map((q) => (...))}
```

sa:
```tsx
{(MODES.find((m) => m.id === mode)?.questions ?? []).map((q) => (...))}
```

- [ ] **Step 4: Update mode state tipa**

Zamijeni:
```typescript
const [mode, setMode] = useState<"biznis" | "app">("biznis");
```
sa:
```typescript
const [mode, setMode] = useState<"biznis" | "app" | "operativni">("biznis");
```

### Task 14.4: E2E test za 3 moda

**Files:**
- Create: `e2e/faza-14-operativni-mode.spec.ts`

- [ ] **Step 1: Test svih 3 modova**

Kreiraj `e2e/faza-14-operativni-mode.spec.ts`:

```typescript
import { test, expect, type Route } from "@playwright/test";

function buildSseResponse(events: object[]): string {
  return events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("");
}

async function mockChatRoute(route: Route, events: object[]) {
  await new Promise((r) => setTimeout(r, 50));
  await route.fulfill({
    status: 200,
    headers: { "Content-Type": "text/event-stream; charset=utf-8" },
    body: buildSseResponse(events),
  });
}

test.describe("Faza 14 — Operativni mode + dynamic welcome", () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      try { window.localStorage.removeItem("smrcak-chatbot-history"); } catch {}
    });
  });

  test("3 moda vidljiva, default biznis", async ({ page }) => {
    await page.goto("/");
    await page.locator('[data-test="floating-chatbot-toggle"]').click();
    await expect(page.locator('[data-test="mode-biznis"]')).toBeVisible();
    await expect(page.locator('[data-test="mode-app"]')).toBeVisible();
    await expect(page.locator('[data-test="mode-operativni"]')).toBeVisible();
    await expect(page.locator('[data-test="mode-biznis"]')).toHaveAttribute("data-active", "true");
  });

  test("welcome poruka se mijenja po mode-u", async ({ page }) => {
    await page.goto("/");
    await page.locator('[data-test="floating-chatbot-toggle"]').click();

    const welcome = page.locator('[data-test="welcome-message"]');
    await expect(welcome).toContainText("proizvodima, cijenama");

    await page.locator('[data-test="mode-app"]').click();
    await expect(welcome).toContainText("ekrani, statusi");

    await page.locator('[data-test="mode-operativni"]').click();
    await expect(welcome).toContainText("alate");
  });

  test("operativni mode šalje scope: 'operativni' u API", async ({ page }) => {
    let capturedBody: string | null = null;
    await page.route("**/api/chat", async (route) => {
      capturedBody = route.request().postData();
      await mockChatRoute(route, [
        { type: "delta", content: "OK" },
        { type: "done" },
      ]);
    });

    await page.goto("/");
    await page.locator('[data-test="floating-chatbot-toggle"]').click();
    await page.locator('[data-test="mode-operativni"]').click();
    await page.locator('[data-test="quick-question"]').first().click();
    expect(capturedBody).toBeTruthy();
    expect(JSON.parse(capturedBody!).scope).toBe("operativni");
  });

  test("quick questions se mijenjaju po mode-u", async ({ page }) => {
    await page.goto("/");
    await page.locator('[data-test="floating-chatbot-toggle"]').click();

    const firstQ = page.locator('[data-test="quick-question"]').first();
    await expect(firstQ).toContainText("MOQ");

    await page.locator('[data-test="mode-app"]').click();
    await expect(firstQ).toContainText("kreiram novu pošiljku");

    await page.locator('[data-test="mode-operativni"]').click();
    await expect(firstQ).toContainText("Imamo li 500kg vrganja");
  });
});
```

- [ ] **Step 2: Verifikuj**

Run:
```bash
cd /Users/nmil/Desktop/smrcak-demo && \
  npm run build 2>&1 | tail -5 && \
  npm run lint 2>&1 | tail -3 && \
  PW_USE_BUILD=1 npx playwright test --grep "faza-14" --workers=1 2>&1 | tail -10
```

Expected: 8/8 testova prolazi.

- [ ] **Step 3: Full suite**

Run: `PW_USE_BUILD=1 npx playwright test --workers=2 2>&1 | tail -5`

### ✅ Faza 14 DoD

- ✅ build, lint clean
- ✅ Faza 14: 8/8 pass
- ✅ Full suite: bez regresije
- ✅ 3 moda vidljiva, welcome i quick questions se mijenjaju, scope se prenosi

---

## Faza 15 — Polish, A11y, Final E2E

**Cilj:** Posljednje finishing touches — a11y atributi, console clean, hard refresh test, full walkthrough u Operativni modu.

**Vrijeme:** 1-1.5 sat

### File Structure faze

- Modify: `components/chatbot/FloatingChatbot.tsx` (focus management)
- Modify: `components/chatbot/ChatPanel.tsx` (Esc to close, keyboard nav)
- Create: `e2e/faza-15-polish.spec.ts`

### Task 15.1: Esc-to-close i focus management

**Files:**
- Modify: `components/chatbot/ChatPanel.tsx`

- [ ] **Step 1: Esc zatvara panel**

U `ChatPanel.tsx` dodaj useEffect:

```typescript
useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, [onClose]);
```

### Task 15.2: A11y atributi

**Files:**
- Modify: `components/chatbot/ChatPanel.tsx`

- [ ] **Step 1: Dodaj role/aria-label na panel root**

Pronađi:
```tsx
<div
  data-test="chat-panel"
  className="fixed bottom-24 ..."
>
```

Zamijeni sa:
```tsx
<div
  data-test="chat-panel"
  role="dialog"
  aria-modal="false"
  aria-label="Smrčak AI asistent"
  className="fixed bottom-24 ..."
>
```

I na messages container:
```tsx
<div
  ref={scrollRef}
  data-test="chat-messages"
  role="log"
  aria-live="polite"
  aria-atomic="false"
  className="..."
>
```

### Task 15.3: Final walkthrough e2e

**Files:**
- Create: `e2e/faza-15-polish.spec.ts`

- [ ] **Step 1: Polish + walkthrough test**

Kreiraj `e2e/faza-15-polish.spec.ts`:

```typescript
import { test, expect, type Route } from "@playwright/test";

function buildSseResponse(events: object[]): string {
  return events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("");
}

async function mockChatRoute(route: Route, events: object[]) {
  await new Promise((r) => setTimeout(r, 30));
  await route.fulfill({
    status: 200,
    headers: { "Content-Type": "text/event-stream; charset=utf-8" },
    body: buildSseResponse(events),
  });
}

test.describe.configure({ mode: "serial" });

test.describe("Faza 15 — Polish + final walkthrough", () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      try { window.localStorage.removeItem("smrcak-chatbot-history"); } catch {}
    });
  });

  test("ARIA: chat panel ima role i aria-label", async ({ page }) => {
    await page.goto("/");
    await page.locator('[data-test="floating-chatbot-toggle"]').click();
    const panel = page.locator('[data-test="chat-panel"]');
    await expect(panel).toHaveAttribute("role", "dialog");
    await expect(panel).toHaveAttribute("aria-label", "Smrčak AI asistent");
  });

  test("messages area ima aria-live polite", async ({ page }) => {
    await page.goto("/");
    await page.locator('[data-test="floating-chatbot-toggle"]').click();
    const messages = page.locator('[data-test="chat-messages"]');
    await expect(messages).toHaveAttribute("role", "log");
    await expect(messages).toHaveAttribute("aria-live", "polite");
  });

  test("Esc zatvara panel", async ({ page }) => {
    await page.goto("/");
    await page.locator('[data-test="floating-chatbot-toggle"]').click();
    await expect(page.locator('[data-test="chat-panel"]')).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator('[data-test="chat-panel"]')).toBeHidden();
  });

  test("agent walkthrough: tools + indikatori + perzistencija + sources", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && !msg.text().includes("favicon")) {
        errors.push(msg.text());
      }
    });
    page.on("pageerror", (err) => errors.push(err.message));

    await page.route("**/api/chat", async (route) => {
      await mockChatRoute(route, [
        {
          type: "tool_call_start",
          id: "t1",
          name: "provjeri_lot_zalihe",
          input: { proizvod: "Sušeni vrganji klasa A", trazena_kolicina_kg: 500 },
        },
        {
          type: "tool_call_end",
          id: "t1",
          name: "provjeri_lot_zalihe",
          result: { uspjeh: true, ukupno_dostupno_kg: 630 },
          durationMs: 145,
        },
        {
          type: "tool_call_start",
          id: "t2",
          name: "izracunaj_dostavu",
          input: { destinacija: "München", kilogrami: 500 },
        },
        {
          type: "tool_call_end",
          id: "t2",
          name: "izracunaj_dostavu",
          result: { uspjeh: true, ukupno_eur: 90 },
          durationMs: 12,
        },
        {
          type: "sources",
          sources: [
            { source: "katalog_proizvoda.md", score: 0.85, chunkIndex: 1, preview: "..." },
          ],
        },
        { type: "delta", content: "Imamo 630kg vrganja. DAP do Münchena za 500kg = 90 EUR." },
        { type: "done" },
      ]);
    });

    await page.goto("/");
    await page.locator('[data-test="floating-chatbot-toggle"]').click();
    await page.locator('[data-test="mode-operativni"]').click();
    await page.locator('[data-test="quick-question"]').first().click();

    // Tool indikatori
    const toolRows = page.locator('[data-test="tool-call-row"]');
    await expect(toolRows).toHaveCount(2);
    await expect(toolRows.first()).toHaveAttribute("data-tool-status", "done");

    // Sources
    await expect(page.locator('[data-test="sources-popover"]')).toBeVisible();

    // Reload — perzistencija
    await page.reload();
    await page.locator('[data-test="floating-chatbot-toggle"]').click();
    await expect(page.locator('[data-test="chat-message"][data-role="assistant"]').last()).toContainText("630kg");

    expect(errors, "Console errors").toEqual([]);
  });
});
```

- [ ] **Step 2: Final verifikacija**

Run:
```bash
cd /Users/nmil/Desktop/smrcak-demo && \
  npm run build 2>&1 | tail -5 && \
  npm run lint 2>&1 | tail -3 && \
  npx tsc --noEmit && \
  PW_USE_BUILD=1 npx playwright test --grep "faza-15" --workers=1 2>&1 | tail -10
```

Expected: build ✓, lint ✔, tsc 0 errors, 8/8 pass.

- [ ] **Step 3: Full suite**

Run: `PW_USE_BUILD=1 npx playwright test --workers=2 2>&1 | tail -5`

Expected: svi prethodni testovi (Faze 1–10) + nove (11, 12, 13, 14, 15) prolaze.

### ✅ Faza 15 DoD

- ✅ build, lint, tsc clean
- ✅ Faza 15: 8/8 pass
- ✅ **Full suite: 100% pass (regression-free)**
- ✅ Console clean tokom walkthrough-a

---

## Faza 16 — Commit + Push

- [ ] **Step 1: Stage svih izmjena**

```bash
cd /Users/nmil/Desktop/smrcak-demo
git add lib/agent/ lib/rag.ts \
        app/api/chat/route.ts \
        components/chatbot/ \
        data/system_prompt.md \
        scripts/test-tools.mjs \
        e2e/faza-11-agent-backend.spec.ts \
        e2e/faza-12-tool-indicators.spec.ts \
        e2e/faza-13-history.spec.ts \
        e2e/faza-14-operativni-mode.spec.ts \
        e2e/faza-15-polish.spec.ts \
        docs/superpowers/plans/2026-04-29-full-package-agent-widget.md
```

- [ ] **Step 2: Single big commit sa detaljnim message-om**

```bash
git commit -m "feat: full package — AI Agent (tool use) + production widget patterns

Major upgrade kombinujući AGENT_GUIDE i WIDGET_GUIDE.

AGENT BACKEND (Faza 11):
- lib/agent/tools.ts: 6 alata koji rade nad data/*.json
  (pretrazi_dokumente, provjeri_lot_zalihe, nadji_kupca, nadji_posiljku,
   izracunaj_dostavu, lista_kooperanata)
- lib/agent/runner.ts: Claude tool use petlja, max 6 iteracija,
  parallel tool execution preko Promise.all
- lib/agent/tool-definitions.ts: Anthropic JSON schemas
- /api/chat refactor: agent runner umjesto direktnog Claude poziva
- SSE protokol proširen sa tool_call_start/end/error eventima
- system_prompt.md: nova <agent_tools> sekcija

UI TOOL INDICATORS (Faza 12):
- ToolCallIndicator komponenta — prikaz alata u toku sa ikonom + status
- useChatStream parsira nove eventove i ažurira ChatMessage.toolCalls
- MessageBubble integriše indicator iznad sadržaja

CONVERSATION PERSISTENCE (Faza 13):
- useChatHistory hook sa localStorage + 7-day TTL
- Pending messages se NE perzistiraju (samo done/error)
- Reset razgovor briše localStorage

OPERATIVNI MODE (Faza 14):
- 3rd mode 'Operativni' u toggle-u (uz Interno znanje + Aplikacija)
- Per-mode allowedTools — biznis/app dobijaju samo pretrazi_dokumente,
  operativni dobija sve alate
- Dinamičke welcome poruke i quick questions po mode-u

POLISH (Faza 15):
- ARIA: dialog role + aria-label na panel, log + aria-live na messages
- Esc zatvara panel
- Final walkthrough test sa multi-tool scenario + persistence

E2E:
- 5 novih spec fajlova (faza-11 do faza-15)
- ~30 novih testova
- Full suite zelena u Chromium + WebKit

Plan: docs/superpowers/plans/2026-04-29-full-package-agent-widget.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 3: Push**

```bash
git push origin main
```

Expected: 1 commit pushovan na main.

---

## Self-Review

**1. Spec coverage:**
- ✅ Agent backend (tool use) — Faza 11
- ✅ 6 alata nad postojećim JSON podacima — Task 11.2
- ✅ Multi-step reasoning sa max_iterations — Task 11.4
- ✅ Tool indicators u UI — Faza 12
- ✅ Conversation history persistence — Faza 13
- ✅ Welcome poruke dinamičke — Task 14.3
- ✅ Operativni mode — Faza 14
- ✅ A11y minimum — Faza 15
- ✅ Verifikacija svake faze (build + lint + Playwright) — DoD u svakoj fazi
- ✅ Full suite ne smije regresovati — DoD pravilo

**2. Placeholder scan:**
- Svi code blokovi su kompletni
- Svi testovi su sa konkretnim assertions
- Sve komande imaju expected output
- Svaki step opisuje šta tačno raditi

**3. Type consistency:**
- `ChatScope` extension sa "operativni" — Task 14.1, koristi se u 14.2, 14.3 ✓
- `AgentResult` definisan u Task 11.1 → koristi se u 11.4 ✓
- `SseEvent` definisan u Task 11.1 → koristi se u 11.4 i 11.5, parsira u 12.2 ✓
- `ChatToolCall` definisan u Task 12.1 → koristi se u 12.2, 12.3, 12.4 ✓
- Tool names konzistentni: pretrazi_dokumente / provjeri_lot_zalihe / nadji_kupca /
  nadji_posiljku / izracunaj_dostavu / lista_kooperanata u svim fazama
- Data-test atributi: tool-call-row, tool-call-indicators, mode-operativni,
  welcome-message, chat-clear, chat-panel, chat-empty-state — konzistentni
- `data-tool-status` vrijednosti: "running"/"done"/"error" konzistentne u Task 12.3 i 12.5

---

## Dodatak: Out of Scope za demo (production patterni)

Sljedeće je u guide-ovima ali NIJE u ovom planu — namjerno, jer demo-u nije potrebno:
- Supabase migracija (JSON ostaje)
- Rate limiting (Upstash) — komentar u kodu za production
- agent_logs Supabase tabela
- Eval suite za agent (regression za system prompt promjene)
- n8n integracija
- GDPR consent banner
- Embed na eksterni sajt (vanilla JS verzija)
- Server-side analytics
- Multi-tenant theming

Ako/kad demo postane production sistem, ove se dodaju kao Faze 16+.

## Total scope

**5 faza implementacije + 1 commit faza, ~10-14 sati ukupno**, stiglih u 5-7 manjih commit-ova ako želimo per-fazni commit, ili 1 big commit na kraju.

Svaka faza je samodovoljna sa verifikacijom — ako iskrsne problem, vraća se na jasnu zelenu liniju.

Total novih testova: ~30 spec funkcija × 2 browsera = ~60 e2e testova.
