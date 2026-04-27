# Procedure izvoza — Smrčak d.o.o.

> Operativni proces od upita do isporuke. Verzija 2026-Q2.

## Uvod

Ovaj dokument opisuje 10-koračni proces za sve EU pošiljke Smrčaka. Procedura važi za standardne narudžbe (>25 kg, postojeći ili novi kupci). Za hitne pošiljke (urgentni fitosanitarni, container na carini i sl.) vidjeti sekciju 11.

## 1. Korak 1 — Upit kupca

- **Kanal:** email na `prodaja@smrcak.com`, web forma na `smrcak.com/kontakt`, telefon
- **Vrijeme odgovora:** 24 radna sata
- **Šta dobijemo:** ime firme, kontakt osoba, željeni proizvod (po šifri ako poznaje), količina, destinacija, ciljani datum isporuke, kontakt podaci za fakturisanje

Ako upit dolazi sa generičnih platformi (Alibaba, Tradekey), tretiramo ga sa istim prioritetom ali tražimo dodatnu provjeru kupca prije slanja ponude.

## 2. Korak 2 — Ponuda

- **Vrijeme izrade:** 1-2 radna dana nakon upita
- **Validnost:** 14 dana od datuma izrade
- **Sadržaj:**
  - Šifra i opis proizvoda
  - Količina i jedinična cijena (FCA Zvornik)
  - DAP doplata ako kupac traži door-to-door
  - Procijenjeno tranzitno vrijeme
  - Procijenjeni datum spremnosti pošiljke (priprema)
  - Uslovi plaćanja (50/50 novi, 30/70 NET 30 postojeći, NET 45/60 strateški)
  - Lista dokumentacije koja prati pošiljku
- **Format:** PDF na jeziku kupca + email

## 3. Korak 3 — Potvrda narudžbe + Pro Forma faktura

- Kupac potvrđuje email-om ili pisanom narudžbom (PO)
- Mi izdajemo Pro Forma fakturu sa:
  - Konačnom cijenom (potencijalno sa popustom za količinu)
  - Bankovnim podacima za avans
  - Rokom plaćanja avansa
- Pro Forma faktura ima broj iz našeg sistema (npr. PRO-2026-0143) koji se kasnije mapira na komercijalnu fakturu

## 4. Korak 4 — Predujam (avans)

- **Iznos:** 50% (novi kupci) ili 30% (postojeći)
- **Način:** T/T bankovni transfer
- **Vrijeme realizacije:** 1-3 radna dana
- **Banka:** UniCredit Bank Sarajevo (default), na zahtjev Raiffeisen ili Sparkasse Bank
- Po prijemu avansa, narudžba se aktivira u našem sistemu — kreira se "pošiljka" zapis sa LOT rezervacijama

## 5. Korak 5 — Priprema pošiljke

Trajanje ovisi o stanju lagera i specifičnim zahtjevima:

- **Standardna lager priprema:** 3-5 radnih dana (proizvod već u skladištu, samo pakovanje + kontrola)
- **Standardna nova proizvodnja:** 7-14 radnih dana (sušenje, IQF, pakovanje, kontrola)
- **Sezonska narudžba (svježi, smrčci):** rok ovisi o sezoni; rezervacija unaprijed obavezna

### Aktivnosti u koraku 5:
- Kompletiranje LOT-ova prema FIFO logici (najstariji proizvodi prvi)
- Quality Assurance pregled svake LOT pred pakovanje
- Custom etikete (ako su naručene)
- Privatna marka (ako je naručena)
- Termo-pakovanje za svježe i IQF
- Foto-dokumentacija pri pakovanju

## 6. Korak 6 — Dokumentacija

**Vrijeme izrade:** 2 radna dana prije planirane otpreme.

Generišu se sljedeći dokumenti:

| # | Dokument | Jezik | Izdaje | Trošak |
|---|----------|-------|--------|--------|
| 1 | Komercijalna faktura | Jezik kupca | Smrčak | uključeno |
| 2 | Packing list | DE/EN dvojezično | Smrčak | uključeno |
| 3 | CMR / AWB | EN | Prevoznik | uključeno (transport) |
| 4 | Fitosanitarni certifikat | EN | Uprava BiH za zaštitu zdravlja bilja | 25 EUR |
| 5 | EUR.1 certifikat | EN | Vanjskotrgovinska komora BiH | 15 EUR |
| 6 | BioSuisse prateći | DE+EN | Smrčak (BioSuisse partner) | uključeno |
| 7 | Komorski certifikat porijekla | EN | Vanjskotrgovinska komora BiH | 35 EUR (po potrebi) |
| 8 | Mikrobiološki test | EN | Inspecto BiH | 85 EUR (po potrebi) |

Dokumenti se digitalno potpisuju (BiH e-potpis) i šalju mailom kupcu + prevozniku, fizičke kopije idu sa pošiljkom.

## 7. Korak 7 — Utovar i otprema

- **Lokacija:** Smrčak pogon, Karakaj 54a, 75400 Zvornik
- **Radno vrijeme za utovar:** ponedjeljak-petak 08:00-15:00 CET
- **Subota:** po dogovoru, dodatak 50 EUR za vanrednu otpremu
- **Foto pri utovaru:** standardno 4-6 fotografija (palete, dokumenti, plomba kontejnera, registracija vozila)

Plomba kontejnera/kamiona se postavlja u prisustvu Smrčak operatora i broj plombe se zapisuje na CMR-u.

