# Uputstvo aplikacije — Smrčak interni sistem

> Šta sistem radi, kako se koristi, koji ekran čemu služi. Verzija demo prototipa, april 2026.

## 1. Pregled aplikacije

Smrčak interni sistem je centralna platforma za upravljanje izvoznim pošiljkama i AI klasifikaciju emailova kupaca. Aplikacija pokriva sve od pristizanja narudžbe u inbox do otpremljenog paketa dokumenata kupcu i prevozniku. Cilj sistema je da skrati proces od emaila do otpremljenog dokumenta sa 90 minuta na pod 5 minuta.

Sistem koristi šest glavnih modula: Dashboard, Inbox, Pošiljke, Kupci, Kooperanti i Audit/Sledljivost. Pristup je preko web pretraživača; na desktop-u i laptopu sa minimalnom rezolucijom 1280×800. AI funkcionalnosti rade u pozadini i ne zahtijevaju dodatnu interakciju operatora.

## 2. Dashboard

Dashboard je startna stranica nakon prijave. Pokazuje četiri ključne metrike na vrhu (stat cards):

- **Pošiljki ovaj mjesec** — broj pošiljki kreiranih u tekućem mjesecu, sa ukupnim brojem pošiljki u sistemu kao podatak ispod
- **Dokumenata za pregled** — koliko AI-generisanih dokumenata čeka odobrenje operatora plus spoljnih dokumenata koji čekaju upload
- **Pošiljki kasni** — pošiljke u statusu "Reklamacija" ili "Čeka spoljni upload" (zahtijeva pažnju)
- **Top kupac** — kupac sa najvećim brojem pošiljki u sistemu (kontekst za prioritete)

Ispod stat cards je **Nedavne aktivnosti feed** koji hronološki prikazuje zadnjih 10 događaja iz audit logova — npr. "2026/0143 · BioSuisse organic prateći odobren" sa autorom i timestamp-om. Klik na broj pošiljke vodi na njen detail.

Bočna kolona "Brze akcije" sadrži direktne linkove ka Inbox-u (sa brojem nepročitanih), svim pošiljkama, kupcima i kooperantima.

Dugmad u headeru "Nova pošiljka" i "Inbox" su shortcut-i za najčešće radnje.

## 3. Inbox

Inbox je modul za rad sa email komunikacijom kupaca. Prikazuje 30 emailova podijeljenih po kategorijama koje je AI automatski klasifikovao. Šest kategorija je: NARUDZBA (zelena), UPIT (plava), REKLAMACIJA (crvena, hitan prioritet), DOKUMENTACIJA (narandžasta), LOGISTIKA (siva), SPAM (blijeda) i INTERNI (od kooperanata).

Layout je split 60/40 — lijevo lista emailova, desno preview izabranog emaila. Svaki email u listi ima tačku prioriteta (crvena=visok, žuta=srednji, siva=nizak), zastavicu jezika (🇩🇪🇮🇹🇧🇦🇬🇧🇫🇷🇳🇱), pošiljaoca, subject, snippet sadržaja, kategorija chip i vrijeme prijema. Nepročitani emailovi imaju forest-zelenu liniju s lijeve strane.

Filteri po kategoriji su na vrhu liste — klikom se filtrira lista. Iznad filtera je global search bar koji pretražuje brojeve pošiljki, imena kupaca i sadržaj — kucanje "0156" odmah predloži pošiljku 2026/0156.

Preview pane prikazuje pun tekst emaila sa AI sažetkom na vrhu (cream pozadina) — sažetak je generisan u trenutku klasifikacije i pokazuje šta email zahtijeva u jednoj rečenici. Ispod sažetka je originalni tekst, a na dnu su action dugmad koja se mijenjaju u zavisnosti od kategorije:

- **Kreiraj pošiljku iz emaila** — vidljivo samo za NARUDZBA emailove. Klik otvara wizard sa pre-popunjenim podacima izvučenim iz emaila (kupac, proizvod, količina).
- **Otvori pošiljku 2026/0XXX** — vidljivo ako email referencira konkretnu pošiljku (npr. reklamacija ili zahtjev za dokument). Klik vodi direktno na detail te pošiljke.
- **Odgovori AI draft-om** — generiše prijedlog odgovora kupcu na njegovom jeziku.
- **Označi kao obrađen** — sklanja "nepročitan" indikator.

## 4. Pošiljke — lista i detail

Modul Pošiljke ima tabelarni pregled svih 10 mock pošiljki sortiranih po datumu kreiranja (najnovije prve). Svaki red ima broj pošiljke (mono font, link), kupca, datum otpreme, težinu u kg, ukupnu vrijednost u valuti kupca i status chip.

**Status chip-ovi** prate životni ciklus pošiljke:
- **Draft** — siva, kreirano ali nije generisano dokumentaciju
- **Čeka pregled** — žuta, AI generisao dokumente koji čekaju operatora
- **Čeka spoljni upload** — žuta, čeka uploadovanje spoljnih dokumenata (fitosanitarni, komorski)
- **Spremno za otpremu** — plava, sve odobreno, čeka utovar
- **U tranzitu** — plava, paket otpremljen
- **Završeno** — zelena, isporučeno
- **Reklamacija** — crvena, prijavljen problem od kupca

Klik na broj pošiljke vodi na **detail ekran** koji ima šest sekcija od vrha:

1. **Header card** — broj pošiljke (veliki mono font, forest zelena), kupac (link na Customer detail), datum kreiranja i otpreme, status chip
2. **4 stat cards** — Vrijednost (sa valutom), Težina (kg), Lot brojeva (broj LOT-ova u pošiljci), Dokumenata (broj generisanih + spoljnih)
3. **Sadržaj pošiljke** — tabela proizvoda sa LOT brojevima, kooperantima (link na kooperant detail), količinom i vrijednošću
4. **Dokumentacija** — lista svih dokumenata pošiljke sa statusom svakog (klik vodi u Document review)
5. **Audit timeline** — vertikalna timeline aktivnosti za ovu pošiljku (kreirano, generisano, odobreno, poslano, primljeno) sa autorom i timestamp-om
6. **Action bar** — dugmad: "Otvori prvi dokument za pregled", "Eksport audit log", "Pošalji paket dokumenata"

## 5. Wizard za novu pošiljku

Wizard se otvara klikom "Kreiraj pošiljku iz emaila" u Inbox-u (pre-popunjava podatke iz NARUDZBA emaila) ili "Nova pošiljka" iz Dashboard-a/Pošiljke liste (prazan wizard).

Wizard ima **četiri koraka** sa progress indikatorom na vrhu:

**Korak 1 — Kupac.** Search bar za pretragu postojećih kupaca. Klik na kupca pokazuje karticu sa preferred packaging (npr. 5kg vreće), preferred prevoznikom (npr. Cargo Express), brojem prethodnih pošiljki i jezikom komunikacije. Ako je pre-popunjen iz emaila, kupac je već izabran.

**Korak 2 — Proizvodi i lotovi.** Lista proizvoda (Sušeni vrganji klasa A, Sušene lisičarke, itd.) sa input poljem za količinu u kg. Ispod input-a, AI automatski predlaže lot brojeve po **FIFO logici** — najstariji lotovi prvi, da se ne čuva roba duže nego treba. Pored svakog LOT-a stoji ime kooperanta i lokacija. Sumarno na dnu: ukupno kg + ukupno EUR.

**Korak 3 — Transport.** Bira se prevoznik iz dropdown liste (Cargo Express, Balkan Kurir, DHL Freight, Schenker), datum otpreme (date picker, default +7 dana), tekstualno polje za rutu i opcione napomene. Ako je pre-popunjeno iz emaila, prevoznik je već izabran (preferred za tog kupca).

