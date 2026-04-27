# RAG Integracija — Smrčak Demo App

> **Handoff dokument za code agenta**
> Sve što treba znati za nastavak RAG integracije u `smrcat-demo` Next.js aplikaciju.

---

## TL;DR

Integrišemo RAG asistent (Pinecone + OpenAI embeddings + Claude Sonnet) u postojeću Next.js aplikaciju `smrcat-demo`. Aplikacija je interni sistem za upravljanje izvoznim pošiljkama firme **Smrčak d.o.o.** (izvoz sušenih gljiva u EU). RAG-asistent će u prvoj iteraciji biti **floating chatbot** dostupan na svakoj stranici. Dokumenti za bazu znanja (5 MD fajlova) su pripremljeni. Pinecone index je kreiran. Ingest skripta je napisana u TypeScript-u. **Sljedeći korak**: API route + React floating chatbot komponenta.

---

## 1. Kontekst

### 1.1 AI Forward program

Edukacija za IT stručnjake koju vodi ICBL Banja Luka + Bloomteq. NextPixel (firma Nikola Milutinović) je odabran kao izvođač za razvoj AI rješenja za 5 firmi: GMP Kompani, Prijedorčanka, **Smrčak**, Imprimatur, Obrazovalište. Ovaj projekat je za Smrčaka.

### 1.2 Smrčak d.o.o.

- **Sektor**: izvoz sušenih, smrznutih i svježih šumskih gljiva i plodova
- **Lokacija**: Zvornik, BiH
- **Tržišta**: Njemačka, Italija, Austrija, Francuska, Švajcarska
- **Sertifikati**: BioSuisse organic, IFS Food (u pripremi)
- **Use case (AI Forward)**: AI asistent za izvoznu dokumentaciju i interno znanje

### 1.3 Postojeća aplikacija `smrcat-demo`

GitHub: `https://github.com/stpauli98/smrcat-demo`

**Nije chatbot aplikacija** — to je interni **sistem za upravljanje izvoznim pošiljkama**. Postojeće funkcionalnosti:

- `/` Dashboard sa statistikama i activity feed-om
- `/inbox` Email inbox sa AI klasifikacijom (trenutno mock, vidi `lib/mockAi.ts`)
- `/posiljke` Lista pošiljki, detalj, wizard za novu pošiljku, generisanje 8 PDF dokumenata (mock)
- `/kupci` Lista kupaca, detalj
- `/kooperanti` Sakupljači gljiva sa mapom BiH

**State**: Zustand (`stores/useAppStore.ts`), hidrirano iz JSON-ova u `data/`. Nema prave baze.

**Postojeća "AI" logika** (sve mock):

- `lib/mockAi.ts`: `simulateClassification`, `simulateDocumentGeneration` (8 PDFova), `simulateRegenerate`, `simulateSend`, `simulateUrgentSend`, `simulateAuditExport`
- Mock klasifikator čita `ocekivana_kategorija` polje iz email JSON-a
- Mock generator stvara fake delay-eve i vraća pre-postojeće PDFove iz `public/sample-docs/`

### 1.4 Cilj integracije

Zamijeniti/proširiti mock AI funkcionalnost stvarnim AI rješenjem koje koristi RAG nad bazom znanja Smrčaka. **Prvi WOW moment**: floating chatbot na svakoj stranici — zaposlenik može pitati "koja je MOQ za vrganj A klase?", "šta sve ide u BioSuisse pošiljku?", "rok isporuke za Munich?" i dobiti tačan odgovor iz dokumenata.

---

## 2. Arhitektura

### 2.1 Build-time vs run-time

