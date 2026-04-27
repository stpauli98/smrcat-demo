"use client";

import { useCallback, useRef, useState } from "react";
import type { ChatMessage, ChatSource } from "./types";

export type ChatScope = "biznis" | "app" | "all";

interface ServerEvent {
  type: "sources" | "delta" | "done" | "error";
  sources?: ChatSource[];
  content?: string;
  message?: string;
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

export function useChatStream(endpoint = "/api/chat") {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (text: string, scope: ChatScope = "all") => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;

      const userMsg: ChatMessage = {
        id: genId(),
        role: "user",
        content: trimmed,
      };
      const assistantId = genId();
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        pending: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const history = [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }));
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history, scope }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          const errText = await res.text().catch(() => "Network error");
          throw new Error(errText || `HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const updateAssistant = (patch: Partial<ChatMessage>) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, ...patch } : m)),
          );
        };

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";
          for (const block of events) {
            const dataLine = block.split("\n").find((l) => l.startsWith("data:"));
            if (!dataLine) continue;
            const json = dataLine.slice(5).trim();
            if (!json) continue;
            let event: ServerEvent;
            try {
              event = JSON.parse(json);
            } catch {
              continue;
            }
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
            } else if (event.type === "error") {
              updateAssistant({
                error: event.message ?? "Greška",
                pending: false,
              });
            } else if (event.type === "done") {
              updateAssistant({ pending: false });
            }
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Network error";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, error: msg, pending: false }
              : m,
          ),
        );
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [endpoint, messages, streaming],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clear = useCallback(() => {
    if (streaming) abortRef.current?.abort();
    setMessages([]);
  }, [streaming]);

  return { messages, streaming, send, stop, clear };
}
