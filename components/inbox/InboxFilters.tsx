"use client";

import { cn } from "@/lib/utils";
import type { EmailKategorija } from "@/types";

const KATEGORIJE: Array<EmailKategorija | "SVE"> = [
  "SVE",
  "NARUDZBA",
  "UPIT",
  "REKLAMACIJA",
  "DOKUMENTACIJA",
  "LOGISTIKA",
  "INTERNI",
  "SPAM",
];

interface Props {
  active: EmailKategorija | "SVE";
  counts: Record<string, number>;
  onChange: (kategorija: EmailKategorija | "SVE") => void;
}

export function InboxFilters({ active, counts, onChange }: Props) {
  return (
    <div
      role="toolbar"
      aria-label="Filteri"
      data-test="inbox-filters"
      className="flex items-center gap-1.5 flex-wrap px-4 py-3 border-b border-border bg-card/40"
    >
      {KATEGORIJE.map((k) => {
        const count = k === "SVE" ? Object.values(counts).reduce((a, b) => a + b, 0) : counts[k] ?? 0;
        const isActive = active === k;
        return (
          <button
            key={k}
            type="button"
            onClick={() => onChange(k)}
            data-test={`filter-${k}`}
            data-active={isActive ? "true" : "false"}
            className={cn(
              "text-xs font-medium px-3 py-1.5 rounded-full border transition-colors",
              isActive
                ? "bg-forest text-primary-foreground border-forest"
                : "bg-card text-foreground/70 border-border hover:bg-cream",
            )}
          >
            {k} <span className="opacity-60">({count})</span>
          </button>
        );
      })}
    </div>
  );
}
