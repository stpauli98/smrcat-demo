"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useAppStore } from "@/stores/useAppStore";
import { PdfViewer } from "@/components/dokument/PdfViewer";
import { EditForm } from "@/components/dokument/EditForm";
import { StatusChip } from "@/components/shared/StatusChip";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/shared/Toast";
import { simulateRegenerate, simulateUrgentSend } from "@/lib/mockAi";
import {
  ChevronLeft,
  RefreshCcw,
  CheckCircle2,
  XCircle,
  Upload,
  Send,
} from "lucide-react";
import { formatDateTime } from "@/lib/format";

export default function DokumentReviewPage({
  params,
}: {
  params: { id: string; docId: string };
}) {
  const allPosiljke = useAppStore((s) => s.posiljke);
  const overrides = useAppStore((s) => s.documentStatusOverrides);
  const setDocumentStatus = useAppStore((s) => s.setDocumentStatus);

  const [reloadKey, setReloadKey] = useState(0);
  const [regenerating, setRegenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const posiljka = useMemo(
    () => allPosiljke.find((p) => p.id === params.id),
    [allPosiljke, params.id],
  );
  const dokument = useMemo(
    () => posiljka?.dokumenti.find((d) => d.id === params.docId),
    [posiljka, params.docId],
  );

  if (!posiljka || !dokument) return notFound();

  const status = overrides[dokument.id] ?? dokument.status;

  const handleRegenerate = async () => {
    setRegenerating(true);
    await simulateRegenerate();
    setReloadKey((k) => k + 1);
    setRegenerating(false);
  };

  const handleApprove = () => {
    setDocumentStatus(dokument.id, "Odobreno");
  };

  const handleReject = () => {
    setDocumentStatus(dokument.id, "Vraćeno");
  };

  const handleUpload = () => {
    setDocumentStatus(dokument.id, "Odobreno");
  };

  const handleSendToCustomer = async () => {
    setSending(true);
    await simulateUrgentSend();
    setSending(false);
    setToast("Email otpremljen, container može krenuti dalje");
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <div className="space-y-4 -mx-6 -my-8 h-[calc(100vh-4rem)] flex flex-col">
      <div className="px-6 pt-6 pb-2 flex items-center justify-between">
        <div className="space-y-1">
          <Link
            href={`/posiljke/${posiljka.id}`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-forest"
          >
            <ChevronLeft className="w-3 h-3" /> Nazad na pošiljku {posiljka.broj}
          </Link>
          <h1 className="text-xl font-serif font-medium" data-test="dokument-naslov">
            {dokument.ime}
          </h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span data-test="dokument-status">
              <StatusChip status={status} />
            </span>
            <span>·</span>
            <span>Jezik: {dokument.jezik}</span>
            <span>·</span>
            <span>
              {dokument.generisao} · {formatDateTime(dokument.generisano_u)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 pb-6 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        <div className="rounded-lg border border-border overflow-hidden bg-card">
          {dokument.pdf_path ? (
            <PdfViewer
              src={dokument.pdf_path}
              documentName={dokument.ime}
              reloadKey={reloadKey}
            />
          ) : (
            <div
              data-test="upload-placeholder"
              className="h-full flex flex-col items-center justify-center p-12 text-center"
            >
              <Upload className="w-10 h-10 text-warning mb-3" />
              <h2 className="text-base font-medium mb-1">Spoljni dokument</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Ovaj dokument se ne generiše AI-em — potreban je upload od strane operatora.
              </p>
              <Button onClick={handleUpload} data-test="action-upload-spoljni">
                <Upload className="w-4 h-4 mr-2" />
                Simuliraj upload (drag & drop)
              </Button>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card flex flex-col min-h-0">
          <div className="px-6 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">Polja dokumenta</h2>
          </div>
          <div className="flex-1 overflow-auto">
            <EditForm dokument={dokument} />
          </div>
          <div className="px-6 py-3 border-t border-border bg-card flex flex-wrap gap-2 justify-end">
            <Button
              variant="ghost"
              onClick={handleRegenerate}
              disabled={regenerating}
              data-test="action-regenerate"
            >
              <RefreshCcw className={`w-4 h-4 mr-2 ${regenerating ? "animate-spin" : ""}`} />
              {regenerating ? "Regenerisanje..." : "Regeneriši dokument"}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              data-test="action-reject"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Odbij
            </Button>
            <Button onClick={handleApprove} data-test="action-approve">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Odobri
            </Button>
            {status === "Odobreno" && (
              <Button
                variant="default"
                onClick={handleSendToCustomer}
                disabled={sending}
                data-test="action-posalji-kupcu"
              >
                <Send className={`w-4 h-4 mr-2 ${sending ? "animate-pulse" : ""}`} />
                {sending ? "Slanje..." : "Pošalji kupcu"}
              </Button>
            )}
          </div>
        </div>
      </div>
      {toast && <Toast message={toast} />}
    </div>
  );
}
