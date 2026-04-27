"use client";

import { cn } from "@/lib/utils";
import { Sparkles, User, AlertCircle } from "lucide-react";
import { SourcesPopover } from "./SourcesPopover";
import type { ChatMessage } from "./types";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div
      data-test="chat-message"
      data-role={message.role}
      data-pending={message.pending ? "true" : "false"}
      className={cn("flex gap-2.5 animate-in fade-in slide-in-from-bottom-1", isUser && "flex-row-reverse")}
    >
      <div
        className={cn(
          "shrink-0 w-7 h-7 rounded-full flex items-center justify-center",
          isUser ? "bg-cream text-foreground" : "bg-forest text-primary-foreground",
        )}
      >
        {isUser ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
      </div>
      <div
        className={cn(
          "rounded-lg px-3 py-2 max-w-[85%] text-sm",
          isUser ? "bg-forest text-primary-foreground" : "bg-cream text-foreground",
          message.error && "border border-danger/40 bg-danger/5",
        )}
      >
        {message.error ? (
          <div className="flex items-start gap-1.5 text-danger" data-test="message-error">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{message.error}</span>
          </div>
        ) : (
          <>
            <div className="whitespace-pre-wrap leading-relaxed" data-test="message-content">
              {message.content}
              {message.pending && (
                <span
                  aria-hidden
                  data-test="streaming-cursor"
                  className="inline-block w-1.5 h-3.5 ml-0.5 bg-forest/60 animate-pulse align-middle"
                />
              )}
            </div>
            {!isUser && message.sources && message.sources.length > 0 && (
              <SourcesPopover sources={message.sources} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
