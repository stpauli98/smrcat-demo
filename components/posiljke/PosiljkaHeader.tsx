"use client";

import Link from "next/link";
import { StatusChip } from "@/components/shared/StatusChip";
import { formatDate } from "@/lib/format";
import type { Posiljka, Kupac } from "@/types";

export function PosiljkaHeader({ posiljka, kupac }: { posiljka: Posiljka; kupac: Kupac | null }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
            POŠILJKA
          </div>
          <h1
            className="text-3xl font-mono font-semibold text-forest"
            data-test="posiljka-broj"
          >
            {posiljka.broj}
          </h1>
          {kupac && (
            <Link
              href={`/kupci/${kupac.id}`}
              className="text-sm text-foreground/80 hover:text-forest hover:underline"
            >
              {kupac.ime} · {kupac.adresa}
            </Link>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-xs text-muted-foreground">
            <div>Datum kreiranja: {formatDate(posiljka.datum_kreiranja)}</div>
            <div>Datum otpreme: {formatDate(posiljka.datum_otpreme)}</div>
          </div>
          <StatusChip status={posiljka.status} />
        </div>
      </div>
    </div>
  );
}
