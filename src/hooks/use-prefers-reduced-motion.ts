"use client";

/** Reads motion preferences without changing the initial server/hydration markup. */
import { useSyncExternalStore } from "react";
import { REDUCED_MOTION_QUERY } from "../constants/motion.js";

/** Subscribes to preference changes, including browsers exposing the legacy media API. */
function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function")
    return () => {};
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  if (typeof query.addEventListener === "function") {
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }
  query.addListener?.(onChange);
  return () => query.removeListener?.(onChange);
}

/** Resolves the current browser setting while tolerating non-browser test environments. */
function getSnapshot(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(REDUCED_MOTION_QUERY).matches
  );
}

/** Keeps the initial client tree consistent with the server-rendered tree. */
function getServerSnapshot(): boolean {
  return false;
}

/** Returns a live preference for animations that cannot be controlled with CSS alone. */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