```
┌──────────────────────────────────────────────────────────────────┐
│  BUILD-TIME (jednom, lokalno, kad se mijenjaju dokumenti)        │
│                                                                  │
│   data/dokumenti/*.md  ──►  scripts/ingest.ts  ──►  Pinecone    │
│                                                                  │
│  Pokrećeš sa: npm run ingest                                     │
│  Re-runs sigurni — dedupe po SHA256 hash-u sadržaja              │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  RUN-TIME (svaki put kad korisnik pita)                          │
│                                                                  │
│   <FloatingChatbot> komponenta                                   │
│        │                                                         │
│        │  POST /api/chat (streaming)                             │
│        ▼                                                         │
│   app/api/chat/route.ts ─► OpenAI embed (upit → vektor)         │
│                          ─► Pinecone query (top-K=5 chunkova)   │
│                          ─► Anthropic Claude (kontekst+pitanje) │
│                          ─► stream odgovora natrag              │
│        │                                                         │
│        ▼                                                         │
│   <FloatingChatbot> renderuje token-by-token                    │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Tech stack

| Sloj | Tehnologija | Razlog |
|------|-------------|--------|
| Framework | Next.js 14.2 App Router, React 18, TypeScript | Već postoji u `smrcat-demo` |
| Vector DB | Pinecone (serverless, AWS us-east-1, cosine, 1536 dim) | Free tier, sample iz Dana 3 obuke |
| Embeddings | OpenAI `text-embedding-3-small` | 1536 dim, jeftin (~$0.02 za 1M tokena) |
| LLM | Anthropic `claude-sonnet-4-5` | Konzistentno s Dana 3 obuke; balans cijena/kvalitet |
| Chunking | `@langchain/textsplitters` `RecursiveCharacterTextSplitter` | Identičan API kao Python verzija iz obuke |
| State (chat) | React `useState` po komponenti | Dovoljno za prvu iteraciju, kasnije Zustand ako treba persist |
| Styling | Tailwind + shadcn/ui (već postoji) | Match s ostatkom aplikacije |
| Streaming | Vercel AI SDK (`ai` paket + `@ai-sdk/anthropic`) | First-class podrška za Anthropic streaming u Next.js |
| Deploy | Vercel | Standardno za Next.js, env secrets podržani |

### 2.3 Razlike u odnosu na materijal iz Dana 3 obuke

Dan 3 koristi **Python + Streamlit** kao demo. Mi koristimo **TypeScript + Next.js** zbog produkcijskih zahtjeva:

| | Dan 3 obuka | Naš pristup |
|---|---|---|
| Ingest jezik | Python | TypeScript |
| Embedding | jedan-po-jedan (sporo) | batch (1 OpenAI poziv za 50 chunkova) |
| Chunk ID | random UUID | SHA256 hash sadržaja → dedupe pri re-run |
| Frontend | Streamlit (zaseban Python app) | React komponenta unutar postojeće aplikacije |
| Deploy | Streamlit Cloud | Vercel |
| Stack | dva (Python + frontend) | jedan (Node) |

---

## 3. Status — gdje smo

### Završeno

- ✅ **Korak 1**: Setup (Pinecone, OpenAI, Anthropic nalozi i ključevi)
- ✅ **Korak 2**: Knowledge base — 5 MD dokumenata kreirano (vidi sekciju 4)
- ✅ **Korak 3.1**: Pinecone index `rag-msp-smrcak` kreiran (1536 dim, cosine, AWS us-east-1, serverless)
- ✅ **Korak 3.2**: Ingest skripta `scripts/ingest.ts` napisana (vidi sekciju 6)

### U toku / sljedeće

- 🔜 **Korak 3.3**: Korisnik treba pokrenuti `npm run ingest` i potvrditi da je 40-50 vektora u Pinecone-u
- 🔜 **Korak 4**: Floating chatbot UI + API route (vidi sekciju 7 — specifikacija)
- ⏳ **Korak 5**: Test pitanja po metodi PROMPT C iz biblioteke (vidi sekciju 8)
- ⏳ **Korak 6**: Deploy na Vercel sa secrets
- ⏳ **Korak 7+**: Dodatni scenariji — email asistent, wizard asistent, doc auto-fill

---

## 4. Knowledge base — 5 dokumenata

**Lokacija**: `data/dokumenti/` u root-u `smrcat-demo` projekta

Sadržaj je **sintetički** ali realističan — generisan na osnovu javno dostupnog profila Smrčaka. Treba ga zamijeniti pravim podacima nakon discovery razgovora s klijentom.

### 4.1 `katalog_proizvoda.md` (~14 chunkova)

Kompletan katalog proizvoda po kategorijama:

- **Vrganji** (Boletus edulis): svjež A, sušen cijeli A, sušen rezovi A, sušen klasa B, IQF smrznut A, prah
- **Lisičarke** (Cantharellus cibarius): svježa A, sušena, u salamuri, IQF
- **Smrčci** (Morchella esculenta) — premium: sušen klasa A, klasa B
- **Bukovače** (Pleurotus ostreatus): sušene, prah
- **Šumski plodovi**: borovnica IQF, malina IQF, borovnica sušena

Za svaki proizvod: **šifra**, latinski naziv, EN/DE prevod, sezona, klasa, pakovanje, MOQ, rok trajanja.

### 4.2 `cjenovnik_2026.md` (~7 chunkova)

- Cijene EUR/kg po šifri proizvoda (npr. SMR-VRG-SU-A = 95 EUR/kg)
- Popusti za količinu (3% za 5K, 5% za 15K, 7% za 50K, dogovorom za 100K+)
- Uslovi isporuke: FCA Zvornik (default), DAP po zemljama (Munich +0.18, Milano +0.22, Beč +0.15, Pariz +0.32, Zürich +0.28 EUR/kg)
- Avio transport (Frankfurt +1.80, CDG +2.10 EUR/kg)
- Uslovi plaćanja (50/50 novi kupci, 30/70 NET 30 postojeći, NET 45/60 strateški)
- Dodatni troškovi (fito 25 EUR, EUR.1 15 EUR, mikrobiološki test 85 EUR, custom etikete 250+0.12, privatna marka 1500+0.40)

### 4.3 `sertifikati_i_kvalitet.md` (~7 chunkova)

- **BioSuisse Organic**: certifikat BIO-2024-887, validan 04/2024–03/2027, sertifikator bio.inspecta AG
- **IFS Food**: u pripremi, audit zakazan septembar 2026, ciljani Higher Level
- **Fitosanitarni**: izdaje Uprava BiH za zaštitu zdravlja bilja, ispostava Bijeljina, 25 EUR po pošiljci, 2-3 dana
- **EUR.1**: izdaje Vanjskotrgovinska komora BiH, 15 EUR, 1 dan, smanjuje carinu do 14.4%
- **HACCP**: odobren 2022, revidiran 2024
- **Sljedivost**: po LOT broju do regije berbe (Romanija, Ozren, Majevica, Vlašić)
- Šta se garantuje (vlažnost max 12%, odsustvo plijesni/crva), šta NE (kvar zbog transporta van kontrole, prirodne varijacije boje)

### 4.4 `procedure_izvoza.md` (~9 chunkova)

10-koračni proces od narudžbe do isporuke:

1. Upit kupca (24h response)
2. Ponuda (validna 14 dana)
3. Potvrda narudžbe + Pro Forma
4. Predujam (T/T 1-3 dana)
5. Priprema pošiljke (3-5 dana lager, 7-14 dana standard)
6. Dokumentacija (2 dana prije otpreme)
7. Utovar i otprema
8. Carinjenje na izlazu BiH (4-8h)
9. Tranzit (Munich 36-48h, Milano 28-36h, Beč 24-32h)
10. Doplata 70%

Dokumenti uz pošiljku: komercijalna faktura, packing list, CMR/AWB, fitosanitarni, EUR.1, BioSuisse potvrda. Posebni zahtjevi po zemljama (DE strogi fito, IT italijanski prevod etiketa, AT AGES kontrola, FR Ecocert dodatni, CH posebne kvote).

### 4.5 `FAQ_EU_kupci.md` (~8 chunkova)

15 najčešćih pitanja kupaca: kako naručiti, MOQ po proizvodu, uzorci (100g sušeno/250g IQF, refundacija pri narudžbi >5K), sezonalnost (smrčci IV-V, lisičarke VI-IX, vrganji VII-X), organic certifikat, dokumentacija, rokovi, plaćanje, prednosti (BioSuisse + sljedivost + vlastita prerada), privatne marke (>1000kg), prirodne varijacije boje (nije reklamacija), transport (FCA standard), pouzdanost (94% on-time u 2024-2025), rezervacija količine za sezonu, posjete pogonu (najava 2 sedmice).

---

## 5. Pinecone setup

### 5.1 Index konfiguracija

| Polje | Vrijednost |
|-------|-----------|
| Name | `rag-msp-smrcak` |
| Dimensions | **1536** (mora biti, za `text-embedding-3-small`) |
| Metric | `cosine` |
| Capacity mode | Serverless |
| Cloud | AWS |
| Region | `us-east-1` |

### 5.2 Naming convention

`rag-msp-{firma}` — drugi MSP-ovi NextPixel-a će dobiti svoj index (npr. `rag-msp-gmp`, `rag-msp-prijedorcanka`). Ne miješaju se u isti index.

### 5.3 Host URL

`rag-msp-smrcak-y5dgxkt.svc.aped-4627-b74a.pinecone.io`

**Napomena**: SDK derive-uje host iz imena indexa, ne treba ga prosljeđivati u kodu.

---

## 6. Ingest skripta (Korak 3 — gotov)

### 6.1 Komande za setup

```bash
# U root-u smrcat-demo projekta:
npm install @pinecone-database/pinecone openai @langchain/textsplitters dotenv
npm install -D tsx

