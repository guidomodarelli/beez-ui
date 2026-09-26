"use client";

/**
 * Offers to apply a waiting service worker update. It stays hidden until the browser reports a
 * waiting worker, asks it to activate on demand and reloads once the new worker takes control.
 */
import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

import { useIsHydrated } from "../hooks/use-is-hydrated.js";
import { cn } from "../lib/utils.js";
import { Button } from "./button.js";

/** Message understood by Workbox and most hand-written workers to call `skipWaiting()`. */
const DEFAULT_SKIP_WAITING_MESSAGE = { type: "SKIP_WAITING" } as const;
const INSTALLED_WORKER_STATE = "installed";

const PWA_UPDATE_DEFAULT_LABELS = {
  badge: "Hay una nueva versión",
  action: "Actualizar app",
} as const;

export interface PwaUpdateControlLabels {
  /** Short notice next to the button; hidden on narrow screens. */
  badge?: string;
  action?: string;
}

export interface PwaUpdateControlProps {
  labels?: PwaUpdateControlLabels;
  /** Message posted to the waiting worker so it activates. */
  skipWaitingMessage?: unknown;
  className?: string;
}

/**
 * Tells whether the current page can talk to service workers.
 * @returns Whether the Service Worker API is available.
 */
function canUseServiceWorker(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator;
}

/**
 * Reports a waiting worker now, or as soon as a newly found one finishes installing.
 * @param registration - Registration of the current page.
 * @param onWaiting - Called when an update is ready to activate.
 * @returns A cleanup that stops watching.
 */
function watchForWaitingWorker(registration: ServiceWorkerRegistration, onWaiting: () => void): () => void {
  if (registration.waiting) onWaiting();

  const handleUpdateFound = () => {
    const installingWorker = registration.installing;
    if (!installingWorker) return;

    installingWorker.addEventListener("statechange", () => {
      // Without a controller this is the first install, not an update.
      if (installingWorker.state === INSTALLED_WORKER_STATE && navigator.serviceWorker.controller) onWaiting();
    });
  };

  registration.addEventListener("updatefound", handleUpdateFound);
  return () => registration.removeEventListener("updatefound", handleUpdateFound);
}

/**
 * Renders the update notice and action once an update is waiting; nothing otherwise, including
 * during server rendering and hydration.
 * @param props - Optional labels, activation message and class name.
 * @returns The update control, or nothing.
 */
export function PwaUpdateControl({ labels, skipWaitingMessage = DEFAULT_SKIP_WAITING_MESSAGE, className }: PwaUpdateControlProps) {
  const resolvedLabels = { ...PWA_UPDATE_DEFAULT_LABELS, ...labels };
  const isHydrated = useIsHydrated();
  const [hasUpdateReady, setHasUpdateReady] = useState(false);
  const [isApplyingUpdate, setIsApplyingUpdate] = useState(false);
  const hasReloadedForControllerChange = useRef(false);

  useEffect(() => {
    if (!isHydrated || !canUseServiceWorker()) return;

    let stopWatchingRegistration: () => void = () => {};
    let isDisposed = false;
    const markUpdateReady = () => {
      if (!isDisposed) setHasUpdateReady(true);
    };
    const handleControllerChange = () => {
      if (hasReloadedForControllerChange.current) return;
      hasReloadedForControllerChange.current = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    const attachUpdateWatcher = async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration || isDisposed) return;

      stopWatchingRegistration = watchForWaitingWorker(registration, markUpdateReady);
      // A failed check (offline, server error) keeps the current version without blocking the page.
      await registration.update().catch(() => undefined);
      if (registration.waiting) markUpdateReady();
    };
    void attachUpdateWatcher();

    return () => {
      isDisposed = true;
      stopWatchingRegistration();
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, [isHydrated]);

  const applyUpdate = async () => {
    setIsApplyingUpdate(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return;
      if (!registration.waiting) await registration.update();
      registration.waiting?.postMessage(skipWaitingMessage);
    } catch (updateError) {
      console.error("PwaUpdateControl:applyUpdate failed to activate the waiting service worker", updateError);
    } finally {
      setIsApplyingUpdate(false);
    }
  };

  if (!isHydrated || !canUseServiceWorker() || !hasUpdateReady) return null;

  return (
    <div data-slot="pwa-update-control" className={cn("inline-flex items-center gap-[0.45rem]", className)}>
      <span className="hidden items-center rounded-full border border-[color-mix(in_srgb,var(--border)_84%,var(--primary)_16%)] bg-[color-mix(in_srgb,var(--muted)_90%,var(--primary)_10%)] px-2 py-[0.1rem] text-[0.72rem] leading-tight text-[color-mix(in_srgb,var(--foreground)_78%,var(--primary)_22%)] sm:inline-flex">
        {resolvedLabels.badge}
      </span>
      <Button disabled={isApplyingUpdate} size="sm" type="button" onClick={() => void applyUpdate()}>
        <RefreshCw aria-hidden="true" className={cn(isApplyingUpdate && "animate-spin")} />
        {resolvedLabels.action}
      </Button>
    </div>
  );
}
