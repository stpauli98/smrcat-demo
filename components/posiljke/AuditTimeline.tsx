"use client";

import { CheckCircle2, FileText, Send, Inbox, Upload } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AuditEvent } from "@/types";

const iconMap = {
  kreirano: FileText,
  generisano: FileText,
  odobreno: CheckCircle2,
  poslano: Send,
  primljeno: Inbox,
  uploadovano: Upload,
};

const colorMap = {
  kreirano: "bg-info text-info-foreground",
  generisano: "bg-info text-info-foreground",
  odobreno: "bg-success text-success-foreground",
  poslano: "bg-forest text-primary-foreground",
  primljeno: "bg-warning text-warning-foreground",
  uploadovano: "bg-info text-info-foreground",
};

export function AuditTimeline({ events }: { events: AuditEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        Nema audit zapisa.
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden" data-test="audit-timeline">
      <div className="px-5 py-3 border-b border-border">
        <h2 className="text-sm font-semibold">Audit timeline</h2>
      </div>
      <ol className="px-5 py-4 space-y-4 relative">
        <span aria-hidden className="absolute left-[28px] top-6 bottom-4 w-px bg-border" />
        {events.map((e, idx) => {
          const Icon = iconMap[e.tip];
          return (
            <li key={e.id} className="flex gap-4 relative" data-test="audit-event">
              <span
                className={cn(
                  "z-10 w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white",
                  colorMap[e.tip],
                )}
                style={{ marginLeft: 0 }}
              >
                <Icon className="w-3.5 h-3.5" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm">{e.opis}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {e.autor} · {formatDateTime(e.vrijeme)}
                </div>
              </div>
              {idx === 0 && <span className="sr-only">Posljednji događaj</span>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
