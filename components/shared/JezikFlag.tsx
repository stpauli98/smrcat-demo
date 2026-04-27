import type { Jezik } from "@/types";

const flagMap: Record<Jezik, string> = {
  DE: "🇩🇪",
  IT: "🇮🇹",
  BCS: "🇧🇦",
  EN: "🇬🇧",
  FR: "🇫🇷",
  NL: "🇳🇱",
};

export function JezikFlag({ jezik }: { jezik: Jezik }) {
  return (
    <span aria-label={`Jezik: ${jezik}`} title={jezik} data-jezik={jezik} className="text-base leading-none">
      {flagMap[jezik]}
    </span>
  );
}