**Korak 4 — Pregled.** Sažetak svih informacija u tri kartice (Kupac, Sadržaj, Transport) plus lista 8 dokumenata koji će se generisati: Komercijalna faktura DE, Packing list DE/EN, CMR, EUR.1, BioSuisse organic prateći, Izvozna deklaracija, Fitosanitarni (spoljni — upload), Komorski certifikat o porijeklu (spoljni — upload).

Klik **"Generiši dokumente"** pokreće 14-sekundnu animaciju u kojoj AI generiše svih 6 internih dokumenata jedan po jedan. Tokom animacije vidi se progress bar, nazivi dokumenata u toku, status (idle → generating → done) i counter "X / 8 dokumenata". Po završetku korisnik se prebacuje na detail novokreirane pošiljke (npr. 2026/0143).

## 6. Document review

Document review ekran se otvara klikom na bilo koji dokument iz liste dokumentacije pošiljke. Layout je **split 50/50**:

**Lijeva strana — PDF preview.** Renderuje stvarni PDF dokument (komercijalna faktura, packing list, CMR, EUR.1, BioSuisse, fitosanitarni, izvozna deklaracija) iz `public/sample-docs/` foldera. Iznad PDF-a je toolbar sa zoom in/out i reset zoom dugmadima. PDF-ovi su generisani Python ReportLab + DejaVu Sans fontovima da podržavaju BCS dijakritike (č š ž đ ć) i njemačke umlaut-e (ä ö ü ß).

**Desna strana — edit forma.** Polja dokumenta (broj fakture, datum, kupac, iznos, količina kg, kooperanti, itd.) prikazana kao input polja:
- **Žuta pozadina** = AI-generisano polje, neprovjereno
- **Zelena pozadina** = polje koje je operator ručno mijenjao = verifikovano

Ispod polja su action dugmad:
- **Regeneriši dokument** — 2-sekundni spinner pa PDF se osvježava (simulira da AI ponovo pravi dokument sa novim podacima)
- **Odbij** — crveno, mijenja status u "Vraćeno"
- **Odobri** — zeleno, mijenja status u "Odobreno"
- **Pošalji kupcu** — vidljivo samo za odobrene dokumente, šalje pojedinačni dokument kupcu uz pred-popunjen email (TOK 1 urgent slučaj)

Za **spoljne dokumente** (fitosanitarni, komorski) PDF preview pokazuje upload placeholder umjesto PDF-a sa dugmetom "Simuliraj upload (drag & drop)".

## 7. Kupci

Modul Kupci ima tabelarni pregled svih 12 kupaca u bazi sortiranih po broju pošiljki (najveći prvi). Klik na ime kupca otvara **Customer detail** sa:

- **Header card** sa kontakt podacima, jezikom komunikacije, valutom, payment terms, preferred packaging i prevoznikom
- **4 stat broja** — Broj pošiljki, Prosječna pošiljka u kg, Pakovanje, Prevoznik
- **Tabovi** sa sadržajem:
  - **Pošiljke** — Recharts bar graf "pošiljki po mjesecu" + tabela svih pošiljki ovog kupca
  - **Dokumenti** — lista svih dokumenata pošiljki ovog kupca
  - **Komunikacija** — lista emailova razmijenjenih sa kupcem (filtrirano iz inbox-a)
  - **Bilješke** — slobodne bilješke (mock prazno)

## 8. Kooperanti i sledljivost (Mapa BiH)

Kooperanti su mreža sakupljača gljiva i šumskih plodova u BiH. Aplikacija prikazuje 8 kooperanata (Karakaj 7, Bratunac 3, Srebrenica 12, Vlasenica 1, Han Pijesak 5, Sokolac 8, Olovo 4, Han Kola 2) sa ime osobe i lokacijom.

Klik na kooperanta otvara detail ekran sa:

- **Header card** sa imenom, lokacijom, koordinatama (lat/lng), datumom validnosti BioSuisse certifikata
- **Mapa BiH** — SVG mapa sa pinovima svih 8 kooperanata. Trenutni kooperant je highlightovan (pulsing forest ring). Pored svakog pina je naziv lokacije.
- **Tabela LOT-ova** ovog kooperanta sa: LOT broj, proizvod, datum otkupa, količina ulaz/ostatak, lista pošiljki u kojima je iskorišten
- **Dugme "Eksport BioSuisse extract"** — generiše ZIP paket za audit auditora

Iz tabele LOT-ova klikom na pošiljku se vraća na pošiljka detail sa highlightovanim LOT-om (URL parametar `?lot=SV-2025-067`).

## 9. Audit eksport

Audit eksport modal otvara se sa dugmeta "Eksport audit log" na pošiljka detail-u ili "Eksport BioSuisse extract" na kooperant detail-u. Modal sadrži:

- **Birač datuma od/do** — definiše period eksporta
- **Birač pošiljki** — "Sve" ili specifičan broj
- **Format** — radio buttoni PDF, ZIP, EXCEL
- **Dugme "Generiši"** — pokreće 4-sekundnu animaciju "Priprema paketa..." pa download-uje fajl u browseru

Ovaj modul je ključan za BioSuisse, IFS Food i druge audite — auditorima daje kompletan trag aktivnosti u jednom paketu.

## 10. Tipični tokovi (use cases)

Aplikacija je dizajnirana oko tri konkretna scenarija:

**TOK 1 — Urgent dokument na carini (~90 sec):** Container kupca je na njemačkoj carini, čeka fitosanitarni certifikat. Operator otvori urgent email u Inbox-u, klikne "Otvori pošiljku 2026/0156", klikne fitosanitarni dokument, klikne "Pošalji kupcu", dobije toast "Email otpremljen — container može krenuti dalje". Bez sistema ovo bi trajalo 30-60 minuta.

**TOK 2 — Nova narudžba end-to-end (~5 min):** Stiže narudžba 500kg vrganja od Bio Naturkost. Operator klikne "Kreiraj pošiljku iz emaila", prođe wizard 4 koraka (sve pre-popunjeno), klikne "Generiši dokumente" (14 sec animacija), pregleda i odobri svaki dokument, simulira upload spoljnih dokumenata, klikne "Pošalji paket dokumenata". Pošiljka prelazi u "U tranzitu". Bez AI ovo bi trajalo 90 minuta.

**TOK 3 — Audit sledljivost (~30 sec):** Auditor traži dokaz porijekla za pošiljku 2025/0089. Operator otvori pošiljku, klikne LOT broj SV-2025-067, sistem vodi na kooperanta Mehmedović Sefer iz Karakaja 7 sa mapom BiH, BioSuisse validnost, datumom otkupa. Klikne "Eksport BioSuisse extract", download paket spreman za auditora.

## 11. AI asistent (chatbot)

U donjem desnom uglu svake stranice je **plutajuće dugme** sa MessageCircle ikonom (forest zelena pozadina). Klik otvara panel 400×600px:

- Header "Smrčak AI asistent" sa close i clear dugmadima
- Empty state sa 4 predložena pitanja kao quick actions ("Koja je MOQ za vrganj sušen klasa A?", "Šta sve ide u dokumentaciji za EU pošiljku?", itd.)
- Input polje za slobodno pitanje
- Slanje pitanja → "Razmišljam..." dot animacija → token-by-token streaming odgovora
- Ispod svakog AI odgovora "Pokaži izvore (N)" toggle koji prikazuje iz kojih dokumenata je odgovor došao (sa score-om relevantnosti)

Asistent radi na bazi **RAG (Retrieval-Augmented Generation)**: pitanje se pretvara u vektor (OpenAI embeddings), pretražuje se Pinecone vektor baza, vraća se top 5 najrelevantnijih chunkova iz dokumenata, šalje se Claude AI modelu zajedno sa pitanjem, Claude generiše odgovor citirajući izvore.

