"use client";

import { useEffect } from "react";

/**
 * Registers the service worker on first load.
 * Rendered once in the root layout — no UI output.
 */
export function PWAInit() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => console.error("[SW] Registration failed:", err));
    }
  }, []);

  return null;
}
