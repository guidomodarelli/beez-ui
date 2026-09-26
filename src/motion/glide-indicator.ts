/**
 * Glides an active-item indicator between items of a container, like a shared `layoutId`,
 * without adding persistent markup: a transient copy of the target's highlight travels from the
 * previous item and is removed once it lands, leaving the item's own styles in charge again.
 */
import { animate, type AnimationPlaybackControlsWithThen } from "motion/react";
import {
  GLIDE_CONTINUITY_MS,
  SPRING_HIGHLIGHT,
  SPRING_LAYOUT,
  SPRING_TABS,
} from "./tokens.js";

/** Which part of the active item carries the highlight that must travel. */
type GlideSurface = "background" | "after";

/** Describes the items of one container and how their active state is exposed. */
export interface GlidePreset {
  itemSelector: string;
  /**
   * Matches the container and any nested container of the same kind, so items that belong to a
   * nested one (a submenu rendered inside its parent menu) are left to that container's glide.
   */
  containerSelector: string;
  /** Attributes whose mutations can change which item is active. */
  attributes: string[];
  isActive: (item: Element) => boolean;
  surface: (container: HTMLElement) => GlideSurface;
  spring: typeof SPRING_LAYOUT | typeof SPRING_TABS | typeof SPRING_HIGHLIGHT;
  /**
   * Highlights that follow the pointer (menus, listboxes) jump straight to the hovered item:
   * the pointer already marks the position, so a travelling copy would only trail behind it.
   * The glide is kept for keyboard navigation.
   */
  instantOnPointer?: boolean;
}

export const GLIDE_PRESETS = {
  tabs: {
    itemSelector: '[data-slot="tabs-trigger"]',
    containerSelector: '[role="tablist"]',
    attributes: ["data-state"],
    isActive: (item) => item.getAttribute("data-state") === "active",
    surface: (container) =>
      container.getAttribute("data-variant") === "line" ? "after" : "background",
    spring: SPRING_TABS,
  },
  sidebar: {
    itemSelector: '[data-slot="sidebar-menu-button"]',
    containerSelector: '[data-slot="sidebar-menu"]',
    attributes: ["data-active"],
    isActive: (item) => item.getAttribute("data-active") === "true",
    surface: () => "background",
    spring: SPRING_LAYOUT,
  },
  pagination: {
    itemSelector: '[data-slot="pagination-link"]',
    containerSelector: '[data-slot="pagination-content"]',
    attributes: ["aria-current"],
    isActive: (item) => item.getAttribute("aria-current") === "page",
    surface: () => "background",
    spring: SPRING_LAYOUT,
  },
  suggestions: {
    itemSelector: '[role="option"]',
    containerSelector: '[role="listbox"]',
    attributes: ["aria-selected"],
    isActive: (item) => item.getAttribute("aria-selected") === "true",
    surface: () => "background",
    spring: SPRING_HIGHLIGHT,
    instantOnPointer: true,
  },
  menu: {
    itemSelector: '[role="menuitem"],[role="menuitemcheckbox"],[role="menuitemradio"],[role="option"]',
    containerSelector: '[role="menu"],[role="listbox"]',
    attributes: ["data-highlighted"],
    isActive: (item) => item.hasAttribute("data-highlighted"),
    surface: () => "background",
    spring: SPRING_HIGHLIGHT,
    instantOnPointer: true,
  },
} satisfies Record<string, GlidePreset>;

export type GlidePresetName = keyof typeof GLIDE_PRESETS;

/** Marks the item whose own highlight is hidden while the travelling copy stands in for it. */
export const GLIDE_TARGET_ATTRIBUTE = "data-glide-target";
/** Marks items whose transitions, including pseudo-element ones, are suspended during a glide. */
export const GLIDE_FREEZE_ATTRIBUTE = "data-glide-freeze";

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Converts a viewport rectangle into the container's scrolling coordinate space. */
function toContainerBox(container: HTMLElement, rect: Box): Box {
  const origin = container.getBoundingClientRect();
  return {
    left: rect.left - origin.left - container.clientLeft + container.scrollLeft,
    top: rect.top - origin.top - container.clientTop + container.scrollTop,
    width: rect.width,
    height: rect.height,
  };
}

/** Translation an item's own running entrance adds, read from its computed `matrix()`. */
function inFlightTranslation(item: Element): { x: number; y: number } {
  const values = /^matrix\(([^)]+)\)$/.exec(getComputedStyle(item).transform);
  if (!values) return { x: 0, y: 0 };
  const parts = values[1]!.split(",").map(Number.parseFloat);
  return { x: parts[4] ?? 0, y: parts[5] ?? 0 };
}

