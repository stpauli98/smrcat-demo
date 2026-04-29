/**
 * POST /api/chat
 *
 * Streaming Agent endpoint sa custom SSE protokolom:
 *   data: {"type":"tool_call_start", "id":"...", "name":"...", "input":{...}}
 *   data: {"type":"tool_call_end", "id":"...", "name":"...", "result":{...}, "durationMs":N}
 *   data: {"type":"tool_call_error", "id":"...", "name":"...", "error":"..."}
 *   data: {"type":"sources", "sources":[...]}        (extracted iz pretrazi_dokumente toolCall-a)
 *   data: {"type":"delta", "content":"..."}
 *   data: {"type":"done"}
 *   data: {"type":"error", "message":"..."}
 *
 * Klijent (FloatingChatbot) parsira ove eventove i renderuje:
 * - tool indikatore (Faza 12)
 * - sources popover ispod AI poruke
 * - finalni tekst odgovora
 *
 * Per-mode allowedTools:
 * - "operativni" / "all" — svi alati dostupni
 * - "biznis" / "app" — samo pretrazi_dokumente (RAG-only fallback)
 */

import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { runAgent } from "@/lib/agent/runner";
import type { SseEvent, SourceEvent } from "@/lib/agent/types";
import { RagConfigError, SYSTEM_PROMPT, loadEnv, type ChatScope } from "@/lib/rag";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const VALID_SCOPES: ChatScope[] = ["biznis", "app", "operativni", "all"];
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

        // History za Claude (max 10 ranijih poruka)
        const history: MessageParam[] = messages
          .slice(-MAX_HISTORY - 1)
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role, content: m.content }));

        // Prosljedi scope kao hint zadnjeg pitanja (agent može pozvati pretrazi_dokumente sa scope)
        const lastMessage = history[history.length - 1];
        if (lastMessage && lastMessage.role === "user") {
          const original = typeof lastMessage.content === "string" ? lastMessage.content : "";
          lastMessage.content = `[Mode: ${scope}] ${original}`;
        }

        // Per-mode allowedTools
        // operativni i all — svi alati; biznis i app — samo pretrazi_dokumente (RAG-only)
        const allowedTools =
          scope === "biznis" || scope === "app" ? ["pretrazi_dokumente"] : undefined;

        const result = await runAgent({
          anthropic,
          systemPrompt: SYSTEM_PROMPT,
          history,
          emit: send,
          allowedTools,
        });

        // Izvuci sources iz pretrazi_dokumente tool call-ova i pošalji UI-u
        const ragCalls = result.toolCalls.filter((tc) => tc.name === "pretrazi_dokumente");
        if (ragCalls.length > 0) {
          const allSources: SourceEvent[] = ragCalls.flatMap((tc) => {
            const r = tc.result as {
              uspjeh?: boolean;
              izvori?: Array<{
                source: string;
                score: number;
                chunk_index: number;
                text: string;
              }>;
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