# Kreiraj folder za dokumente i ubaci 5 MD fajlova:
mkdir -p data/dokumenti
# (ručno copy-paste 5 MD fajlova ili git checkout)

# U package.json scripts dodaj:
#   "ingest": "tsx scripts/ingest.ts"
```

### 6.2 `.env.local` (root projekta)

```env
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=pcsk_...
PINECONE_INDEX=rag-msp-smrcak
ANTHROPIC_API_KEY=sk-ant-...
```

**KRITIČNO**: `.env.local` je u `.gitignore` (uzorak `.env*.local`). Ne commit-uj `.env` ni `.env.example` sa pravim ključevima. Ako se desi da je ključ otišao na GitHub, regeneriši ga.

### 6.3 `scripts/ingest.ts` — kompletan kod

```typescript
/**
 * INGEST SKRIPTA — Smrčak RAG
 *
 * Čita dokumente iz data/dokumenti/, dijeli na chunkove, batch-embed-uje
 * preko OpenAI-a, upsert-uje u Pinecone s deterministic ID-evima.
 *
 * Pokretanje (iz root-a projekta):
 *   npm run ingest
 *
 * Re-runs su sigurni — dedupe po hash-u sadržaja.
 */

import { config } from "dotenv";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { createHash } from "crypto";

