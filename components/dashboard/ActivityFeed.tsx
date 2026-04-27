"use client";

import Link from "next/link";
import { Clock, FileText, CheckCircle2, Send, Inbox, Upload } from "lucide-react";
import { useAppStore } from "@/stores/useAppStore";
import { formatDateTime } from "@/lib/format";
import type { AuditEvent } from "@/types";

const iconMap = {
  kreirano: FileText,
  generisano: FileText,
  odobreno: CheckCircle2,
  poslano: Send,
  primljeno: Inbox,
  uploadovano: Upload,
};

export function ActivityFeed({ limit = 10 }: { limit?: number }) {
  const posiljke = useAppStore((s) => s.posiljke);

  const events: (AuditEvent & { posiljkaBroj: string })[] = posiljke
    .flatMap((p) => p.audit_events.map((e) => ({ ...e, posiljkaBroj: p.broj })))
    .sort((a, b) => new Date(b.vrijeme).getTime() - new Date(a.vrijeme).getTime())
    .slice(0, limit);

  return (
    <div data-test="activity-feed" className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center gap-2">
        <Clock className="w-4 h-4 text-forest" />
        <h2 className="text-sm font-semibold">Nedavne aktivnosti</h2>
      </div>
      <ul className="divide-y divide-border">
        {events.map((e) => {
          const Icon = iconMap[e.tip] ?? FileText;
          return (
            <li key={e.id} className="px-5 py-3 flex items-start gap-3" data-test="activity-row">
              <Icon className="w-4 h-4 text-forest mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm">
                  <Link
                    href={`/posiljke/${e.posiljka_id}`}
                    className="font-mono font-medium text-forest hover:underline"
                  >
                    {e.posiljkaBroj}
                  </Link>{" "}
                  · {e.opis}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {e.autor} · {formatDateTime(e.vrijeme)}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
