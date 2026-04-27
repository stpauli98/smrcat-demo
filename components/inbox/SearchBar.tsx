"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useAppStore } from "@/stores/useAppStore";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const posiljke = useAppStore((s) => s.posiljke);
  const kupci = useAppStore((s) => s.kupci);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const list: { label: string; sub: string; href: string }[] = [];

    for (const p of posiljke) {
      if (p.broj.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)) {
        const kupac = kupci.find((k) => k.id === p.kupac_id);
        list.push({
          label: `Pošiljka ${p.broj}`,
          sub: kupac ? `${kupac.ime} · ${p.status}` : p.status,
          href: `/posiljke/${p.id}`,
        });
      }
    }
    for (const k of kupci) {
      if (k.ime.toLowerCase().includes(q)) {
        list.push({
          label: k.ime,
          sub: `Kupac · ${k.adresa}`,
          href: `/kupci/${k.id}`,
        });
      }
    }
    return list.slice(0, 6);
  }, [query, posiljke, kupci]);

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Traži po broju pošiljke, kupcu, sadržaju"
          data-test="global-search"
          className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-forest/40"
        />
      </div>
      {open && suggestions.length > 0 && (
        <ul
          role="listbox"
          data-test="search-suggestions"
          className="absolute z-20 left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden"
        >
          {suggestions.map((s) => (
            <li key={s.href}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  router.push(s.href);
                  setOpen(false);
                  setQuery("");
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-cream transition-colors"
                data-test="search-result"
              >
                <div className="text-sm font-medium">{s.label}</div>
                <div className="text-xs text-muted-foreground">{s.sub}</div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