config({ path: ".env.local" });

const REQUIRED_ENV = ["OPENAI_API_KEY", "PINECONE_API_KEY", "PINECONE_INDEX"];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`❌ Nedostaje env varijabla: ${key}`);
    process.exit(1);
  }
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const index = pc.index(process.env.PINECONE_INDEX!);

const DOCS_DIR = "./data/dokumenti";
const SUPPORTED_EXTS = [".md", ".txt"];
const EMBED_MODEL = "text-embedding-3-small";
const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 150;
const PINECONE_BATCH_SIZE = 100;

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: CHUNK_SIZE,
  chunkOverlap: CHUNK_OVERLAP,
  separators: ["\n\n", "\n", ". ", ", ", " ", ""],
});

type Chunk = {
  id: string;
  text: string;
  source: string;
  chunkIndex: number;
};

function readDocs(dir: string) {
  let files: string[];
  try {
    files = readdirSync(dir).filter((f) =>
      SUPPORTED_EXTS.some((ext) => f.endsWith(ext)),
    );
  } catch {
    console.error(`❌ Folder ne postoji: ${dir}`);
    process.exit(1);
  }
  if (files.length === 0) {
    console.error(`❌ Nema .md/.txt fajlova u ${dir}`);
    process.exit(1);
  }
  return files.map((name) => ({
    name,
    content: readFileSync(join(dir, name), "utf-8"),
  }));
}

function hashId(source: string, chunkIndex: number, content: string): string {
  return createHash("sha256")
    .update(`${source}:${chunkIndex}:${content}`)
    .digest("hex")
    .slice(0, 32);
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: EMBED_MODEL,
    input: texts,
  });
  return response.data.map((d) => d.embedding);
}

async function main() {
  console.log(`📂 Čitam dokumente iz ${DOCS_DIR}\n`);
  const docs = readDocs(DOCS_DIR);
  console.log(`📄 Pronađeno ${docs.length} dokumenata`);

  const allChunks: Chunk[] = [];
  for (const doc of docs) {
    const chunks = await splitter.splitText(doc.content);
    console.log(`   ${doc.name} → ${chunks.length} chunkova`);
    chunks.forEach((text, i) => {
      allChunks.push({
        id: hashId(doc.name, i, text),
        text,
        source: doc.name,
        chunkIndex: i,
      });
    });
  }
  console.log(`\n🧩 Ukupno chunkova: ${allChunks.length}`);

  console.log(`\n🤖 Embedding (batch, ${EMBED_MODEL})...`);
  const t0 = Date.now();
  const embeddings = await embedBatch(allChunks.map((c) => c.text));
  console.log(`   ✓ ${embeddings.length} vektora za ${(Date.now() - t0) / 1000}s`);

  console.log(`\n☁️  Upsert u Pinecone (${process.env.PINECONE_INDEX})...`);
  const vectors = allChunks.map((c, i) => ({
    id: c.id,
    values: embeddings[i],
    metadata: {
      text: c.text,
      source: c.source,
      chunkIndex: c.chunkIndex,
    },
  }));

  for (let i = 0; i < vectors.length; i += PINECONE_BATCH_SIZE) {
    const batch = vectors.slice(i, i + PINECONE_BATCH_SIZE);
    await index.upsert(batch);
    console.log(`   ${Math.min(i + batch.length, vectors.length)}/${vectors.length}`);
  }

  await new Promise((r) => setTimeout(r, 1500));
  const stats = await index.describeIndexStats();
  console.log(`\n✅ Gotovo`);
  console.log(`📊 Index ima ${stats.totalRecordCount ?? "?"} vektora\n`);
}

main().catch((err) => {
  console.error("\n❌ Greška:");
  console.error(err);
  process.exit(1);
});
```

### 6.4 Očekivani output

```
📂 Čitam dokumente iz ./data/dokumenti

📄 Pronađeno 5 dokumenata
   FAQ_EU_kupci.md → 8 chunkova
   cjenovnik_2026.md → 7 chunkova
   katalog_proizvoda.md → 14 chunkova
   procedure_izvoza.md → 9 chunkova
   sertifikati_i_kvalitet.md → 7 chunkova

🧩 Ukupno chunkova: 45

