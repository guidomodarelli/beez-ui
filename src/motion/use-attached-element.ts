"use client";

/** Tracks the DOM node rendered through a Slot while forwarding it to the caller's ref. */
import { useCallback, useState, type Ref } from "react";

/**
 * Returns the attached element and a callback ref that also feeds the caller's ref,
 * honoring React 19 ref cleanups.
 */
export function useAttachedElement<T extends HTMLElement>(
  ref: Ref<T> | undefined,
): readonly [T | null, (node: T | null) => () => void] {
  const [element, setElement] = useState<T | null>(null);
  const attach = useCallback(
    (node: T | null) => {
      setElement(node);
      const cleanup = typeof ref === "function" ? ref(node) : undefined;
      if (ref && typeof ref !== "function") ref.current = node;
      return () => {
        setElement(null);
        if (typeof cleanup === "function") cleanup();
        else if (typeof ref === "function") ref(null);
        else if (ref) ref.current = null;
      };
    },
    [ref],
  );
  return [element, attach];
}
