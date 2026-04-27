"use client";

import { cn } from "@/lib/utils";
import { KategorijaChip } from "@/components/shared/KategorijaChip";
import { JezikFlag } from "@/components/shared/JezikFlag";
import { PrioritetDot } from "@/components/shared/PrioritetDot";
import { relativeTime } from "@/lib/relativeTime";
import type { Email } from "@/types";

interface Props {
  email: Email;
  selected: boolean;
  onSelect: (id: number) => void;
}

export function EmailListItem({ email, selected, onSelect }: Props) {
  const snippet = email.email_text.replace(/\n/g, " ").slice(0, 110);
  return (
    <button
      type="button"
      onClick={() => onSelect(email.id)}
      data-test="email-row"
      data-email-id={email.id}
      data-procitan={email.procitan ? "true" : "false"}
      className={cn(
        "w-full text-left px-4 py-3 border-b border-border transition-colors",
        selected ? "bg-cream" : "bg-card hover:bg-cream/60",
        !email.procitan && !selected && "border-l-2 border-l-forest",
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <PrioritetDot prioritet={email.prioritet} />
          <span className={cn("text-sm font-medium truncate", !email.procitan && "text-forest")}>
            {email.sender_ime ?? email.sender}
          </span>
          <span className="text-xs text-muted-foreground truncate">{email.sender}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <JezikFlag jezik={email.jezik} />
          <span className="text-xs text-muted-foreground">{relativeTime(email.vrijeme)}</span>
        </div>
      </div>
      <div className={cn("text-sm mb-1", !email.procitan ? "font-semibold" : "font-medium")}>
        {email.subject}
      </div>
      <div className="text-xs text-muted-foreground line-clamp-2 mb-2">{snippet}</div>
      <div className="flex items-center gap-2">
        <KategorijaChip kategorija={email.kategorija} />
        {email.povezana_posiljka_broj && (
          <span className="text-[11px] text-info font-mono">
            ↔ {email.povezana_posiljka_broj}
          </span>
        )}
      </div>
    </button>
  );
}
