import * as React from "react"

/** Viewport width in CSS pixels at which desktop navigation begins. */
const MOBILE_BREAKPOINT = 768

function subscribeToMobileBreakpoint(onStoreChange: () => void) {
  const mediaQueryList = window.matchMedia(
    `(max-width: ${MOBILE_BREAKPOINT - 1}px)`
  )

  mediaQueryList.addEventListener("change", onStoreChange)

  return () => {
    mediaQueryList.removeEventListener("change", onStoreChange)
  }
}

function getMobileSnapshot() {
  return window.innerWidth < MOBILE_BREAKPOINT
}

function getServerMobileSnapshot() {
  return false
}

export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribeToMobileBreakpoint,
    getMobileSnapshot,
    getServerMobileSnapshot
  )
}
