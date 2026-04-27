/**
 * INGEST SKRIPTA — Smrčak RAG
 *
 * Čita dokumente iz data/dokumenti/, dijeli na chunkove, batch-embed-uje
 * preko OpenAI-a, upsert-uje u Pinecone s deterministic ID-evima (SHA256).
 *
 * Pokretanje (iz root-a smrcak-demo projekta):
 *   npm run ingest
 *
 * Re-runs su sigurni — dedupe po SHA256 hash-u sadržaja. Ako se MD fajl ne
 * mijenja, isti chunk dobija isti ID i Pinecone ga samo "potvrđuje" (no-op).
 *
 * Skalabilnost: zamijeniti MD fajlove u data/dokumenti/ pravim podacima i
 * pokrenuti ovu skriptu ponovo. Schema pinecone metadata-e je ista (text,
 * source, chunkIndex), ne treba mijenjati ostatak aplikacije.
 */

import { config } from "dotenv";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

config({ path: ".env.local" });

const REQUIRED_ENV = ["OPENAI_API_KEY", "PINECONE_API_KEY", "PINECONE_INDEX"];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`❌ Nedostaje env varijabla: ${key}`);
    console.error(
      `   Dodaj je u .env.local (vidi .env.example za primjer)`,
    );
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
const OPENAI_BATCH_SIZE = 50;

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: CHUNK_SIZE,
  chunkOverlap: CHUNK_OVERLAP,
  separators: ["\n\n", "\n", ". ", ", ", " ", ""],
});

interface Chunk {
  id: string;
  text: string;
  source: string;
  chunkIndex: number;
}

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
  const all: number[][] = [];
  for (let i = 0; i < texts.length; i += OPENAI_BATCH_SIZE) {
    const slice = texts.slice(i, i + OPENAI_BATCH_SIZE);
    const response = await openai.embeddings.create({
      model: EMBED_MODEL,
      input: slice,
    });
    for (const d of response.data) all.push(d.embedding);
    if (texts.length > OPENAI_BATCH_SIZE) {
      console.log(`     embed batch ${all.length}/${texts.length}`);
    }
  }
  return all;
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
  console.log(
    `   ✓ ${embeddings.length} vektora za ${((Date.now() - t0) / 1000).toFixed(1)}s`,
  );

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
    await index.upsert({ records: batch });
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
