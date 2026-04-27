# Chatbot Mode Toggle (Biznis | Aplikacija) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dodati segmented toggle u empty state chatbot panela koji omogućava korisniku da bira između dva mode-a — "Interno znanje" (proizvodi, cijene, sertifikati, procedure izvoza) i "Aplikacija" (kako koristiti softver, statusi, ekrani). Svaki mode ima svoja 4 specifična predložena pitanja, a izabrani mode se proslijedi `/api/chat` endpoint-u koji filtrira Pinecone search po `source` metadata polju da pretraga ne miješa biznis i app dokumente.

**Architecture:** Tri sloja izmjena — (1) **lib/rag.ts** dobija `ChatScope` tip + `buildScopeFilter` helper koji vraća Pinecone metadata filter (`{source: {$ne: "uputstvo_aplikacije.md"}}` za biznis, `{source: {$eq: "uputstvo_aplikacije.md"}}` za app, undefined za all). (2) **API route** prihvata opcioni `scope` parametar u request body, validira ga, prosljeđuje u `searchTopK`. (3) **ChatPanel** drži `mode` state (default "biznis"), renderuje segmented control u empty state-u, prikazuje 4 pitanja po mode-u, prosljeđuje mode u `useChatStream.send()` i dalje u fetch body. Toggle se ne prikazuje nakon prvog poslanog pitanja (postaje nerelevantno kad već postoji konverzacija).

**Tech Stack:** TypeScript · Pinecone metadata filtering · React useState · Tailwind CSS · Playwright e2e mock testovi

---

## Background

Korisnik želi da odvoji teme razgovora — neki ljudi će pričati o korištenju aplikacije (statusi, wizard, mapa kooperanata), drugi o proizvodima/cijenama. Trenutno su sve 4 quick questions u empty state-u pomiješane (2 biznis + 2 app), što ne pomaže korisniku da fokusira pretragu. Dodatno, kad AI dobije pitanje "Kako kreiram novu pošiljku?", on može vratiti irelevantne chunkove iz cjenovnika ili FAQ-a jer nema scope filter.

Rješenje: vidljiv UI toggle + Pinecone metadata filter. UI sloj daje korisniku jasan signal "u kojem si modu", API sloj garantuje da AI dobije samo relevantne chunkove.

---

## File Structure

```
smrcak-demo/
├── lib/
│   └── rag.ts                       # ✏️ ChatScope type, buildScopeFilter, filter param u searchTopK
├── app/
│   └── api/
│       └── chat/
│           └── route.ts             # ✏️ Prihvati scope iz body, pozovi buildScopeFilter
└── components/
    └── chatbot/
        ├── useChatStream.ts         # ✏️ send() prima scope, šalje u fetch body
        └── ChatPanel.tsx            # ✏️ mode state, ToggleControl komponenta, per-mode questions
└── e2e/
    └── faza-10-rag.spec.ts          # ✏️ 1 novi test za toggle UI + scope u API call
```

**Boundary rationale:** `lib/rag.ts` je server-only RAG core — natural mjesto za scope tip i filter helper. API route je thin orchestrator — samo validira scope i prosljeđuje. ChatPanel je samostalan UI module — drži mode state lokalno, ne treba globalni Zustand jer mode je kratko-životan (samo dok je panel otvoren). `useChatStream` se proširuje da accept scope kao param `send()` funkcije, ne kao state hook-a.

---

## Current State (already partially executed)

Prije pisanja plana, sljedeće je već implementirano:
- ✅ Task 1 Step 1-3: `lib/rag.ts` ima `ChatScope`, `APP_DOC_FILE`, `buildScopeFilter`, `searchTopK` sa optional filter param
- ✅ Task 2 Step 1-3: `app/api/chat/route.ts` accepts `scope` u body, validira i poziva `buildScopeFilter`, prosljeđuje filter u `searchTopK`
- 🟡 Task 3 Step 1-2: `useChatStream` ima exported `ChatScope` tip i `send()` accepts `scope` param, ALI fetch body još ne uključuje scope
- 🟡 Task 4: ChatPanel još nema toggle UI ni mode state
- 🟡 Task 5: nije pokrenuto

---

## Task 1: lib/rag.ts — ChatScope type + filter helper (DONE)