🤖 Embedding (batch, text-embedding-3-small)...
   ✓ 45 vektora za 0.8s

☁️  Upsert u Pinecone (rag-msp-smrcak)...
   45/45

✅ Gotovo
📊 Index ima 45 vektora
```

---

## 7. Korak 4 — Floating Chatbot (specifikacija za code agenta)

### 7.1 Šta gradimo

**Floating chatbot widget** dostupan na svakoj stranici aplikacije:

- Plutajuće dugme u donjem desnom uglu (forest brand color)
- Klik otvara panel ~400×600px sa chat istorijom
- User unosi pitanje → POST na `/api/chat` sa pitanjem + istorijom
- API route: embed pitanje → Pinecone search top-K=5 → Claude streaming odgovor sa kontekstom → vraća chunks za "View sources" UI
- Chat poruke prikazuju izvor (npr. "iz: cjenovnik_2026.md")

### 7.2 Fajlovi za kreirati

```
app/api/chat/route.ts                    # POST endpoint, streaming
components/chatbot/FloatingChatbot.tsx   # glavni widget
components/chatbot/ChatPanel.tsx         # panel sa istorijom
components/chatbot/MessageBubble.tsx     # individualna poruka
components/chatbot/SourcesPopover.tsx    # prikaz izvora ispod AI poruke
lib/rag.ts                               # core RAG logika (embed + search)
```

### 7.3 Fajl za izmijeniti

`app/layout.tsx` — dodati `<FloatingChatbot />` kao sibling `<Footer />` da se renderuje na svakoj stranici.

### 7.4 Dodatni paketi

```bash
npm install ai @ai-sdk/anthropic @anthropic-ai/sdk
```

`ai` paket je Vercel AI SDK — standardni za streaming u Next.js. `@ai-sdk/anthropic` adapter za Claude.

### 7.5 API route — pseudokod

```typescript
// app/api/chat/route.ts
import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';

export async function POST(req: Request) {
  const { messages } = await req.json();
  const lastUserMessage = messages[messages.length - 1].content;

  // 1. Embed pitanje
  const embedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: lastUserMessage,
  });

  // 2. Pinecone search
  const results = await index.query({
    vector: embedding.data[0].embedding,
    topK: 5,
    includeMetadata: true,
  });

  // 3. Build context
  const context = results.matches
    .map(m => `[Izvor: ${m.metadata.source}]\n${m.metadata.text}`)
    .join('\n\n');

  // 4. Stream Claude response
  const result = streamText({
    model: anthropic('claude-sonnet-4-5'),
    system: SYSTEM_PROMPT,
    messages: [
      ...messages.slice(0, -1),
      {
        role: 'user',
        content: `KONTEKST:\n\n${context}\n\nPITANJE: ${lastUserMessage}`,
      },
    ],
  });

  return result.toDataStreamResponse({
    // Custom: priložiti izvore u response headers ili u stream metadata
  });
}
```

### 7.6 System prompt

```
Ti si AI asistent firme Smrčak d.o.o. iz Zvornika.
Smrčak izvozi šumske gljive (vrganji, lisičarke, smrčci, bukovače) i šumske
plodove (borovnice, maline) u EU — glavni kupci Njemačka, Italija, Austrija,
Francuska, Švajcarska. BioSuisse organic certifikovani.

Tvoja uloga je da pomažeš zaposlenicima Smrčaka da brzo odgovore na pitanja
o proizvodima, cijenama, sertifikatima i procedurama izvoza.

PRAVILA:
1. Odgovaraj SAMO iz priloženog konteksta (KONTEKST sekcija).
2. Ako informacija nije u kontekstu, reci: "Nemam tu informaciju u trenutnoj
   bazi znanja. Kontaktirajte [relevantni email iz dokumenata]."
3. NIKAD ne izmišljaj cijene, MOQ, rokove, šifre proizvoda, sertifikate.
4. Uvijek navedi izvor (naziv .md fajla iz konteksta).
5. Sezonalnost je VAŽNA — svježi proizvodi nisu uvijek dostupni:
   - Smrčci: april–maj
   - Lisičarke: jun–septembar
   - Vrganji: jul–oktobar
   - Šumski plodovi: ljeto
6. Cijene su uvijek u EUR (FCA Zvornik default) osim ako nije drugačije naznačeno.
7. Kratko, profesionalno, BCS jezik (osim ako kupac piše na drugom jeziku).
8. Ako kupac piše na DE/IT/EN/FR — odgovori na njegovom jeziku ALI držeći se
   konteksta iz dokumenata (tehnički podaci ostaju isti).
