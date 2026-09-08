"use client";

/** Keeps optional browser persistence separate from the sidebar rendering contract. */
import { useCallback, useSyncExternalStore } from "react";
import { SIDEBAR_COOKIE_COLLAPSED_VALUE, SIDEBAR_COOKIE_OPEN_VALUE } from "../constants/sidebar.js";

/** Reads a preference without making unavailable browser storage a render failure. */
function readSidebarPreference(storageKey?: string): boolean | null {
  if (!storageKey || typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(storageKey);
    if (value === SIDEBAR_COOKIE_OPEN_VALUE) return true;
    if (value === SIDEBAR_COOKIE_COLLAPSED_VALUE) return false;
  } catch {
    // Persisted preferences are optional; blocked storage retains the server default.
  }
  return null;
}

/** Subscribes to browser storage updates and releases the listener on unmount. */
function subscribeToStorage(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

/** Keeps the first hydrated render identical to the server-provided preference. */
function getServerPreference(): null {
  return null;
}

/** Resolves opt-in persistence after hydration, without changing controlled state. */
export function useSidebarPersistence(storageKey?: string): boolean | null {
  const getSnapshot = useCallback(() => readSidebarPreference(storageKey), [storageKey]);
  return useSyncExternalStore(subscribeToStorage, getSnapshot, getServerPreference);
}

/** Stores an optional preference while retaining usable navigation in private mode. */
export function saveSidebarPreference(storageKey: string | undefined, open: boolean): void {
  if (!storageKey) return;
  try {
    window.localStorage.setItem(storageKey, open ? SIDEBAR_COOKIE_OPEN_VALUE : SIDEBAR_COOKIE_COLLAPSED_VALUE);
  } catch {
    // The current in-memory state remains authoritative if storage is blocked.
  }
}