/**
 * Measures the highlight: the item box, or its positioned `::after` bar for line variants.
 * An item still sliding into place (staggered Select options) is measured where it will
 * settle, so the highlight does not land offset and jump when the entrance ends.
 */
function highlightBox(item: Element, surface: GlideSurface): Box {
  const box = item.getBoundingClientRect();
  const offset = inFlightTranslation(item);
  const rect = { left: box.left - offset.x, top: box.top - offset.y, width: box.width, height: box.height };
  if (surface === "background") return rect;
  const pseudo = getComputedStyle(item, "::after");
  return {
    left: rect.left + item.clientLeft + (parseFloat(pseudo.left) || 0),
    top: rect.top + item.clientTop + (parseFloat(pseudo.top) || 0),
    width: parseFloat(pseudo.width) || rect.width,
    height: parseFloat(pseudo.height) || 0,
  };
}

/** Copies only the paint that identifies the highlight, never layout or content. */
function highlightPaint(item: Element, surface: GlideSurface): Partial<CSSStyleDeclaration> {
  const style = getComputedStyle(item, surface === "after" ? "::after" : null);
  return {
    backgroundColor: style.backgroundColor,
    borderRadius: style.borderRadius,
    boxShadow: style.boxShadow,
    borderStyle: style.borderStyle,
    borderWidth: style.borderWidth,
    borderColor: style.borderColor,
    boxSizing: "border-box",
  };
}

/** Tracks overlapping freezes so the caller-owned inline transition is restored exactly once. */
const frozenItems = new WeakMap<HTMLElement, { transition: string; holds: number }>();

/**
 * Suppresses CSS transitions for one item, so state changes paint instantly; the returned
 * release restores them after two painted frames. Overlapping freezes are reference-counted.
 */
function freezeTransitions(item: HTMLElement): () => void {
  const frozen = frozenItems.get(item) ?? { transition: item.style.transition, holds: 0 };
  frozen.holds += 1;
  frozenItems.set(item, frozen);
  item.style.transition = "none";
  item.setAttribute(GLIDE_FREEZE_ATTRIBUTE, "");
  let released = false;
  return () => {
    if (released) return;
    released = true;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        frozen.holds -= 1;
        if (frozen.holds > 0) return;
        frozenItems.delete(item);
        item.style.transition = frozen.transition;
        item.removeAttribute(GLIDE_FREEZE_ATTRIBUTE);
      });
    });
  };
}

