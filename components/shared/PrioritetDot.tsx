import { cn } from "@/lib/utils";
import type { Prioritet } from "@/types";

const colorMap: Record<Prioritet, string> = {
  visok: "bg-danger",
  srednji: "bg-warning",
  nizak: "bg-neutral/40",
};

export function PrioritetDot({ prioritet }: { prioritet: Prioritet }) {
  return (
    <span
      aria-label={`Prioritet: ${prioritet}`}
      title={`Prioritet: ${prioritet}`}
      data-prioritet={prioritet}
      className={cn("inline-block w-2 h-2 rounded-full", colorMap[prioritet])}
    />
  );
}
