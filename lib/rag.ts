/**
 * RAG core helpers — embed query, Pinecone search, context builder, system prompt.
 *
 * Skalabilnost: ova logika je nezavisna od konkretnog sadržaja u Pinecone-u.
 * Promjena MD fajlova u data/dokumenti/ + re-run npm run ingest = sve radi.
 *
 * Ne uvozi se u client komponente — samo iz app/api/chat/route.ts (server-side).
 */

import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";

export const EMBED_MODEL = "text-embedding-3-small";
export const CHAT_MODEL = "claude-sonnet-4-5";
export const TOP_K = 5;

export interface RagSource {
  source: string;
  score: number;
  chunkIndex: number;
  text: string;
}

export interface RagEnv {
  openaiKey: string;
  pineconeKey: string;
  pineconeIndex: string;
  anthropicKey: string;
}

export class RagConfigError extends Error {
  readonly missing: string[];
  constructor(missing: string[]) {
    super(`Nedostaju RAG env varijable: ${missing.join(", ")}`);
    this.name = "RagConfigError";
    this.missing = missing;
  }
}

export function loadEnv(): RagEnv {
  const missing: string[] = [];
  const get = (key: string) => {
    const v = process.env[key];
    if (!v) missing.push(key);
    return v ?? "";
  };
  const env: RagEnv = {
    openaiKey: get("OPENAI_API_KEY"),
    pineconeKey: get("PINECONE_API_KEY"),
    pineconeIndex: get("PINECONE_INDEX"),
    anthropicKey: get("ANTHROPIC_API_KEY"),
  };
  if (missing.length > 0) throw new RagConfigError(missing);
  return env;
}

export function makeClients(env: RagEnv) {
  const openai = new OpenAI({ apiKey: env.openaiKey });
  const pc = new Pinecone({ apiKey: env.pineconeKey });
  const index = pc.index(env.pineconeIndex);
  return { openai, index };
}

export async function embedQuery(
  openai: OpenAI,
  text: string,
): Promise<number[]> {
  const r = await openai.embeddings.create({
    model: EMBED_MODEL,
    input: text,
  });
  return r.data[0].embedding;
}

export async function searchTopK(
  index: ReturnType<Pinecone["index"]>,
  vector: number[],
  topK = TOP_K,
): Promise<RagSource[]> {
  const result = await index.query({
    vector,
    topK,
    includeMetadata: true,
  });
  return (result.matches ?? [])
    .filter((m) => m.metadata)
    .map((m) => ({
      source: String(m.metadata?.source ?? ""),
      score: m.score ?? 0,
      chunkIndex: Number(m.metadata?.chunkIndex ?? 0),
      text: String(m.metadata?.text ?? ""),
    }));
}

export function buildContext(sources: RagSource[]): string {
  if (sources.length === 0) return "";
  return sources
    .map(
      (s, i) =>
        `[Izvor ${i + 1}: ${s.source} (chunk ${s.chunkIndex})]\n${s.text}`,
    )
    .join("\n\n---\n\n");
}

export const SYSTEM_PROMPT = `Ti si AI asistent firme Smrčak d.o.o. iz Zvornika.
Smrčak izvozi šumske gljive (vrganji, lisičarke, smrčci, bukovače) i šumske
plodove (borovnice, maline) u EU — glavni kupci Njemačka, Italija, Austrija,
Francuska, Švajcarska. BioSuisse organic certifikovani.

Tvoja uloga je da pomažeš zaposlenicima Smrčaka da brzo odgovore na pitanja
o proizvodima, cijenama, sertifikatima i procedurama izvoza.

PRAVILA:
1. Odgovaraj SAMO iz priloženog konteksta (KONTEKST sekcija).
2. Ako informacija nije u kontekstu, reci: "Nemam tu informaciju u trenutnoj
   bazi znanja. Kontaktirajte prodaja@smrcak.com."
3. NIKAD ne izmišljaj cijene, MOQ, rokove, šifre proizvoda, sertifikate.
4. Uvijek navedi izvor (naziv .md fajla iz konteksta) na kraju odgovora.
5. Sezonalnost je VAŽNA — svježi proizvodi nisu uvijek dostupni:
   - Smrčci: april–maj
   - Lisičarke: jun–septembar
   - Vrganji: jul–oktobar
   - Šumski plodovi: ljeto
6. Cijene su uvijek u EUR (FCA Zvornik default) osim ako nije drugačije naznačeno.
7. Kratko, profesionalno, BCS jezik (osim ako kupac piše na drugom jeziku).
8. Ako kupac piše na DE/IT/EN/FR — odgovori na njegovom jeziku ALI držeći se
   konteksta iz dokumenata (tehnički podaci ostaju isti).`;

export function buildUserMessage(question: string, context: string): string {
  if (!context) {
    return `KONTEKST: (prazan — nema relevantnih informacija u bazi znanja)\n\nPITANJE: ${question}`;
  }
  return `KONTEKST:\n\n${context}\n\nPITANJE: ${question}`;
}