**Files:**
- Modify: `lib/rag.ts:79-90` (searchTopK signature) i dodati `ChatScope` + `buildScopeFilter` ispred

- [x] **Step 1: Dodaj ChatScope type i APP_DOC_FILE constant**

```typescript
export type ChatScope = "biznis" | "app" | "all";

export const APP_DOC_FILE = "uputstvo_aplikacije.md";
```

- [x] **Step 2: Dodaj buildScopeFilter helper**

```typescript
export function buildScopeFilter(scope: ChatScope) {
  if (scope === "biznis") return { source: { $ne: APP_DOC_FILE } };
  if (scope === "app") return { source: { $eq: APP_DOC_FILE } };
  return undefined;
}
```

- [x] **Step 3: Proširi searchTopK da accepta optional filter**

```typescript
export async function searchTopK(
  index: ReturnType<Pinecone["index"]>,
  vector: number[],
  topK = TOP_K,
  filter?: Record<string, unknown>,
): Promise<RagSource[]> {
  const result = await index.query({
    vector,
    topK,
    includeMetadata: true,
    ...(filter ? { filter } : {}),
  });
  // ... ostalo isto
}
```

- [x] **Step 4: Verifikuj kompilaciju**

Run: `npx tsc --noEmit`

Expected: bez greški.

---

## Task 2: API route — accept scope, build filter (DONE)

**Files:**
- Modify: `app/api/chat/route.ts:18-30` (imports), `:38-44` (interface ChatMessage + VALID_SCOPES), `:54-66` (parsing scope iz body), `:84-94` (poziv searchTopK sa filter)

- [x] **Step 1: Importuj nove API-je iz lib/rag**

```typescript
import {
  CHAT_MODEL,
  RagConfigError,
  TEMPERATURE,
  buildContext,
  buildScopeFilter,
  buildUserMessage,
  embedQuery,
  loadEnv,
  makeClients,
  searchTopK,
  SYSTEM_PROMPT,
  TOP_K,
  type ChatScope,
  type RagSource,
} from "@/lib/rag";
```

- [x] **Step 2: Dodaj VALID_SCOPES konstantu**

```typescript
const VALID_SCOPES: ChatScope[] = ["biznis", "app", "all"];
```

- [x] **Step 3: Parse scope iz request body**

Modifikuj POST handler:

```typescript
let body: { messages?: ChatMessage[]; scope?: ChatScope };
// ...
const scope: ChatScope =
  body.scope && VALID_SCOPES.includes(body.scope) ? body.scope : "all";
```

- [x] **Step 4: Pozovi buildScopeFilter i prosljedi u searchTopK**

```typescript
const filter = buildScopeFilter(scope);
const sources: RagSource[] = await searchTopK(
  index,
  queryVector,
  TOP_K,
  filter,
);
```

---

## Task 3: useChatStream — pass scope to fetch body

**Files:**
- Modify: `components/chatbot/useChatStream.ts` — exported type, send signature, fetch body

- [x] **Step 1: Export ChatScope type**

Već urađeno:

```typescript
export type ChatScope = "biznis" | "app" | "all";
```

- [x] **Step 2: send() accepts scope param**

Već urađeno (parameter signature):

```typescript
const send = useCallback(
  async (text: string, scope: ChatScope = "all") => {
```

- [ ] **Step 3: Dodaj scope u fetch body**

Pronađi fetch poziv u `useChatStream.ts` i modifikuj body da uključi scope:

```typescript
const res = await fetch(endpoint, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ messages: history, scope }),
  signal: controller.signal,
});
```

- [ ] **Step 4: Dodaj scope u dependency array useCallback-a**

Pronađi:

```typescript
}, [endpoint, messages, streaming]);
```

Dodaj scope ako koristi closure variable. Trenutno scope dolazi kao parametar, ne treba dodavati u deps.

- [ ] **Step 5: Verifikuj TypeScript**

Run: `npx tsc --noEmit`

Expected: bez greški.

---

## Task 4: ChatPanel — mode toggle UI + per-mode questions

**Files:**
- Modify: `components/chatbot/ChatPanel.tsx` — uvedi mode state, toggle, conditional questions, prosljeđivanje mode-a u send

