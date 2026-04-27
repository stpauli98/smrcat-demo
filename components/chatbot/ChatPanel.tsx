"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessageBubble } from "./MessageBubble";
import { useChatStream } from "./useChatStream";
import { cn } from "@/lib/utils";

const QUICK_QUESTIONS = [
  "Koja je MOQ za vrganj sušen klasa A?",
  "Šta sve ide u dokumentaciji za EU pošiljku?",
  "Koliko košta DAP do Münchena za 200kg?",
  "Šta razlikuje Smrčak od konkurencije?",
];

interface Props {
  onClose: () => void;
}

export function ChatPanel({ onClose }: Props) {
  const { messages, streaming, send, clear } = useChatStream();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
    void send(text);
  };

  return (
    <div
      data-test="chat-panel"
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
        className="flex-1 overflow-auto px-4 py-3 space-y-3 bg-background"
      >
        {messages.length === 0 ? (
          <div data-test="chat-empty-state" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Pitajte me o proizvodima, cijenama, sertifikatima ili procedurama
              izvoza. Odgovaram iz baze znanja Smrčaka.
            </p>
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium text-muted-foreground uppercase">
                Predložena pitanja
              </p>
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => void send(q)}
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