```

### 7.7 UI/UX zahtjevi

- **Pozicija**: `position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 50;`
- **Dugme zatvoreno**: krug 56×56px, forest pozadina, `MessageCircle` ikona iz lucide-react
- **Panel otvoren**: 400×600px (na mobilnom: full-screen), bordered, rounded-lg, shadow-xl
- **Brand colors**: forest (`hsl(121 39% 27%)`), moss (`hsl(83 38% 56%)`), cream (`hsl(43 35% 93%)`)
- **Tipografija**: Source Serif 4 za naslove, Inter za body (već u layout-u)
- **Streaming**: token-by-token render, animacija kursora dok piše
- **Sources**: collapsible popover ispod svake AI poruke, prikazuje source filename + score + prvih 200 chars chunka
- **Empty state**: 3-4 predložena pitanja kao quick actions ("Koja je MOQ za vrganj A klase?", "Šta sve ide u BioSuisse pošiljku?", "Rok za Munich?")
- **Auto-scroll**: na novu poruku scroll-uj na dno
- **Disabled state**: input disabled dok stream traje, dugme šalje promijeni u loading spinner

### 7.8 Edge cases za handle-ovati

- Pinecone vraća 0 matches → "Nemam relevantne informacije u bazi znanja."
- Claude API rate limit → user-friendly poruka "Trenutno previše pitanja, pokušajte ponovo za 30s"
- Network error → retry sa exponential backoff (max 3 puta)
- Korisnik šalje prazan input → ignoriši (ne POST-uj)
- Korisnik šalje vrlo dug input (>10K znakova) → odbij sa porukom "Pitanje predugo, sažmite"

---

## 8. Korak 5 — Test pitanja (po PROMPT C metodi iz Dana 3)

5 kategorija pitanja za verifikaciju RAG-a, prilagođeno za Smrčak:

### 8.1 Direktno pitanje o cijeni/proizvodu
> "Koliko košta vrganj sušen klasa A po kg?"
>
> **Očekivano**: 95 EUR/kg, izvor: cjenovnik_2026.md

### 8.2 Kombinacija dva ili više dokumenata
> "Koliko bi koštalo 200kg vrganja sušenog klasa A za isporuku u Munich, sa popustom?"
>
> **Očekivano**: cijena iz cjenovnik_2026.md (95×200=19000) + popust 5% (15000-50000 raspon) → 18050 + transport DAP Munich (200×0.18=36) → ~18086 EUR. Izvor: cjenovnik_2026.md (cijena, popust, transport)

### 8.3 Test halucinacije
> "Da li Smrčak proizvodi tartufe?"
>
> **Očekivano**: "Nemam tu informaciju u trenutnoj bazi znanja. Smrčak ima u asortimanu vrganje, lisičarke, smrčke, bukovače i šumske plodove."
>
> **Crveno**: ako Claude izmisli da Smrčak proizvodi tartufe, halucinira.

### 8.4 Kompleksan biznis upit
> "Imam novog njemačkog kupca koji prvi put naručuje 500kg lisičarki sušenih. Koji su uslovi plaćanja i šta sve ide u dokumentaciji?"
>
> **Očekivano**: novi kupci 50/50, FCA Zvornik, dokumentacija (komercijalna faktura, packing list, CMR, fitosanitarni, EUR.1, BioSuisse), DE-specifična napomena (strogi fito, EU-Bio etiketa). Izvori: cjenovnik_2026.md + procedure_izvoza.md + sertifikati_i_kvalitet.md.

### 8.5 Kvalitativno pitanje
> "Šta nas razlikuje od drugih dobavljača sušenih gljiva?"
>
> **Očekivano**: BioSuisse organic, sljedivost po regiji berbe (LOT broj), vlastita prerada (sušenje + IQF u pogonu Zvornik). Izvor: FAQ_EU_kupci.md (pitanje 9).

### 8.6 Pravilo za prezentaciju klijentu

PROMPT C iz biblioteke obuke kaže — za prezentaciju spremiti **3 pitanja**: lakše (direktno), srednje (kombinacija), test halucinacije. Klijent vidi šta radi i šta NE radi (što je jednako bitno — pokazuje da AI nije magičan, ima jasne granice).

---

## 9. Korak 6 — Deploy

### 9.1 Vercel setup

1. `vercel link` u root-u projekta (ako nije linkovan)
2. `vercel env add OPENAI_API_KEY` (production)
3. Isto za `PINECONE_API_KEY`, `PINECONE_INDEX`, `ANTHROPIC_API_KEY`
4. `vercel --prod` za deploy

### 9.2 Monitoring i metrike

Razmotriti dodavanje (out-of-scope za prvu iteraciju, ali bitno za retainer):

- **Logging upita** — koje pitanje je postavljeno, koji su izvori vraćeni, koliko je trajalo, da li je korisnik dao thumbs up/down
- **Cost tracking** — broj OpenAI embeddings poziva (1 po upitu) i Anthropic input/output tokena
- **Pinecone metrics** — broj queries, latencija
- **Rate limiting** — npr. Vercel KV ili Upstash Redis za limit 30 upita po IP-u u minuti

### 9.3 Cijena u produkciji (estimate)

Za 100 upita/dan, 30 dana:

| Stavka | Mjesečna cijena |
|--------|-----------------|
| OpenAI embeddings (3K upita × ~50 tokena) | ~$0.01 |
| Pinecone (100K vektora free tier, do 200 queries/sec free) | $0 |
| Anthropic Claude Sonnet 4.5 (~3K queries × ~3K tokens prosjek) | ~$30-45 |
| Vercel Hobby tier | $0 |
| **Ukupno** | **~$30-50** |

---

## 10. Korak 7+ — Dodatni scenariji (post-MVP)

### 10.1 Scenario 2: Email asistent

Trenutno `lib/mockAi.ts:simulateClassification` čita `ocekivana_kategorija` polje. Zamjena:

- Pravi Claude API poziv za klasifikaciju emaila
- RAG context: cjenovnik (za pitanja o cijeni), procedure_izvoza (za logistička), katalog (za upite o proizvodima)
- Bonus: dugme "Generiši draft odgovor" — Claude pravi prijedlog odgovora koristeći RAG kontekst + jezik kupca + Smrčak ton

**Lokacija**: `components/inbox/EmailPreview.tsx` (postoji), dodati novu sekciju s "AI asistent" panel-om.

### 10.2 Scenario 3: Wizard asistent

Pri kreiranju nove pošiljke (`app/posiljke/nova/page.tsx`), dodati side-panel s asistentom koji odgovara na pitanja u kontekstu wizard-a:

- "Koje dokumente trebam za Njemačku?"
- "Koja MOQ za vrganj klase A?"
- "Koliko traje priprema za 300kg lisičarki?"

Kontekst: trenutni step + odabrani kupac + odabrani proizvodi → RAG search se može filtrirati po metadata (npr. ako je odabrana DE, tražiti chunks koji sadrže "Njemačka").

### 10.3 Scenario 4: Doc auto-fill

Najambicioznije — zamjena `simulateDocumentGeneration`. Real Claude poziv koji:

- Prima podatke o pošiljci (kupac, proizvodi, transport) iz wizard-a
- Koristi RAG za izvlačenje template-a po zemlji (DE format faktura, IT format itd.)
- Generiše JSON sa svim poljima
- Frontend renderuje PDF kroz `react-pdf` ili Python service na pozadini

**Bitno**: zahtijeva structured output (Claude tool use), schema validation, human-in-the-loop pregled prije slanja.

---

## 11. Folder struktura projekta nakon Korak 4

```
smrcat-demo/
├── .env.local                          # ⚠️ gitignore-ovan, sa svim API ključevima
├── .env.example                        # ⚠️ template bez pravih vrijednosti
├── package.json                        # + ingest skript, + ai/anthropic/openai/pinecone paketi
├── next.config.mjs
├── tsconfig.json
├── tailwind.config.ts
│
├── app/
│   ├── layout.tsx                      # ✏️ izmijenjen: dodat <FloatingChatbot />
│   ├── page.tsx                        # postojeći Dashboard
│   ├── api/
│   │   └── chat/
│   │       └── route.ts                # 🆕 POST endpoint za RAG
│   ├── inbox/page.tsx                  # postojeći (Scenario 2 kasnije)
│   ├── posiljke/                       # postojeći (Scenario 3 kasnije)
│   ├── kupci/                          # postojeći
│   └── kooperanti/                     # postojeći
│
├── components/
│   ├── chatbot/                        # 🆕 RAG widget
│   │   ├── FloatingChatbot.tsx
│   │   ├── ChatPanel.tsx
│   │   ├── MessageBubble.tsx
│   │   └── SourcesPopover.tsx
│   ├── inbox/                          # postojeći
│   ├── kooperanti/                     # postojeći
│   ├── posiljke/                       # postojeći
│   ├── wizard/                         # postojeći
│   ├── shared/                         # postojeći
│   ├── ui/                             # shadcn/ui
│   └── layout/                         # postojeći
│
├── lib/
│   ├── rag.ts                          # 🆕 core RAG logika (embed + search)
│   ├── mockAi.ts                       # postojeći (kasnije zamjena za Scenarios 2-4)
│   ├── format.ts
│   ├── relativeTime.ts
│   ├── utils.ts
│   └── wizardSeed.ts
│
├── data/
│   ├── dokumenti/                      # 🆕 RAG knowledge base
│   │   ├── katalog_proizvoda.md
│   │   ├── cjenovnik_2026.md
│   │   ├── sertifikati_i_kvalitet.md
│   │   ├── procedure_izvoza.md
│   │   └── FAQ_EU_kupci.md
│   ├── kupci.json                      # postojeći mock
│   ├── posiljke.json                   # postojeći mock
│   ├── kooperanti.json                 # postojeći mock
│   ├── lotovi.json                     # postojeći mock
│   └── emailovi.json                   # postojeći mock
│
├── scripts/
│   ├── ingest.ts                       # 🆕 RAG ingest skripta
│   └── generate_pdfs/                  # postojeći Python za sample PDF dokumente
│
├── public/
│   └── sample-docs/                    # postojeći sample PDFovi
│
├── stores/
│   └── useAppStore.ts                  # postojeći Zustand
│
├── types/
│   └── index.ts                        # postojeći (možda dodati ChatMessage, RAGResult tipove)
│
└── e2e/                                # postojeći Playwright testovi
```

---

## 12. Sigurnosne i operativne napomene

### 12.1 Secrets management

- **NIKAD** ne commit-uj API ključeve u `.env.example`, samo u `.env.local`
- Vercel env varijable: koristi različite za production/preview/development
- Pinecone API ključ ima full access — razmotri kreiranje **read-only** ključa za Vercel serverless funkcije (production), a admin ključ samo lokalno za ingest
- Anthropic dashboard: postavi spending limit (npr. $50/mjesec) da spriječiš rate-bombing

### 12.2 Prompt injection

System prompt eksplicitno govori "odgovaraj SAMO iz konteksta" — to je prva linija odbrane. Ali ne i jedina. Dodati:

- **Input sanitization**: ne ubacuj sirovi user input u system prompt (samo u user role poruku)
- **Output filtering**: ako Claude vrati nešto što izgleda kao Smrčak interni email/podatak koji nije u dokumentima, signal je da nešto nije u redu (rare ali se desi)
- **Rate limiting**: kao gornji 9.2

### 12.3 Privatnost podataka

Trenutno koristimo sintetičke podatke. Ako Smrčak da prave podatke (cjenovnik s PRAVIM brojevima, prave kupce, itd.):

- Pinecone EU region ako je moguće (trenutno us-east-1, za GDPR razmotriti `eu-west-1`)
- Anthropic ima zero-retention politiku za API-je preko sklopljenog ugovora — provjeri da li za free tier radi
- Logging upita: ne logiraj cijela pitanja+odgovore u jasnom tekstu, ako će biti osjetljivih podataka

---

## 13. Reference

### Anthropic
- API docs: `https://docs.claude.com`
- Model `claude-sonnet-4-5` (string identifier)
- Streaming s Vercel AI SDK: `https://sdk.vercel.ai/providers/ai-sdk-providers/anthropic`