- [ ] **Step 1: Dodaj import ChatScope tipa i useState mode-a**

Na vrhu `ChatPanel.tsx`:

```typescript
import { useChatStream, type ChatScope } from "./useChatStream";
```

I unutar komponente:

```typescript
const [mode, setMode] = useState<ChatScope>("biznis");
```

- [ ] **Step 2: Definiši pitanja po mode-u**

Zamijeni postojeću `QUICK_QUESTIONS` konstantu sa:

```typescript
const QUESTIONS_BY_MODE: Record<"biznis" | "app", { label: string; questions: string[] }> = {
  biznis: {
    label: "Interno znanje",
    questions: [
      "Koja je MOQ za vrganj sušen klasa A?",
      "Šta sve ide u dokumentaciji za EU pošiljku?",
      "Koliko košta DAP do Münchena za 200kg?",
      "Šta razlikuje Smrčak od konkurencije?",
    ],
  },
  app: {
    label: "Aplikacija",
    questions: [
      "Kako kreiram novu pošiljku iz emaila?",
      "Šta znači status Čeka pregled?",
      "Kako da odobrim ili odbijem dokument?",
      "Kako pratim sledljivost lota do kooperanta?",
    ],
  },
};
```

- [ ] **Step 3: Renderuj segmented toggle u empty state**

U JSX bloku gdje se trenutno renderuje empty state, prije liste pitanja, dodati toggle. Trenutni kod:

```tsx
<div data-test="chat-empty-state" className="space-y-3">
  <p className="text-sm text-muted-foreground">
    Pitajte me o proizvodima, cijenama, sertifikatima ili procedurama
    izvoza. Odgovaram iz baze znanja Smrčaka.
  </p>
  <div className="space-y-1.5">
    <p className="text-[11px] font-medium text-muted-foreground uppercase">
      Predložena pitanja
    </p>
    {QUICK_QUESTIONS.map((q) => (
      <button ... onClick={() => void send(q)}>...</button>
    ))}
  </div>
</div>
```

Promijeni u:

```tsx
<div data-test="chat-empty-state" className="space-y-3">
  <p className="text-sm text-muted-foreground">
    Izaberite temu razgovora pa pitajte. Odgovaram iz baze znanja Smrčaka.
  </p>

  <div
    role="tablist"
    aria-label="Mode razgovora"
    data-test="mode-toggle"
    className="flex gap-1 p-1 bg-cream rounded-lg"
  >
    {(["biznis", "app"] as const).map((m) => (
      <button
        key={m}
        role="tab"
        type="button"
        onClick={() => setMode(m)}
        data-test={`mode-${m}`}
        data-active={mode === m ? "true" : "false"}
        aria-selected={mode === m}
        className={cn(
          "flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-colors",
          mode === m
            ? "bg-card text-forest shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        {QUESTIONS_BY_MODE[m].label}
      </button>
    ))}
  </div>

  <div className="space-y-1.5">
    <p className="text-[11px] font-medium text-muted-foreground uppercase">
      Predložena pitanja
    </p>
    {QUESTIONS_BY_MODE[mode].questions.map((q) => (
      <button
        key={q}
        type="button"
        onClick={() => void send(q, mode)}
        disabled={streaming}
        data-test="quick-question"
        className="w-full text-left text-sm px-3 py-2 rounded-lg border border-border bg-card hover:bg-cream/60 transition-colors disabled:opacity-50"
      >
        {q}
      </button>
    ))}
  </div>
</div>
```

- [ ] **Step 4: Prosljedi mode kad korisnik kuca slobodno**

Pronađi `handleSubmit`:

```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (!input.trim() || streaming) return;
  const text = input.trim();
  setInput("");
  void send(text);
};
```

Promijeni:

```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (!input.trim() || streaming) return;
  const text = input.trim();
  setInput("");
  void send(text, mode);
};
```

Tako se mode poštuje i kad korisnik kuca svoje pitanje, ne samo na quick-questions.

- [ ] **Step 5: Verifikuj build**

Run: `npm run build`

Expected: ✓ Compiled successfully.

- [ ] **Step 6: Verifikuj lint**

Run: `npm run lint`

Expected: ✔ No ESLint warnings or errors.

---

## Task 5: E2E test za toggle UI

