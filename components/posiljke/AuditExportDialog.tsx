"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { simulateAuditExport } from "@/lib/mockAi";
import { X, FileDown } from "lucide-react";

interface Props {
  trigger: React.ReactNode;
  posiljkaBroj?: string;
}

function downloadBlob(name: string, content: string) {
  const blob = new Blob([content], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function AuditExportDialog({ trigger, posiljkaBroj }: Props) {
  const [open, setOpen] = useState(false);
  const [datumOd, setDatumOd] = useState("2026-01-01");
  const [datumDo, setDatumDo] = useState("2026-04-30");
  const [format, setFormat] = useState<"PDF" | "ZIP" | "EXCEL">("ZIP");
  const [progress, setProgress] = useState<"idle" | "preparing" | "done">("idle");

  const handleGenerate = async () => {
    setProgress("preparing");
    await simulateAuditExport(3500);
    const filename = posiljkaBroj
      ? `audit-${posiljkaBroj.replace("/", "-")}.${format.toLowerCase()}`
      : `audit-export-${datumOd}_${datumDo}.${format.toLowerCase()}`;
    downloadBlob(
      filename,
      `Demo audit export — Smrčak d.o.o.\nPosiljka: ${posiljkaBroj ?? "sve"}\nPeriod: ${datumOd} → ${datumDo}\nFormat: ${format}\n`,
    );
    setProgress("done");
    setTimeout(() => {
      setOpen(false);
      setProgress("idle");
    }, 1500);
  };

  return (
    <>
      <span
        onClick={() => setOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") setOpen(true);
        }}
      >
        {trigger}
      </span>

      {open && (
        <div
          data-test="audit-export-dialog"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
          onClick={() => progress === "idle" && setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-card shadow-xl border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <h2 className="text-base font-serif font-semibold">Audit eksport</h2>
              <button
                aria-label="Zatvori"
                onClick={() => progress === "idle" && setOpen(false)}
                className="p-1 rounded hover:bg-cream"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {posiljkaBroj && (
                <div className="text-sm">
                  Pošiljka:{" "}
                  <span className="font-mono font-medium text-forest">{posiljkaBroj}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1">Od</label>
                  <input
                    type="date"
                    value={datumOd}
                    onChange={(e) => setDatumOd(e.target.value)}
                    data-test="audit-date-od"
                    className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">Do</label>
                  <input
                    type="date"
                    value={datumDo}
                    onChange={(e) => setDatumDo(e.target.value)}
                    data-test="audit-date-do"
                    className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Format</label>
                <div className="flex gap-2">
                  {(["PDF", "ZIP", "EXCEL"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFormat(f)}
                      data-test={`audit-format-${f}`}
                      data-selected={format === f ? "true" : "false"}
                      className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${
                        format === f
                          ? "bg-forest text-primary-foreground border-forest"
                          : "bg-card border-border hover:bg-cream"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              {progress === "preparing" && (
                <div className="space-y-2" data-test="audit-progress">
                  <div className="text-xs text-muted-foreground">Priprema paketa...</div>
                  <div className="w-full h-1.5 bg-cream rounded-full overflow-hidden">
                    <div className="h-full bg-forest animate-[width_3.5s_linear] w-full" />
                  </div>
                </div>
              )}
              {progress === "done" && (
                <div
                  className="text-sm text-success font-medium text-center"
                  data-test="audit-done"
                >
                  ✓ Paket preuzet
                </div>
              )}
            </div>
            <div className="px-5 py-3 border-t border-border flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={progress !== "idle"}
              >
                Otkaži
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={progress !== "idle"}
                data-test="audit-generate"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Generiši
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
