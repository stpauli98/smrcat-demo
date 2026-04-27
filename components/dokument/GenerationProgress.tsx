"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { GENERATION_DOC_ORDER, simulateDocumentGeneration } from "@/lib/mockAi";

interface Props {
  onDone: () => void;
}

interface Row {
  docId: string;
  label: string;
  status: "idle" | "generating" | "done";
}

export function GenerationProgress({ onDone }: Props) {
  const [rows, setRows] = useState<Row[]>(() =>
    GENERATION_DOC_ORDER.map((d) => ({ docId: d.docId, label: d.label, status: "idle" })),
  );
  const [currentLabel, setCurrentLabel] = useState("Pripremam AI agenta...");

  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      for await (const step of simulateDocumentGeneration()) {
        if (cancelled) return;
        setRows((prev) =>
          prev.map((r, idx) => (idx === step.index ? { ...r, status: step.status } : r)),
        );
        if (step.status === "generating") {
          setCurrentLabel(`Generiše ${step.label.toLowerCase()}...`);
        }
      }
      if (cancelled) return;
      setCurrentLabel("Spreman za pregled.");
      // Hold the "all generated" state visible for 1.5s before calling onDone
      setTimeout(() => {
        if (!cancelled) onDoneRef.current();
      }, 1500);
    };
    void run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doneCount = rows.filter((r) => r.status === "done").length;
  const total = rows.length;
  const pct = Math.round((doneCount / total) * 100);

  return (
    <div
      data-test="generation-progress"
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur flex items-center justify-center p-6"
    >
      <div className="w-full max-w-xl rounded-xl border border-border bg-card shadow-xl p-8">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-5 h-5 text-forest" />
          <h2 className="text-lg font-serif font-semibold">AI generiše dokumente</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4" data-test="generation-current-label">
          {currentLabel}
        </p>
        <div className="w-full h-2 bg-cream rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-forest transition-all duration-300"
            style={{ width: `${pct}%` }}
            data-test="generation-progress-bar"
          />
        </div>
        <ul className="space-y-2" data-test="generation-list">
          {rows.map((r) => (
            <li
              key={r.docId}
              data-test="generation-row"
              data-doc-status={r.status}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                r.status === "generating" && "bg-cream/60",
                r.status === "done" && "bg-success/5",
              )}
            >
              {r.status === "idle" && (
                <span className="w-4 h-4 rounded-full border border-border" />
              )}
              {r.status === "generating" && (
                <Loader2 className="w-4 h-4 text-info animate-spin" />
              )}
              {r.status === "done" && <CheckCircle2 className="w-4 h-4 text-success" />}
              <span
                className={cn(
                  "text-sm",
                  r.status === "idle" && "text-muted-foreground",
                  r.status === "generating" && "font-medium",
                )}
              >
                {r.label}
              </span>
            </li>
          ))}
        </ul>
        <div className="text-xs text-muted-foreground mt-4 text-right" data-test="generation-counter">
          {doneCount} / {total} dokumenata
        </div>
        {doneCount === total && (
          <div
            data-test="all-generated"
            className="mt-4 text-sm text-success font-medium text-center"
          >
            ✓ Svi dokumenti generisani
          </div>
        )}
      </div>
    </div>
  );
}
