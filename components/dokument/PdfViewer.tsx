"use client";

import { useState } from "react";
import { ZoomIn, ZoomOut, RotateCw } from "lucide-react";

interface Props {
  src: string;
  documentName: string;
  reloadKey?: number;
}

export function PdfViewer({ src, documentName, reloadKey = 0 }: Props) {
  const [zoom, setZoom] = useState(100);

  return (
    <div className="h-full flex flex-col bg-cream/40">
      <div className="px-4 py-2 border-b border-border bg-card flex items-center justify-between">
        <span className="text-xs text-muted-foreground truncate">{documentName}</span>
        <div className="flex items-center gap-1" data-test="pdf-toolbar">
          <button
            onClick={() => setZoom((z) => Math.max(50, z - 10))}
            className="p-1.5 rounded hover:bg-cream"
            aria-label="Smanji zoom"
            data-test="pdf-zoom-out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-muted-foreground w-10 text-center">{zoom}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(200, z + 10))}
            className="p-1.5 rounded hover:bg-cream"
            aria-label="Povećaj zoom"
            data-test="pdf-zoom-in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(100)}
            className="p-1.5 rounded hover:bg-cream"
            aria-label="Resetuj zoom"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div
          className="mx-auto bg-white shadow-sm"
          style={{ width: `${zoom}%`, transition: "width 120ms ease-out", minHeight: 700 }}
          data-test="pdf-frame-container"
        >
          <iframe
            key={`${src}-${reloadKey}`}
            src={`${src}#toolbar=0&navpanes=0&scrollbar=0`}
            title={documentName}
            data-test="pdf-iframe"
            className="w-full h-[700px] border-0"
          />
        </div>
      </div>
    </div>
  );
}
