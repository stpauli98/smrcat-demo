"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessageBubble } from "./MessageBubble";
import { useChatStream } from "./useChatStream";
import { cn } from "@/lib/utils";

type ModeId = "biznis" | "app" | "operativni";

interface ModeDef {
  id: ModeId;
  label: string;
  welcome: string;
  questions: string[];
}

const MODES: ModeDef[] = [
  {
    id: "biznis",
    label: "Interno znanje",
    welcome:
      "Pitajte me o proizvodima, cijenama, sertifikatima ili procedurama izvoza.",
    questions: [
      "Koja je MOQ za vrganj sušen klasa A?",
      "Šta sve ide u dokumentaciji za EU pošiljku?",
      "Koliko košta DAP do Münchena za 200kg?",
      "Šta razlikuje Smrčak od konkurencije?",
    ],
  },
  {
    id: "app",
    label: "Aplikacija",
    welcome: "Pitajte me kako se koristi sistem — ekrani, statusi, tokovi.",
    questions: [
      "Kako kreiram novu pošiljku iz emaila?",
      "Šta znači status Čeka pregled?",
      "Kako da odobrim ili odbijem dokument?",
      "Kako pratim sledljivost lota do kooperanta?",
    ],
  },
  {
    id: "operativni",
    label: "Operativni",
    welcome:
      "Operativni mode — koristim alate da provjerim zalihe, lookup-ujem kupce, računam dostavu.",
    questions: [
      "Imamo li 500kg vrganja sušenih klase A na zalihi?",
      "Bio Naturkost traži 200kg lisičarki — koliko će koštati DAP do Münchena?",
      "Daj mi detalje pošiljke 2026/0143.",
      "Koji kooperanti imaju validan BioSuisse certifikat 2027+?",
    ],
  },
];

interface Props {
  onClose: () => void;
}

export function ChatPanel({ onClose }: Props) {
  const { messages, streaming, send, clear } = useChatStream();
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<ModeId>("biznis");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || streaming) return;
    const text = input.trim();
    setInput("");
    void send(text, mode);
  };

  return (
    <div
      data-test="chat-panel"
      role="dialog"
      aria-modal="false"
      aria-label="Smrčak AI asistent"
      className="fixed bottom-24 right-6 z-50 w-[400px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-8rem)] bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4"
    >
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-forest text-primary-foreground">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <h2 className="text-sm font-serif font-semibold">Smrčak AI asistent</h2>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clear}
              data-test="chat-clear"
              aria-label="Obriši razgovor"
              className="p-1.5 rounded hover:bg-white/10 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            data-test="chat-close"
            aria-label="Zatvori"
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div
        ref={scrollRef}
        data-test="chat-messages"
        role="log"
        aria-live="polite"
        aria-atomic="false"
        className="flex-1 overflow-auto px-4 py-3 space-y-3 bg-background"
      >
        {messages.length === 0 ? (
          <div data-test="chat-empty-state" className="space-y-3">
            <p
              data-test="welcome-message"
              className="text-sm text-muted-foreground"
            >
              {MODES.find((m) => m.id === mode)?.welcome}
            </p>

            <div
              role="tablist"
              aria-label="Mode razgovora"
              data-test="mode-toggle"
              className="flex gap-1 p-1 bg-cream rounded-lg"
            >
              {MODES.map((m) => (
                <button
                  key={m.id}
                  role="tab"
                  type="button"
                  onClick={() => setMode(m.id)}
                  data-test={`mode-${m.id}`}
                  data-active={mode === m.id ? "true" : "false"}
                  aria-selected={mode === m.id}
                  className={cn(
                    "flex-1 py-1.5 px-2 rounded-md text-[11px] font-medium transition-colors",
                    mode === m.id
                      ? "bg-card text-forest shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-medium text-muted-foreground uppercase">
                Predložena pitanja
              </p>
              {(MODES.find((m) => m.id === mode)?.questions ?? []).map((q) => (
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
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        data-test="chat-form"
        className="border-t border-border bg-card p-3 flex items-center gap-2"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={streaming ? "AI odgovara..." : "Postavite pitanje..."}
          disabled={streaming}
          maxLength={4000}
          data-test="chat-input"
          className={cn(
            "flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg",
            "focus:outline-none focus:ring-2 focus:ring-forest/40 disabled:opacity-50",
          )}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || streaming}
          data-test="chat-send"
          aria-label="Pošalji"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