### Pinecone
- TypeScript SDK: `@pinecone-database/pinecone`
- Free tier: 100K vektora, 1 index, serverless
- Docs: `https://docs.pinecone.io`

### OpenAI
- Embeddings: `text-embedding-3-small`, 1536 dim, $0.02/1M tokens
- TypeScript SDK: `openai` paket

### LangChain
- TextSplitters: `@langchain/textsplitters` (novi paket, ne stari `langchain` monorepo)
- `RecursiveCharacterTextSplitter` API isti kao Python

### Vercel AI SDK
- `ai` paket — za streaming
- `@ai-sdk/anthropic` adapter
- Docs: `https://sdk.vercel.ai`

### AI Forward Dan 3 materijali (kontekst, ne kod)
- `06_RAG_Vodic.docx` — koncepti
- `02_Prirucnik_Ucesnici_Dan3_RAG.docx` — workflow
- `03_Biblioteka_Promptova_Dan3.docx` — PROMPT A/B/C
- Predavač: Đuro Grubišić (ICBL Banja Luka + Bloomteq)

---

## 14. Šta treba uraditi sljedeće (za code agenta)

1. **Provjeriti da je `npm run ingest` prošao kod korisnika** — Pinecone treba da ima 40-50 vektora
2. **Implementirati Korak 4** po specifikaciji iz sekcije 7:
   - `app/api/chat/route.ts`
   - `components/chatbot/*.tsx` (4 komponente)
   - `lib/rag.ts` (helper za embed + search)
   - Update `app/layout.tsx` da uključi `<FloatingChatbot />`
3. **Test lokalno** sa pitanjima iz sekcije 8
4. **Deploy na Vercel** (sekcija 9)
5. **Demo klijentu** (Smrčak)
6. **Iterirati** — ako klijent traži više, ići na Scenarios 2/3/4 (sekcija 10)

---

**Vlasnik projekta**: Nikola Milutinović / NextPixel
**Klijent**: Smrčak d.o.o. (kroz AI Forward program)
**Datum dokumenta**: 27.04.2026.
**Verzija**: 1.0