/** Observes the container and glides the highlight whenever the active item changes. */
export function attachGlideIndicator(
  container: HTMLElement,
  preset: GlidePreset,
): () => void {
  const items = () =>
    Array.from(container.querySelectorAll<HTMLElement>(preset.itemSelector)).filter(
      (item) => item.parentElement?.closest(preset.containerSelector) === container,
    );
  let lastActive = items().find(preset.isActive) ?? null;
  let lastActiveSeenAt = Number.NEGATIVE_INFINITY;
  let overlay: HTMLElement | null = null;
  let animation: AnimationPlaybackControlsWithThen | null = null;
  let releaseTarget: (() => void) | null = null;
  const containerStyle = {
    position: container.style.position,
    isolation: container.style.isolation,
  };
  // The last input decides whether a highlight change was driven by the pointer or the keyboard.
  // Keyboard focus may live outside the container (a combobox input), so both are read from the
  // document; the pointer only counts while it moves over this container.
  let isPointerDriven = false;
  const onPointerMove = () => {
    isPointerDriven = true;
  };
  const onKeyDown = () => {
    isPointerDriven = false;
  };
  if (preset.instantOnPointer) {
    container.addEventListener("pointermove", onPointerMove);
    container.ownerDocument.addEventListener("keydown", onKeyDown, true);
  }

  /** Puts the item's own highlight back and removes the travelling copy. */
  function settle() {
    animation?.cancel();
    animation = null;
    overlay?.remove();
    overlay = null;
    releaseTarget?.();
    releaseTarget = null;
    container.style.position = containerStyle.position;
    container.style.isolation = containerStyle.isolation;
  }

  /** Hides the frozen target's highlight so the copy is the only one visible. */
  function hideTarget(
    item: HTMLElement,
    surface: GlideSurface,
    thaw: () => void,
  ): () => void {
    item.setAttribute(GLIDE_TARGET_ATTRIBUTE, "");
    const inline = {
      backgroundColor: item.style.getPropertyValue("background-color"),
      backgroundPriority: item.style.getPropertyPriority("background-color"),
      boxShadow: item.style.getPropertyValue("box-shadow"),
      boxShadowPriority: item.style.getPropertyPriority("box-shadow"),
      borderColor: item.style.getPropertyValue("border-color"),
      borderPriority: item.style.getPropertyPriority("border-color"),
    };
    if (surface === "background") {
      item.style.setProperty("background-color", "transparent", "important");
      item.style.setProperty("box-shadow", "none", "important");
      item.style.setProperty("border-color", "transparent", "important");
    }
    return () => {
      item.style.setProperty("background-color", inline.backgroundColor, inline.backgroundPriority);
      item.style.setProperty("box-shadow", inline.boxShadow, inline.boxShadowPriority);
      item.style.setProperty("border-color", inline.borderColor, inline.borderPriority);
      // Transitions stay frozen until the restored highlight has painted in place.
      item.removeAttribute(GLIDE_TARGET_ATTRIBUTE);
      thaw();
    };
  }

  /** Starts, or redirects, the glide from the previous highlight to the new active item. */
  function glide(from: HTMLElement, to: HTMLElement) {
    const surface = preset.surface(container);
    const origin = overlay
      ? overlay.getBoundingClientRect()
      : highlightBox(from, surface);
    settle();
    // The previous item drops its highlight instantly: the copy is what leaves it.
    freezeTransitions(from)();
    // Read the target's settled paint before any transition has a chance to start.
    const thawTarget = freezeTransitions(to);
    const destination = toContainerBox(container, highlightBox(to, surface));
    const paint = highlightPaint(to, surface);
    if (destination.width === 0 || destination.height === 0) {
      thawTarget();
      return;
    }

    if (getComputedStyle(container).position === "static") {
      container.style.position = "relative";
    }
    // Negative z-index keeps the copy above the container background and below item content.
    container.style.isolation = "isolate";
    overlay = document.createElement("span");
    overlay.setAttribute("aria-hidden", "true");
    overlay.setAttribute("data-glide-indicator", "");
    Object.assign(overlay.style, paint, {
      position: "absolute",
      pointerEvents: "none",
      zIndex: "-1",
      margin: "0",
    });
    const start = toContainerBox(container, origin);
    container.prepend(overlay);
    releaseTarget = hideTarget(to, surface, thawTarget);
    animation = animate(
      overlay,
      {
        left: [`${start.left}px`, `${destination.left}px`],
        top: [`${start.top}px`, `${destination.top}px`],
        width: [`${start.width}px`, `${destination.width}px`],
        height: [`${start.height}px`, `${destination.height}px`],
      },
      preset.spring,
    );
    const current = animation;
    void current.then(() => {
      if (animation === current) settle();
    });
  }

  const observer = new MutationObserver(() => {
    // Items can be remounted (a sidebar button wrapped in a tooltip after hydration); the
    // highlight then belongs to the item that replaced the detached one.
    if (lastActive && !lastActive.isConnected) {
      lastActive = items().find(preset.isActive) ?? null;
      lastActiveSeenAt = Number.NEGATIVE_INFINITY;
    }
    const active = items().find(preset.isActive) ?? null;
    const now = performance.now();
    if (active && active === lastActive) return;
    if (!active) {
      if (lastActive && lastActiveSeenAt === Number.NEGATIVE_INFINITY) {
        lastActiveSeenAt = now;
      }
      settle();
      return;
    }
    const previous = lastActive;
    const isContinuous =
      previous !== null &&
      previous !== active &&
      previous.isConnected &&
      !preset.isActive(previous) &&
      (lastActiveSeenAt === Number.NEGATIVE_INFINITY ||
        now - lastActiveSeenAt <= GLIDE_CONTINUITY_MS);
    lastActive = active;
    lastActiveSeenAt = Number.NEGATIVE_INFINITY;
    if (isContinuous && !(preset.instantOnPointer && isPointerDriven)) glide(previous, active);
    else settle();
  });
  observer.observe(container, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: preset.attributes,
  });

  return () => {
    observer.disconnect();
    container.removeEventListener("pointermove", onPointerMove);
    container.ownerDocument.removeEventListener("keydown", onKeyDown, true);
    settle();
  };
}
