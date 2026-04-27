import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "warning" | "success" | "danger";
}

const toneStyles: Record<NonNullable<Props["tone"]>, string> = {
  default: "border-border",
  warning: "border-warning/40",
  success: "border-success/40",
  danger: "border-danger/40",
};

export function StatCard({ label, value, hint, icon: Icon, tone = "default" }: Props) {
  return (
    <div
      data-test="stat-card"
      className={cn(
        "rounded-lg border bg-card p-5 flex flex-col gap-2",
        toneStyles[tone],
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
        {Icon && <Icon className="w-4 h-4 text-forest" />}
      </div>
      <div className="text-3xl font-serif font-semibold">{value}</div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
