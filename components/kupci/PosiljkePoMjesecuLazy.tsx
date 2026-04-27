"use client";

import dynamic from "next/dynamic";
import type { Posiljka } from "@/types";

const PosiljkePoMjesecuClient = dynamic(
  () => import("./PosiljkePoMjesecu").then((m) => m.PosiljkePoMjesecu),
  {
    ssr: false,
    loading: () => (
      <div data-test="recharts-bar" className="w-full" style={{ height: 220 }}>
        <div className="w-full h-full bg-cream/40 rounded animate-pulse" />
      </div>
    ),
  },
);

export function PosiljkePoMjesecu({ posiljke }: { posiljke: Posiljka[] }) {
  return <PosiljkePoMjesecuClient posiljke={posiljke} />;
}
