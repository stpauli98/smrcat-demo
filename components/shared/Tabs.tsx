"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface Props {
  tabs: Tab[];
  initial?: string;
  children: (activeId: string) => React.ReactNode;
  ariaLabel?: string;
}

export function Tabs({ tabs, initial, children, ariaLabel = "Tabovi" }: Props) {
  const [active, setActive] = useState(initial ?? tabs[0]?.id);

  return (
    <div className="space-y-4" data-test="tabs">
      <div role="tablist" aria-label={ariaLabel} className="flex border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={t.id === active}
            data-test="tab-trigger"
            data-tab-id={t.id}
            data-active={t.id === active ? "true" : "false"}
            onClick={() => setActive(t.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
              t.id === active
                ? "border-forest text-forest"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            {typeof t.count === "number" && (
              <span className="ml-1.5 text-xs text-muted-foreground">({t.count})</span>
            )}
          </button>
        ))}
      </div>
      <div role="tabpanel" data-test="tab-panel" data-active-tab={active}>
        {children(active)}
      </div>
    </div>
  );
}
