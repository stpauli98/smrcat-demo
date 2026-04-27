"use client";

import Link from "next/link";
import { FileText, Upload as UploadIcon } from "lucide-react";
import { StatusChip } from "@/components/shared/StatusChip";
import { useAppStore } from "@/stores/useAppStore";
import type { Posiljka, DokumentStatus } from "@/types";

export function DokumentiList({ posiljka }: { posiljka: Posiljka }) {
  const overrides = useAppStore((s) => s.documentStatusOverrides);

  const resolveStatus = (docId: string, fallback: DokumentStatus) =>
    (overrides[docId] as DokumentStatus | undefined) ?? fallback;

  if (posiljka.dokumenti.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        Nema dokumenata za ovu pošiljku.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden" data-test="dokumenti-list">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold">Dokumentacija</h2>
        <span className="text-xs text-muted-foreground">{posiljka.dokumenti.length} dokumenata</span>
      </div>
      <ul className="divide-y divide-border">
        {posiljka.dokumenti.map((d) => {
          const status = resolveStatus(d.id, d.status);
          const Icon = status === "Upload" ? UploadIcon : FileText;
          return (
            <li key={d.id} data-test="dokument-row" data-doc-id={d.id} data-doc-status={status}>
              <Link
                href={`/posiljke/${posiljka.id}/dokumenti/${d.id}`}
                className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-cream/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className="w-4 h-4 text-forest shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{d.ime}</div>
                    <div className="text-xs text-muted-foreground">
                      {d.jezik} · {d.generisao}
                    </div>
                  </div>
                </div>
                <StatusChip status={status} />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
