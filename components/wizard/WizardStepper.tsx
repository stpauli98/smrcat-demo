"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { num: 1, label: "Kupac" },
  { num: 2, label: "Proizvodi" },
  { num: 3, label: "Transport" },
  { num: 4, label: "Pregled" },
];

export function WizardStepper({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <ol
      role="list"
      data-test="wizard-stepper"
      className="flex items-center justify-between gap-2 px-4"
    >
      {STEPS.map((s, i) => {
        const done = current > s.num;
        const active = current === s.num;
        return (
          <li key={s.num} className="flex-1 flex items-center gap-2">
            <div
              data-test={`step-indicator-${s.num}`}
              data-active={active ? "true" : "false"}
              className={cn(
                "shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
                active && "bg-forest text-primary-foreground",
                done && "bg-success text-white",
                !active && !done && "bg-cream text-muted-foreground border border-border",
              )}
            >
              {done ? <Check className="w-4 h-4" /> : s.num}
            </div>
            <span
              className={cn(
                "text-sm font-medium",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                aria-hidden
                className={cn(
                  "flex-1 h-px mx-1",
                  done ? "bg-success" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