## 8. Korak 8 — Carinjenje na izlazu BiH

- **Lokacija:** Carinarnica Zvornik (najbliža)
- **Vrijeme:** 4-8 radnih sati (rijetko duže)
- **Dokumenti:** sve od Koraka 6 + JCI (Jedinstvena Carinska Isprava)
- Carinjenje organizuje špediter, mi pratimo sa sistema (SMS notifikacije za bitne događaje)

Granični prelazi za izlaz iz BiH: Šepak (najčešći za EU), Bosanski Šamac, Orašje. Ovisi o destinaciji i prevozniku.

## 9. Korak 9 — Tranzit

Tranzitno vrijeme od izlaska iz BiH do ulaska u zemlju kupca (ne računajući domaći distribution u zemlji kupca):

| Destinacija | Tranzit | Napomene |
|-------------|---------|----------|
| München, DE | 36-48h | Šepak → Subotica → Mađarska → Austrija → München |
| Berlin, DE | 42-54h | Sjevernija ruta preko Slovenije ili sjeverne Njemačke |
| Milano, IT | 28-36h | Šepak → Slovenija → Italija (najbrža ruta) |
| Bologna, IT | 32-40h | |
| Beč, AT | 24-32h | Najbliža destinacija |
| Pariz, FR | 48-60h | Duga ruta, eventualne pauze za vozača |
| Zürich, CH | 32-44h | Granica CH dodaje 4-6h |
| Amsterdam, NL | 40-52h | Preko Njemačke |

Hladni lanac (za svježe i IQF) se monitoruje data-loggerom u kontejneru. Ako se temperaturni opseg prekorači (npr. svježe iznad +6°C ili IQF iznad -15°C), prevoznik snosi troškove.

## 10. Korak 10 — Doplata 70%

- **Kada:** po prijemu pošiljke kod kupca, ili u definisanom NET roku (30/45/60 dana)
- **Trigger:** za novi kupci 50/50, doplata 50% prije utovara (ne nakon prijema)
- **Otvaranje narudžbe za sljedeću:** moguće tek nakon isplate prethodne (osim za strateške kupce sa NET 45/60)

## 11. Hitne pošiljke / urgent procedure

Ako kupac ima container na carini koji čeka dokument (čest slučaj — fitosanitarni), procedura:

1. **Email od kupca** sa "URGENT" u subject-u i brojem pošiljke
2. **Naš operator** otvara pošiljku u sistemu i identifikuje koji dokument treba
3. **Generiše dokument** (ako je AI-generisan) ili **šalje skenirani original** (ako je to spoljni dokument poput fitosanitarnog)
4. **Email kupcu sa dokumentom u prilogu** — pred-popunjen tekst na njemačkom/jeziku kupca: "Šaljemo traženi dokument za pošiljku 2026/0156. Container može krenuti dalje."
5. **Vrijeme cilja:** **pod 90 sekundi** od email-a do otpremljenog dokumenta. Ovo je glavni demo "wow moment" — sa AI sistemom je trenutno, ručno bi trajalo 30-60 minuta.

## 12. Posebni zahtjevi po zemljama

### 12.1 Njemačka (DE)
- Stroga fitosanitarna kontrola (njemački fito službenici sami pretresu kontejner)
- Etikete obavezno na njemačkom jeziku
- BioSuisse-Knospe etiketa preferirana (jača od EU-Bio)

### 12.2 Italija (IT)
- Italijanski prevod etikete obavezan
- AGGIES (Agenzia delle Dogane) carinske kontrole sporadične
- Plaćanje: italijanski kupci često traže NET 60 (specijalna procedura)

### 12.3 Austrija (AT)
- AGES (Agentur für Gesundheit und Ernährungssicherheit) može tražiti dodatne mikrobiološke testove
- Bio etiketa po EU-Eco propisima

### 12.4 Francuska (FR)
- Ecocert dodatno preferiran (uz BioSuisse)
- Etikete na francuskom obavezne za maloprodajno pakovanje
- Duže tranzitno vrijeme — preporučujemo +1 dan rezervu

### 12.5 Švajcarska (CH)
- Posebne kvote za bio gljive (provjeriti TARES — Tarifna pretraga)
- BioSuisse Knospe dovoljan, ne treba dodatne sertifikacije
- Plaćanje u CHF moguće (na zahtjev)

## 13. Praćenje i komunikacija

Tokom cijele procedure operator + kupac komuniciraju kroz:
- Email (svaki bitan korak — potvrda avansa, datum otpreme, fotografije utovara, broj plombe, broj CMR-a, tranzit update, prijem)
- WhatsApp ili Telegram (samo za hitnu komunikaciju, ne kao primarni kanal)
- Smrčak portal (planiran, dolazi sa novom AI aplikacijom — kupac će moći da prati pošiljku u realnom vremenu)

## 14. Audit trail za BioSuisse i druge sertifikate

Svaka aktivnost u koracima 5-7 se zapisuje u sistemu sa:
- Vremenskom oznakom (timestamp)
- Operaterom koji je izvršio aktivnost
- LOT brojevima koji su uključeni
- Foto/skeniranim dokumentom kao prilogom

Ovaj trail se može eksportovati za bilo koji audit (BioSuisse godišnji, IFS Food, mikrobiološki, GLOBAL G.A.P.) — vidjeti `lib/mockAi.ts:simulateAuditExport` u demo aplikaciji za primjer kako se ovo pokazuje u UI-u.
