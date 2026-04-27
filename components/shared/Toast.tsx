"use client";

import { CheckCircle2 } from "lucide-react";

export function Toast({ message }: { message: string }) {
  return (
    <div
      data-test="toast"
      role="status"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-forest text-primary-foreground rounded-lg shadow-lg px-5 py-3 flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-bottom-4"
    >
      <CheckCircle2 className="w-4 h-4" />
      {message}
    </div>
  );
}
