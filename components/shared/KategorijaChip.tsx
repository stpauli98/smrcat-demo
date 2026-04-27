import { cn } from "@/lib/utils";
import type { EmailKategorija } from "@/types";

const colorMap: Record<EmailKategorija, string> = {
  NARUDZBA: "bg-success/10 text-success",
  UPIT: "bg-info/10 text-info",
  REKLAMACIJA: "bg-danger/10 text-danger",
  DOKUMENTACIJA: "bg-warning/10 text-warning",
  LOGISTIKA: "bg-neutral/10 text-neutral",
  SPAM: "bg-neutral/5 text-neutral/70",
  INTERNI: "bg-moss/20 text-forest",
};

export function KategorijaChip({
  kategorija,
  className,
}: {
  kategorija: EmailKategorija;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide",
        colorMap[kategorija],
        className,
      )}
      data-kategorija={kategorija}
    >
      {kategorija}
    </span>
  );
}
