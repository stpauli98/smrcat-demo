"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "./types";

const STORAGE_KEY = "smrcak-chatbot-history";
const TTL_DAYS = 7;
const TTL_MS = TTL_DAYS * 24 * 60 * 60 * 1000;

interface StoredHistory {
  messages: ChatMessage[];
  savedAt: number;
}

export function loadStoredHistory(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredHistory;
    if (!parsed.savedAt || Date.now() - parsed.savedAt > TTL_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return [];
    }
    return (parsed.messages ?? []).filter((m) => !m.pending);
  } catch {
    return [];
  }
}

export function saveHistory(messages: ChatMessage[]) {
  if (typeof window === "undefined") return;
  try {
    const persisted = messages
      .filter((m) => !m.pending && !m.error)
      .map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        sources: m.sources,
        toolCalls: m.toolCalls?.filter((tc) => tc.status === "done"),
      }));
    if (persisted.length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    const payload: StoredHistory = {
      messages: persisted,
      savedAt: Date.now(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore quota errors / serialization issues
  }
}

export function clearHistory() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function usePersistedMessages(): [
  ChatMessage[],
  React.Dispatch<React.SetStateAction<ChatMessage[]>>,
] {
  const [messages, setMessages] = useState<ChatMessage[]>(loadStoredHistory);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    saveHistory(messages);
  }, [messages]);

  return [messages, setMessages];
}
