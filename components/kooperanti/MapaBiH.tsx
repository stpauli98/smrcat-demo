"use client";

import { useAppStore } from "@/stores/useAppStore";

const BBOX = { latMin: 42.55, latMax: 45.27, lngMin: 15.73, lngMax: 19.62 };
const VIEW_W = 600;
const VIEW_H = 420;

function project(lat: number, lng: number) {
  const x = ((lng - BBOX.lngMin) / (BBOX.lngMax - BBOX.lngMin)) * VIEW_W;
  const y = ((BBOX.latMax - lat) / (BBOX.latMax - BBOX.latMin)) * VIEW_H;
  return { x, y };
}

// Simplified outline of Bosnia and Herzegovina — hand-traced approximation.
const BIH_OUTLINE = `
M 60 60 L 110 50 L 160 45 L 210 38 L 250 52 L 280 70 L 310 60 L 340 65 L 370 80
L 400 100 L 430 85 L 460 95 L 490 130 L 510 170 L 525 200 L 540 230 L 555 265
L 545 295 L 525 330 L 495 360 L 460 380 L 420 390 L 380 385 L 340 390 L 310 380
L 280 385 L 245 365 L 215 345 L 180 325 L 150 305 L 130 275 L 110 240 L 90 205
L 75 165 L 65 130 L 60 95 Z
`;

const CITY_LABELS: Array<{ name: string; lat: number; lng: number }> = [
  { name: "Sarajevo", lat: 43.86, lng: 18.41 },
  { name: "Banja Luka", lat: 44.78, lng: 17.18 },
  { name: "Tuzla", lat: 44.54, lng: 18.67 },
  { name: "Mostar", lat: 43.34, lng: 17.81 },
  { name: "Zvornik", lat: 44.39, lng: 19.10 },
];

interface Props {
  highlightedKooperantId?: string | null;
}

export function MapaBiH({ highlightedKooperantId }: Props) {
  const kooperanti = useAppStore((s) => s.kooperanti);

  return (
    <div
      data-test="mapa-bih"
      className="rounded-lg border border-border bg-card overflow-hidden"
    >
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold">Mapa kooperanata u BiH</h2>
        <span className="text-xs text-muted-foreground">{kooperanti.length} lokacija</span>
      </div>
      <div className="p-4 bg-cream/30">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto max-h-[420px]"
          aria-label="Mapa Bosne i Hercegovine sa kooperantima"
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(40 24% 87%)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width={VIEW_W} height={VIEW_H} fill="url(#grid)" />
          <path
            d={BIH_OUTLINE}
            fill="hsl(83 38% 56% / 0.15)"
            stroke="hsl(121 39% 27%)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {CITY_LABELS.map((c) => {
            const { x, y } = project(c.lat, c.lng);
            return (
              <g key={c.name} opacity={0.7}>
                <circle cx={x} cy={y} r="2" fill="hsl(0 0% 42%)" />
                <text
                  x={x + 5}
                  y={y + 3}
                  fontSize="10"
                  fill="hsl(0 0% 42%)"
                  fontFamily="Inter, sans-serif"
                >
                  {c.name}
                </text>
              </g>
            );
          })}
          {kooperanti.map((k) => {
            const { x, y } = project(k.lat, k.lng);
            const isHl = k.id === highlightedKooperantId;
            return (
              <g
                key={k.id}
                data-test="map-pin"
                data-cooperant-id={k.id}
                data-highlighted={isHl ? "true" : "false"}
              >
                {isHl && (
                  <circle
                    cx={x}
                    cy={y}
                    r="14"
                    fill="hsl(121 39% 27% / 0.25)"
                    className="animate-pulse"
                  />
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={isHl ? 7 : 5}
                  fill="hsl(121 39% 27%)"
                  stroke="white"
                  strokeWidth="2"
                />
                <text
                  x={x + 9}
                  y={y - 7}
                  fontSize="10"
                  fontFamily="Inter, sans-serif"
                  fill="hsl(0 0% 10%)"
                  fontWeight={isHl ? 600 : 400}
                >
                  {k.ime_lokacije}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
