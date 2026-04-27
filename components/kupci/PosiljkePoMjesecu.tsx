"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { Posiljka } from "@/types";

const MJESECI = [
  "Jan", "Feb", "Mar", "Apr", "Maj", "Jun",
  "Jul", "Aug", "Sep", "Okt", "Nov", "Dec",
];

export function PosiljkePoMjesecu({ posiljke }: { posiljke: Posiljka[] }) {
  const counts: Record<string, number> = {};
  for (const p of posiljke) {
    const d = new Date(p.datum_kreiranja);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  const sorted = Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, value]) => {
      const [, m] = key.split("-");
      return { mjesec: MJESECI[Number(m) - 1], pošiljki: value };
    });

  if (sorted.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        Nema podataka o pošiljkama po mjesecima.
      </div>
    );
  }

  return (
    <div data-test="recharts-bar" className="w-full" style={{ height: 220, minWidth: 0 }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <BarChart data={sorted} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(40 24% 87%)" />
          <XAxis
            dataKey="mjesec"
            stroke="hsl(0 0% 42%)"
            fontSize={12}
            tickLine={false}
          />
          <YAxis stroke="hsl(0 0% 42%)" fontSize={12} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: "hsl(0 0% 100%)",
              border: "1px solid hsl(40 24% 87%)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Bar dataKey="pošiljki" fill="hsl(121 39% 27%)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