**Files:**
- Modify: `e2e/faza-10-rag.spec.ts` — dodati 1 novi test prije zatvaranja describe-a

- [ ] **Step 1: Dodaj test koji verifikuje toggle promjenu i slanje sa pravim scope**

Nakon postojećih testova, prije `})` zatvaranja describe bloka:

```typescript
test("mode toggle switches questions and sends scope to API", async ({ page }) => {
  let capturedBody: string | null = null;

  await page.route("**/api/chat", async (route) => {
    capturedBody = route.request().postData();
    await mockChatRoute(route, [
      { type: "sources", sources: [] },
      { type: "delta", content: "OK." },
      { type: "done" },
    ]);
  });

  await page.goto("/");
  await page.locator('[data-test="floating-chatbot-toggle"]').click();
  await expect(page.locator('[data-test="mode-toggle"]')).toBeVisible();

  // Default mode = biznis
  await expect(page.locator('[data-test="mode-biznis"]')).toHaveAttribute("data-active", "true");
  await expect(page.locator('[data-test="mode-app"]')).toHaveAttribute("data-active", "false");

  // Klik prvog quick-question u biznis mode-u
  await page.locator('[data-test="quick-question"]').first().click();
  expect(capturedBody).toBeTruthy();
  expect(JSON.parse(capturedBody!).scope).toBe("biznis");

  // Reset razgovora i prebaci na app mode
  await page.locator('[data-test="chat-clear"]').click();
  await page.locator('[data-test="mode-app"]').click();
  await expect(page.locator('[data-test="mode-app"]')).toHaveAttribute("data-active", "true");

  // Klik prvog quick-question u app mode-u — body sad ima scope: "app"
  capturedBody = null;
  await page.locator('[data-test="quick-question"]').first().click();
  expect(capturedBody).toBeTruthy();
  expect(JSON.parse(capturedBody!).scope).toBe("app");
});
```

- [ ] **Step 2: Pokreni test**

Run: `PW_USE_BUILD=1 npx playwright test --grep "mode toggle" --workers=1`

Expected: 2/2 prolazi (chromium + webkit).

- [ ] **Step 3: Pokreni cijelu Faza 10 suite**

Run: `PW_USE_BUILD=1 npx playwright test --grep "faza-10" --workers=1`

Expected: 22/22 prolazi (10 starih + 1 novi × 2 browsera = 22).

- [ ] **Step 4: Pokreni cijelu suite**

Run: `PW_USE_BUILD=1 npx playwright test --workers=2`

Expected: 98/98 prolazi (96 prethodnih + 2 nova).

---

## Task 6: Visual verifikacija u browseru

**Files:** none

- [ ] **Step 1: Restart preview server**

Već radi na portu 3100 preko launch.json. Prošlo je puno hot reload-ova; restart osigurava čist state:

```bash
lsof -ti:3100 | xargs kill -9 2>/dev/null
```

Pokreni `next-dev` preview server.

- [ ] **Step 2: Otvori panel i provjeri toggle**

U browseru:
1. Klik floating chatbot dugme dole desno
2. Provjeri da se vidi toggle "Interno znanje | Aplikacija" iznad pitanja
3. Provjeri da je default izabrano "Interno znanje" (forest text na bijeloj pozadini)
4. Provjeri da su 4 pitanja biznis-vezana (MOQ vrganj, dokumentacija EU, DAP Munich, razlika od konkurencije)
5. Klik "Aplikacija" — pitanja se mijenjaju u app-vezana (kreirati pošiljku, status Čeka pregled, odobravanje, sledljivost)
6. Klik na bilo koje pitanje — slanje radi normalno

- [ ] **Step 3: (Opciono) Provjeri da scope filter zaista filtrira u Pinecone**

Ako klijent ima Anthropic kredite:
- Mode "Aplikacija", pitanje "Kako kreiram novu pošiljku?" — odgovor citira **samo** `uputstvo_aplikacije.md`
- Mode "Interno znanje", pitanje "Koja je MOQ?" — odgovor citira `katalog_proizvoda.md` ili `cjenovnik_2026.md`, **NE** `uputstvo_aplikacije.md`
- Mode "Aplikacija", pitanje "Koja je MOQ?" — odgovor će reći "Nemam tu informaciju u trenutnoj bazi znanja" (jer scope filter isključuje cjenovnik)