Asistent može odgovoriti na pitanja o:
- **Proizvodima** — šifre, klase, MOQ, vlažnost, sezona berbe
- **Cijenama** — cjenovnik 2026, popusti za količinu, transport doplate, dodatni troškovi
- **Sertifikatima** — BioSuisse Knospe, IFS Food, EUR.1, fitosanitarni, sljedivost
- **Procedurama izvoza** — 10 koraka od upita do isporuke, dokumentacija po pošiljci, hitne pošiljke
- **FAQ kupaca** — uzorci, sezonalnost, posjete pogonu, privatne marke, drop-shipping
- **Korištenju aplikacije** — kako se kreira pošiljka, šta znači koji status, kako funkcioniše audit eksport (ovaj dokument)

Asistent NEĆE odgovoriti na off-topic pitanja (vrijeme, politika, fudbal), neće otkriti tehničke detalje sistema, neće davati pravne/medicinske/HR savjete. Vidi sekciju "Šta sistem ne radi" ispod.

## 12. Šta sistem NE radi (out of scope demo verzije)

Demo verzija aplikacije ima sljedeća ograničenja koja bi se rješavala u production verziji:

- **Bez prave baze podataka** — svi podaci su u JSON fajlovima, gube se restartom
- **Bez prave autentifikacije** — nema login ekrana, svi su admin
- **Bez prave AI integracije** za klasifikaciju emailova — koristi se pre-tagged kategorija; production bi koristio Claude API uživo
- **Bez stvarnog slanja emaila** — Pošalji dugmad simuliraju animacije, ne šalju nikakav email
- **Bez stvarnog generisanja dokumenata** — koriste se pre-pripremljeni PDF-ovi; production bi koristio Python ReportLab + Claude za generisanje teksta na jeziku kupca
- **Bez prave Pinecone integracije za AI asistenta** — RAG asistent koristi pravi Pinecone i Claude API, ali sa mock dokumentima; production bi imao prave dokumente firme
- **Bez mobilne podrške** — interfejs je dizajniran za desktop/laptop; mobile responsive nije optimizovan
- **Bez multi-tenancy** — sistem podržava samo jednu firmu (Smrčak); production bi mogao podržati više MSP-ova kroz NextPixel platformu

Pomenuti production scenariji su dio Phase 2 i Phase 3 razvoja.

## 13. Tehnička arhitektura (high level)

Frontend je Next.js 14 App Router + TypeScript + Tailwind CSS + Zustand state management. Komponente su organizovane po domenu (inbox/, posiljke/, wizard/, dokument/, kooperanti/, kupci/, chatbot/, shared/).

PDF dokumenti su statičke datoteke u `public/sample-docs/` generisane Python skriptom `scripts/generate_pdfs/generate_all.py` (ReportLab + DejaVu Sans). Skripta se pokreće lokalno, output se kopira u public folder.

AI asistent koristi:
- **OpenAI text-embedding-3-small** za pretvaranje pitanja u 1536-dim vektore
- **Pinecone** (rag-msp-smrcak index, AWS us-east-1, serverless) za vektor pretragu
- **Anthropic Claude Haiku 4.5** za generisanje odgovora (jeftina, brza varijanta)
- **Custom SSE protokol** preko `app/api/chat/route.ts` za streaming odgovora

Dokumenti za RAG bazu znanja se nalaze u `data/dokumenti/*.md` (5+ fajlova). Pokretanje `npm run ingest` chunk-uje dokumente, embed-uje ih i upsert-uje u Pinecone (sa SHA256 dedupe za bezbjedan re-run).

System prompt asistenta se nalazi u `data/system_prompt.md` — editabilan bez touch-a koda. Promjena prompta + restart server-a aktivira novu logiku ponašanja.

Sve klijent-side mockirane "AI" akcije (klasifikacija emaila, generisanje 8 dokumenata, regeneracija dokumenta, slanje paketa, audit eksport) su `setTimeout` simulacije u `lib/mockAi.ts` — production bi ove zamijenio pravim API pozivima.
