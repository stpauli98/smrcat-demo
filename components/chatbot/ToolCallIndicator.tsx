"use client";

import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Search,
  Database,
  MapPin,
  Truck,
  FileSearch,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatToolCall } from "./types";
import type { LucideIcon } from "lucide-react";

const TOOL_LABELS: Record<string, { label: string; icon: LucideIcon }> = {
  pretrazi_dokumente: { label: "Pretražujem bazu znanja", icon: FileSearch },
  provjeri_lot_zalihe: { label: "Provjeravam zalihe", icon: Database },
  nadji_kupca: { label: "Tražim kupca", icon: Search },
  nadji_posiljku: { label: "Učitavam pošiljku", icon: Package },
  izracunaj_dostavu: { label: "Računam dostavu", icon: Truck },
  lista_kooperanata: { label: "Učitavam kooperante", icon: MapPin },
};

export function ToolCallIndicator({ toolCalls }: { toolCalls: ChatToolCall[] }) {
  if (!toolCalls || toolCalls.length === 0) return null;
  return (
    <ul data-test="tool-call-indicators" className="flex flex-col gap-1 mb-2">
      {toolCalls.map((tc) => {
        const meta = TOOL_LABELS[tc.name] ?? { label: tc.name, icon: Loader2 };
        const Icon = meta.icon;
        return (
          <li
            key={tc.id}
            data-test="tool-call-row"
            data-tool-name={tc.name}
            data-tool-status={tc.status}
            className={cn(
              "inline-flex items-center gap-2 self-start px-2.5 py-1 rounded-md text-[11px] font-medium border",
              tc.status === "running" &&
                "bg-cream/60 border-border text-forest",
              tc.status === "done" &&
                "bg-success/10 border-success/30 text-success",
              tc.status === "error" &&
                "bg-danger/10 border-danger/30 text-danger",
            )}
          >
            {tc.status === "running" && (
              <Loader2 className="w-3 h-3 animate-spin" />
            )}
            {tc.status === "done" && <CheckCircle2 className="w-3 h-3" />}
            {tc.status === "error" && <AlertCircle className="w-3 h-3" />}
            <Icon className="w-3 h-3 opacity-60" />
            <span>{meta.label}</span>
            {tc.status === "done" && tc.durationMs != null && (
              <span className="text-[10px] opacity-60">
                ({Math.round(tc.durationMs)}ms)
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
