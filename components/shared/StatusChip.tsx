import { cn } from "@/lib/utils";
import type { PosiljkaStatus, DokumentStatus } from "@/types";

type AnyStatus = PosiljkaStatus | DokumentStatus | string;

const colorMap: Record<string, string> = {
  Draft: "bg-neutral/10 text-neutral",
  "Čeka pregled": "bg-warning/10 text-warning",
  "U izradi": "bg-info/10 text-info",
  "Čeka spoljni upload": "bg-warning/10 text-warning",
  Upload: "bg-warning/10 text-warning",
  "Spremno za otpremu": "bg-info/10 text-info",
  "U tranzitu": "bg-info/10 text-info",
  Završeno: "bg-success/10 text-success",
  Odobreno: "bg-success/10 text-success",
  Vraćeno: "bg-danger/10 text-danger",
  Reklamacija: "bg-danger/10 text-danger",
};

export function StatusChip({ status, className }: { status: AnyStatus; className?: string }) {
  const cls = colorMap[status] ?? "bg-neutral/10 text-neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium",
        cls,
        className,
      )}
      data-status={status}
    >
      {status}
    </span>
  );
}
