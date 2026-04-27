"use client";

import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { Sparkles, User, AlertCircle } from "lucide-react";
import { SourcesPopover } from "./SourcesPopover";
import type { ChatMessage } from "./types";

const MARKDOWN_COMPONENTS = {
  // Naslovi unutar bubble — sažetiji nego standardni h1/h2
  h1: ({ children }: { children?: React.ReactNode }) => (
    <div className="font-serif font-semibold text-[15px] mb-1.5 first:mt-0 mt-2">{children}</div>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <div className="font-serif font-semibold text-[14px] mb-1 first:mt-0 mt-1.5">{children}</div>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <div className="font-medium mb-0.5 first:mt-0 mt-1">{children}</div>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc pl-5 space-y-0.5 mb-1.5 last:mb-0">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal pl-5 space-y-0.5 mb-1.5 last:mb-0">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="italic">{children}</em>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="bg-card px-1 py-0.5 rounded text-[12px] font-mono border border-border">
      {children}
    </code>
  ),
  hr: () => <hr className="my-2 border-border" />,
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-forest underline underline-offset-2 hover:text-earth"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-2 border-forest/50 pl-2 my-1 text-foreground/80">
      {children}
    </blockquote>
  ),
};

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
        ) : message.pending && !message.content ? (
          <div data-test="thinking-indicator" className="flex items-center gap-2 py-0.5">
            <div className="thinking-dots flex gap-1" aria-hidden>
              <span className="w-1.5 h-1.5 rounded-full bg-forest" />
              <span className="w-1.5 h-1.5 rounded-full bg-forest" />
              <span className="w-1.5 h-1.5 rounded-full bg-forest" />
            </div>
            <span className="text-xs text-muted-foreground italic">Razmišljam...</span>
          </div>
        ) : (
          <>
            <div className="text-sm" data-test="message-content">
              {isUser ? (
                <span className="whitespace-pre-wrap leading-relaxed">{message.content}</span>
              ) : (
                <ReactMarkdown components={MARKDOWN_COMPONENTS}>
                  {message.content}
                </ReactMarkdown>
              )}
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
