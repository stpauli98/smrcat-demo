"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { KategorijaChip } from "@/components/shared/KategorijaChip";
import { JezikFlag } from "@/components/shared/JezikFlag";
import { formatDateTime } from "@/lib/format";
import { Sparkles, FileText, Mail, CheckCircle2, FolderOpen } from "lucide-react";
import type { Email } from "@/types";

interface Props {
  email: Email | null;
  onMarkRead?: (id: number) => void;
}

function posiljkaSlug(broj: string) {
  return broj.replace("/", "-");
}

export function EmailPreview({ email, onMarkRead }: Props) {
  if (!email) {
    return (
      <div
        data-test="email-preview-empty"
        className="h-full flex items-center justify-center p-12 text-center text-sm text-muted-foreground"
      >
        <div>
          <Mail className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50" />
          Izaberite email iz liste
        </div>
      </div>
    );
  }

  return (
    <article data-test="email-preview" className="h-full flex flex-col">
      <header className="px-6 py-5 border-b border-border bg-card">
        <div className="flex items-center gap-2 mb-2">
          <KategorijaChip kategorija={email.kategorija} />
          <JezikFlag jezik={email.jezik} />
          <span className="text-xs text-muted-foreground">{formatDateTime(email.vrijeme)}</span>
        </div>
        <h2 className="text-lg font-serif font-medium mb-1">{email.subject}</h2>
        <div className="text-sm">
          <span className="font-medium">{email.sender_ime ?? "Bez imena"}</span>{" "}
          <span className="text-muted-foreground">&lt;{email.sender}&gt;</span>
        </div>
      </header>

      <div className="px-6 py-4 bg-cream/60 border-b border-border">
        <div className="flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-forest mt-0.5 shrink-0" />
          <div className="text-sm">
            <span className="font-medium text-forest">AI sažetak: </span>
            <span className="text-foreground/85">{email.ai_sazetak}</span>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 flex-1 overflow-auto">
        <pre className="whitespace-pre-wrap font-sans text-sm text-foreground/90 leading-relaxed">
          {email.email_text}
        </pre>
      </div>

      <footer className="px-6 py-4 border-t border-border bg-card flex flex-wrap gap-2">
        {email.kategorija === "NARUDZBA" && (
          <Button asChild data-test="action-kreiraj-posiljku">
            <Link href={`/posiljke/nova?fromEmail=${email.id}`}>
              <FileText className="w-4 h-4 mr-2" />
              Kreiraj pošiljku iz emaila
            </Link>
          </Button>
        )}
        {email.povezana_posiljka_broj && (
          <Button asChild variant="secondary" data-test="action-otvori-posiljku">
            <Link href={`/posiljke/${posiljkaSlug(email.povezana_posiljka_broj)}`}>
              <FolderOpen className="w-4 h-4 mr-2" />
              Otvori pošiljku {email.povezana_posiljka_broj}
            </Link>
          </Button>
        )}
        <Button variant="ghost" data-test="action-ai-draft">
          <Sparkles className="w-4 h-4 mr-2" />
          Odgovori AI draft-om
        </Button>
        {!email.procitan && onMarkRead && (
          <Button
            variant="ghost"
            data-test="action-mark-read"
            onClick={() => onMarkRead(email.id)}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Označi kao obrađen
          </Button>
        )}
      </footer>
    </article>
  );
}
