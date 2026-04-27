"use client";

import { useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";

export function StoreInit() {
  useEffect(() => {
    void useAppStore.getState();
    if (typeof window !== "undefined") {
      (window as unknown as { __APP_STORE__: typeof useAppStore }).__APP_STORE__ =
        useAppStore;
    }
  }, []);
  return null;
}
