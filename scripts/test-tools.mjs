#!/usr/bin/env tsx
/**
 * Smoke test za lib/agent/tools.ts.
 * Pokreće 5 alata koji ne traže Pinecone/OpenAI/Anthropic API ključeve
 * (pretrazi_dokumente preskačemo jer traži API ključeve).
 *
 * Run: npx tsx scripts/test-tools.mjs
 */
const toolsModule = await import("../lib/agent/tools.ts");
const {
  provjeriLotZalihe,
  nadjiKupca,
  nadjiPosiljku,
  izracunajDostavu,
  listaKooperanata,
} = toolsModule;

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
  const r = await provjeriLotZalihe({
    proizvod: "Sušeni vrganji klasa A",
    trazena_kolicina_kg: 400,
  });
  check("uspjeh", r.uspjeh === true);
  check("broj_lotova > 0", r.broj_lotova > 0);
  check("fifo_predlog je array", Array.isArray(r.fifo_predlog));
  check(
    "fifo_dostupno za 400kg (sa raspoloživih ~440kg)",
    r.fifo_dostupno === true,
    JSON.stringify({
      fifo_dostupno: r.fifo_dostupno,
      ukupno: r.ukupno_dostupno_kg,
    }),
  );
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
