/**
 * POST /api/chat
 *
 * Streaming RAG endpoint sa custom SSE protokolom:
 *   data: {"type":"sources", "sources":[...]}
 *   data: {"type":"delta", "content":"..."}
 *   data: {"type":"done"}
 *   data: {"type":"error", "message":"..."}
 *
 * Klijent (FloatingChatbot) parsira ove eventove i renderuje odgovor + izvore.
 *
 * Skalabilnost: kad dolaze pravi podaci, samo se mijenjaju MD fajlovi
 * u data/dokumenti/ + pokreće `npm run ingest`. Nema promjena u ovom fajlu.
 */

import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  CHAT_MODEL,
  RagConfigError,
  TEMPERATURE,
  buildContext,
  buildUserMessage,
  embedQuery,
  loadEnv,
  makeClients,
  searchTopK,
  SYSTEM_PROMPT,
  TOP_K,
  type RagSource,
} from "@/lib/rag";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const MAX_USER_INPUT = 4000;
const MAX_HISTORY = 10;

function sseEncoder() {
  const encoder = new TextEncoder();
  return (event: unknown) => encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
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
  let body: { messages?: ChatMessage[] };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser?.content?.trim()) {
    return new Response(
      JSON.stringify({ error: "Last message must be a non-empty user message" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  if (lastUser.content.length > MAX_USER_INPUT) {
    return new Response(
      JSON.stringify({
        error: `Question too long (max ${MAX_USER_INPUT} chars)`,
      }),
      { status: 413, headers: { "Content-Type": "application/json" } },
    );
  }

  const encode = sseEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: unknown) => controller.enqueue(encode(event));
      const close = () => controller.close();

      try {
        const env = loadEnv();
        const { openai, index } = makeClients(env);
        const anthropic = new Anthropic({ apiKey: env.anthropicKey });

        // 1. Embed pitanja
        const queryVector = await embedQuery(openai, lastUser.content);

        // 2. Pinecone top-K search
        const sources: RagSource[] = await searchTopK(index, queryVector, TOP_K);

        // 3. Pošalji izvore odmah (prije Claude streama)
        send({
          type: "sources",
          sources: sources.map((s) => ({
            source: s.source,
            score: Number(s.score.toFixed(3)),
            chunkIndex: s.chunkIndex,
            preview: s.text.slice(0, 220),
          })),
        });

        // 4. Build kontekst i Claude poziv
        const context = buildContext(sources);
        const history = messages
          .slice(-MAX_HISTORY - 1, -1)
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role, content: m.content }));

        const userMessage = buildUserMessage(lastUser.content, context);
        const claudeStream = anthropic.messages.stream({
          model: CHAT_MODEL,
          max_tokens: 1024,
          temperature: TEMPERATURE,
          system: SYSTEM_PROMPT,
          messages: [
            ...history,
            { role: "user", content: userMessage },
          ],
        });

        for await (const event of claudeStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            send({ type: "delta", content: event.delta.text });
          }
        }

        send({ type: "done" });
        close();
      } catch (err) {
        const message =
          err instanceof RagConfigError
            ? `RAG nije konfigurisan: ${err.missing.join(", ")}. Dodaj ih u .env.local i pokreni "npm run ingest".`
            : err instanceof Error
              ? err.message
              : "Nepoznata greška";
        try {
          send({ type: "error", message });
        } catch {
          // controller may already be closed
        }
        close();
      }
    },
  });

  return new Response(stream, { headers: sseHeaders() });
}
