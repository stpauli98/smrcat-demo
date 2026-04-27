"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { ChatPanel } from "./ChatPanel";
import { cn } from "@/lib/utils";

export function FloatingChatbot() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        data-test="floating-chatbot-toggle"
        data-open={open ? "true" : "false"}
        aria-label={open ? "Zatvori chat" : "Otvori AI asistent"}
        aria-expanded={open}
        className={cn(
          "fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95",
          open ? "bg-card text-forest border-2 border-forest" : "bg-forest text-primary-foreground",
        )}
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
      </button>
      {open && <ChatPanel onClose={() => setOpen(false)} />}
    </>
  );
}
