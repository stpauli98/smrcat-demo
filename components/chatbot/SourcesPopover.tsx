"use client";

import { useState } from "react";
import { ChevronDown, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatSource } from "./types";

export function SourcesPopover({ sources }: { sources: ChatSource[] }) {
  const [open, setOpen] = useState(false);
  if (!sources || sources.length === 0) return null;
  return (
    <div className="mt-2" data-test="sources-popover">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        data-test="sources-toggle"
        aria-expanded={open}
        className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-forest transition-colors"
      >
        <FileText className="w-3 h-3" />
        Pokaži izvore ({sources.length})
        <ChevronDown
          className={cn("w-3 h-3 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <ul
          className="mt-1.5 space-y-1.5 border-l-2 border-border pl-2"
          data-test="sources-list"
        >
          {sources.map((s, i) => (
            <li key={`${s.source}-${s.chunkIndex}-${i}`} data-test="source-item">
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="font-mono font-medium text-forest">
                  {s.source}
                </span>
                <span className="text-muted-foreground">
                  · score {s.score.toFixed(2)}
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground line-clamp-2">
                {s.preview}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