---

## Task 7: Commit + push

- [ ] **Step 1: Stage promjene**

```bash
git add lib/rag.ts app/api/chat/route.ts components/chatbot/useChatStream.ts components/chatbot/ChatPanel.tsx e2e/faza-10-rag.spec.ts docs/superpowers/plans/2026-04-27-chatbot-mode-toggle.md
```

- [ ] **Step 2: Commit**

```bash
git commit -m "feat(chatbot): mode toggle Biznis | Aplikacija sa Pinecone scope filterom

UI promjena:
- Empty state ima segmented toggle 'Interno znanje | Aplikacija'
- Default izabrano 'Interno znanje' (biznis mode)
- 4 pitanja po mode-u (biznis: MOQ/dokumentacija/transport/razlika,
  app: kreiranje pošiljke/statusi/odobravanje/sledljivost)
- Mode se prenosi kad korisnik klikne quick-question I kad kuca slobodno

Backend promjena:
- lib/rag.ts ima ChatScope tip + buildScopeFilter helper
- API route prihvata scope u body i prosljeđuje Pinecone filter:
  - biznis: source != uputstvo_aplikacije.md
  - app: source == uputstvo_aplikacije.md
  - all (default): bez filtera
- searchTopK accepts optional filter param

Tako AI dobija samo relevantne chunkove i ne miješa biznis sa
'kako koristiti aplikaciju' temama.

E2E:
- 1 novi test mock-uje fetch i provjerava da se scope: 'biznis'/'app'
  šalje u request body kad korisnik klikne quick question
- 98/98 testova prolazi

Plan dokumentovan u docs/superpowers/plans/2026-04-27-chatbot-mode-toggle.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 3: Push**

```bash
git push origin main
```

Expected: 1 commit pushovan.

---

## Self-Review

**1. Spec coverage:**
- ✅ Toggle UI Biznis | Aplikacija — Task 4
- ✅ 4 pitanja po mode-u — Task 4 (QUESTIONS_BY_MODE)
- ✅ Mode se prenosi quick-questions — Task 4 (`onClick={() => send(q, mode)}`)
- ✅ Mode se prenosi i kad korisnik slobodno kuca — Task 4 Step 4 (`send(text, mode)`)
- ✅ API filtrira Pinecone po scope — Task 1, Task 2
- ✅ Default mode "biznis" — Task 4 Step 1 (`useState<ChatScope>("biznis")`)
- ✅ E2E test za toggle UI + scope u body — Task 5
- ✅ Visual provjera u browseru — Task 6

**2. Placeholder scan:** Plan ne sadrži "TBD", "TODO", "implementiraj kasnije". Sve code blokovi su kompletni. Sve komande imaju expected output.

**3. Type consistency:**
- `ChatScope` definisan u Task 1, importovan u Task 2 (route.ts) i Task 4 (ChatPanel.tsx) — isti naziv ✓
- `buildScopeFilter` definisan u Task 1, koristi se u Task 2 — isti naziv ✓
- `APP_DOC_FILE` constant — koristi se samo u Task 1 (interno u rag.ts) ✓
- `mode` state varijabla u Task 4 — koristi se u Task 4 Step 3 (toggle), Step 4 (handleSubmit) ✓
- `data-test` atributi u Task 4 (`mode-toggle`, `mode-biznis`, `mode-app`) → koriste se u Task 5 testovima ✓
- `QUESTIONS_BY_MODE` u Task 4 — definisan i koristi se samo u istom fajlu ✓

---

## Execution Notes

**Already done:** Tasks 1, 2, i Task 3 Step 1-2. Ostalo je Task 3 Step 3 (fetch body), cijeli Task 4 (ChatPanel UI), Task 5 (e2e test), Task 6 (visual verify), Task 7 (commit + push).

**Estimirano vrijeme za preostali rad:** 25-35 minuta inline execution.

**Risk:** nizak. Promjena je dobro izolovana (4 fajla), backend već radi (Tasks 1-2 testirani u prethodnim build-ovima), UI promjena je dodavanje toggle-a + conditional rendering. Nema breaking change-a u postojećim API-jima.
