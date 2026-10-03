"use client";

/**
 * Animated application sidebar adapted from beui.dev/components/motion/animated-sidebar: the rail
 * morphs its width with a spring, labels fade out of the icon rail, a shared pill follows the
 * hovered and active items, submenus unfold with a stagger, and small screens get a focus-trapped
 * sheet. Links route through the `BeezUIProvider` adapter and the open state keeps the
 * `sidebar_state` cookie contract read by server entrypoints.
 */
import * as React from "react";
import { ChevronRight, PanelLeftIcon } from "lucide-react";
import {
  AnimatePresence,
  motion,
  type HTMLMotionProps,
  type Variants,
} from "motion/react";
import { createPortal } from "react-dom";

import { useIsHydrated } from "../hooks/use-is-hydrated.js";
import { useIsMobile } from "../hooks/use-mobile.js";
import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js";
import {
  saveSidebarCookie,
  saveSidebarPreference,
  useSidebarPersistence,
} from "../hooks/use-sidebar-persistence.js";
import { cn } from "../lib/utils.js";
import { MotionSlot } from "../motion/motion-slot.js";
import { SharedLayoutBg } from "../motion/shared-layout-bg.js";
import {
  MOTION_EASE,
  MOTION_EASE_DRAWER,
  MOTION_LIST_ITEM_DISTANCE,
  MOTION_TIMING,
  SPRING_LAYOUT,
} from "../motion/tokens.js";
import { Link } from "./link.js";

type SidebarState = "expanded" | "collapsed";
type SidebarSide = "left" | "right";
type SidebarVariant = "sidebar" | "floating" | "inset";
type SidebarCollapsible = "offcanvas" | "icon" | "none";
type SidebarLinkTarget = "_blank" | "_self" | "_parent" | "_top";

const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_ICON = "4.25rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";
const EXTERNAL_LINK_TARGET = "_blank";
const EXTERNAL_LINK_REL = "noreferrer noopener";
/** Distance, in pixels, labels and chevrons drift while fading out of the icon rail. */
const SIDEBAR_LABEL_DRIFT_PX = 4;
/** Chevron rotation, in degrees, of an expanded group. */
const SIDEBAR_CHEVRON_EXPANDED_DEGREES = 90;
/** Blur, in pixels, submenu items shed as they unfold. */
const SIDEBAR_SUBMENU_ITEM_BLUR_PX = 3;

const PANEL_TRANSITION = {
  duration: 0.36,
  ease: MOTION_EASE_DRAWER,
} as const;

/**
 * The desktop rail settles at a hard zero-width boundary. Keep the spring critically damped so it
 * cannot overshoot, pause against that boundary, and then snap back during the final frame.
 */
const SIDEBAR_MORPH_TRANSITION = {
  type: "spring",
  stiffness: 380,
  damping: 35,
  mass: 0.75,
} as const;

const LABEL_ENTER_TRANSITION = {
  duration: MOTION_TIMING.message,
  delay: 0.08,
  ease: MOTION_EASE,
} as const;

const LABEL_EXIT_TRANSITION = {
  duration: MOTION_TIMING.exit,
  ease: MOTION_EASE,
} as const;

const REDUCED_TRANSITION = {
  duration: 0.16,
  ease: MOTION_EASE,
} as const;

const INSTANT_TRANSITION = { duration: 0 } as const;

const SUBMENU_VARIANTS: Variants = {
  closed: {
    opacity: 0,
    clipPath: "inset(0 0 100% 0 round 8px)",
    transition: {
      duration: MOTION_TIMING.fast,
      ease: MOTION_EASE,
      staggerChildren: 0.025,
      staggerDirection: -1,
    },
  },
  open: {
    opacity: 1,
    clipPath: "inset(0 0 0% 0 round 8px)",
    transition: {
      duration: MOTION_TIMING.message,
      delayChildren: MOTION_TIMING.listStagger,
      ease: MOTION_EASE,
      staggerChildren: 0.045,
    },
  },
};

const SUBMENU_ITEM_VARIANTS: Variants = {
  closed: {
    opacity: 0,
    y: -MOTION_LIST_ITEM_DISTANCE,
    filter: `blur(${SIDEBAR_SUBMENU_ITEM_BLUR_PX}px)`,
  },
  open: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: MOTION_TIMING.enter, ease: MOTION_EASE },
  },
};

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

type SidebarContextValue = {
  isMobile: boolean;
  layoutId: string;
  /** Sheet width; the sheet is portaled outside the wrapper that declares the CSS variables. */
  mobileWidth: string;
  open: boolean;
  openMobile: boolean;
  reduce: boolean;
  setOpen: (open: boolean) => void;
  setOpenMobile: (open: boolean) => void;
  state: SidebarState;
  toggleSidebar: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
};

const SidebarContext =
  React.createContext<SidebarContextValue | null>(null);

type SidebarPanelContextValue = {
  collapsed: boolean;
  collapsible: SidebarCollapsible;
  side: SidebarSide;
};

const SidebarPanelContext =
  React.createContext<SidebarPanelContextValue | null>(null);

/**
 * Reads the sidebar state shared by `SidebarProvider`.
 * @returns Open state for desktop and mobile, viewport and motion flags, and state setters.
 */
function useSidebar() {
  const context = React.use(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}

function useSidebarPanel() {
  const context = React.use(SidebarPanelContext);
  if (!context) {
    throw new Error("Sidebar parts must be used within an Sidebar.");
  }
  return context;
}

type SidebarProviderStyle = React.CSSProperties & {
  "--sidebar-width"?: string;
  "--sidebar-width-icon"?: string;
  "--sidebar-width-mobile"?: string;
};

export type SidebarProviderProps = React.ComponentProps<"div"> & {
  /** Controlled desktop state. */
  open?: boolean;
  /** Desktop state before any interaction; server entrypoints pass the `sidebar_state` cookie here. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Controlled state of the small-screen sheet. */
  openMobile?: boolean;
  defaultOpenMobile?: boolean;
  onOpenMobileChange?: (open: boolean) => void;
  /** Opts into local persistence without changing the shared SSR cookie contract. */
  storageKey?: string;
  style?: SidebarProviderStyle;
};

/**
 * Owns the open state of the sidebar, the ⌘B / Ctrl+B shortcut and the layout wrapper.
 * @param props - Controlled or default state for both viewports, persistence key and wrapper attributes.
 * @returns The wrapper that lays out the sidebar next to its inset.
 */
function SidebarProvider({
  children,
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  openMobile: openMobileProp,
  defaultOpenMobile = false,
  onOpenMobileChange,
  storageKey,
  className,
  style,
  ...props
}: SidebarProviderProps) {
  const [internalOpen, setInternalOpen] = React.useState<boolean | null>(null);
  const [internalOpenMobile, setInternalOpenMobile] = React.useState(defaultOpenMobile);
  const persistedOpen = useSidebarPersistence(storageKey);
  const isMobile = useIsMobile();
  const reduce = usePrefersReducedMotion();
  const generatedId = React.useId();
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const open = openProp ?? internalOpen ?? persistedOpen ?? defaultOpen;
  const openMobile = openMobileProp ?? internalOpenMobile;
  const state: SidebarState = open ? "expanded" : "collapsed";
  const mobileWidth = style?.["--sidebar-width-mobile"] ?? SIDEBAR_WIDTH_MOBILE;

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (openProp === undefined) setInternalOpen(nextOpen);
      onOpenChange?.(nextOpen);
      saveSidebarPreference(storageKey, nextOpen);
      saveSidebarCookie(nextOpen);
    },
    [onOpenChange, openProp, storageKey],
  );

  const setOpenMobile = React.useCallback(
    (nextOpen: boolean) => {
      if (openMobileProp === undefined) setInternalOpenMobile(nextOpen);
      onOpenMobileChange?.(nextOpen);
    },
    [onOpenMobileChange, openMobileProp],
  );

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) setOpenMobile(!openMobile);
    else setOpen(!open);
  }, [isMobile, open, openMobile, setOpen, setOpenMobile]);

  React.useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [toggleSidebar]);

  const contextValue = React.useMemo<SidebarContextValue>(
    () => ({
      isMobile,
      layoutId: `${generatedId}-active`,
      mobileWidth,
      open,
      openMobile,
      reduce,
      setOpen,
      setOpenMobile,
      state,
      toggleSidebar,
      triggerRef,
    }),
    [generatedId, isMobile, mobileWidth, open, openMobile, reduce, setOpen, setOpenMobile, state, toggleSidebar],
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        {...props}
        data-slot="sidebar-wrapper"
        data-state={state}
        style={{
          "--sidebar-width": SIDEBAR_WIDTH,
          "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
          "--sidebar-width-mobile": mobileWidth,
          ...style,
        }}
        className={cn(
          "group/sidebar-wrapper flex min-h-svh w-full min-w-0 has-data-[variant=inset]:bg-sidebar",
          className,
        )}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

type MobileSidebarProps = {
  ariaLabel: string;
  children: React.ReactNode;
  className?: string;
  side: SidebarSide;
};

/** Small-screen sheet: locks page scroll, traps focus and hands it back to the trigger on close. */
function MobileSidebar({ ariaLabel, children, className, side }: MobileSidebarProps) {
  const context = useSidebar();
  const isHydrated = useIsHydrated();
  const panelRef = React.useRef<HTMLDivElement>(null);
  // The sheet is mounted for as long as the viewport is mobile, so it hides
  // itself while closed rather than sitting there transparent and interactive.
  // Opening shows it in the same commit that starts the slide — a delayed show
  // would run the focus effect below against a still-hidden panel, and focus()
  // on a hidden element is ignored. Closing waits for the slide to finish, and
  // the panel's own exit tells us when that is: no duration to keep in sync.
  const [hidden, setHidden] = React.useState(!context.openMobile);
  // The completion callback fires for the open slide too, and it reads state
  // from whenever motion settles: a ref keeps it on the current one.
  const openMobileRef = React.useRef(context.openMobile);
  const { mobileWidth, openMobile, reduce, setOpenMobile, triggerRef } = context;

  React.useEffect(() => {
    openMobileRef.current = openMobile;
    if (openMobile) setHidden(false);
  }, [openMobile]);

  React.useEffect(() => {
    if (!openMobile) return;

    const body = document.body;
    const scrollY = window.scrollY;
    const previousBodyStyles = {
      left: body.style.left,
      overflow: body.style.overflow,
      position: body.style.position,
      right: body.style.right,
      top: body.style.top,
    };

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.overflow = "hidden";

    // Focus returns to whichever trigger is mounted when the sheet closes, not the one present on open.
    const restoreTriggerFocus = () => triggerRef.current?.focus({ preventScroll: true });
    const focusFrame = requestAnimationFrame(() => {
      const firstFocusable = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (firstFocusable ?? panelRef.current)?.focus({ preventScroll: true });
    });

    return () => {
      cancelAnimationFrame(focusFrame);
      body.style.position = previousBodyStyles.position;
      body.style.top = previousBodyStyles.top;
      body.style.left = previousBodyStyles.left;
      body.style.right = previousBodyStyles.right;
      body.style.overflow = previousBodyStyles.overflow;
      window.scrollTo(0, scrollY);
      restoreTriggerFocus();
    };
  }, [openMobile, triggerRef]);

  if (!isHydrated) return null;

  const closedOffset = side === "left" ? "-100%" : "100%";
  const transition = reduce ? REDUCED_TRANSITION : PANEL_TRANSITION;

  const trapFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpenMobile(false);
      return;
    }

    if (event.key !== "Tab") return;
    const focusable = panelRef.current
      ? Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      : [];

    if (focusable.length === 0) {
      event.preventDefault();
      panelRef.current?.focus();
      return;
    }

    const firstFocusable = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === firstFocusable) {
      event.preventDefault();
      lastFocusable.focus();
    } else if (!event.shiftKey && document.activeElement === lastFocusable) {
      event.preventDefault();
      firstFocusable.focus();
    }
  };

  // This container groups the sheet for hiding and the z-index and carries no
  // box: both children are `fixed` and resolve against the viewport themselves.
  return createPortal(
    <div
      className={cn(
        "pointer-events-none fixed top-0 left-0 z-50 size-0 md:hidden",
        hidden && !openMobile ? "invisible" : "visible",
      )}
    >
      <motion.button
        type="button"
        aria-label="Close sidebar"
        data-slot="sidebar-overlay"
        tabIndex={openMobile ? 0 : -1}
        initial={false}
        animate={{ opacity: openMobile ? 1 : 0 }}
        transition={transition}
        onClick={() => setOpenMobile(false)}
        className={cn(
          "fixed inset-0 bg-black/40",
          openMobile ? "pointer-events-auto" : "pointer-events-none",
        )}
      />

      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-hidden={!openMobile}
        inert={!openMobile}
        tabIndex={-1}
        data-slot="sidebar"
        data-mobile="true"
        data-state={openMobile ? "expanded" : "collapsed"}
        data-side={side}
        initial={false}
        animate={{
          opacity: reduce ? (openMobile ? 1 : 0) : 1,
          x: reduce ? 0 : openMobile ? "0%" : closedOffset,
        }}
        transition={transition}
        onAnimationComplete={() => {
          if (!openMobileRef.current) setHidden(true);
        }}
        onKeyDown={trapFocus}
        style={{ "--sidebar-width-mobile": mobileWidth } as React.CSSProperties}
        className={cn(
          "pointer-events-auto fixed inset-y-0 flex h-dvh w-(--sidebar-width-mobile) max-w-[88vw] flex-col overflow-hidden outline-none",
          "border-sidebar-border bg-sidebar text-sidebar-foreground shadow-2xl will-change-transform",
          side === "left" ? "left-0 border-r" : "right-0 border-l",
          !openMobile && "pointer-events-none",
          className,
        )}
      >
        <SidebarPanelContext.Provider
          value={{ collapsed: false, collapsible: "none", side }}
        >
          {children}
        </SidebarPanelContext.Provider>
      </motion.div>
    </div>,
    document.body,
  );
}

export type SidebarProps = Omit<HTMLMotionProps<"aside">, "children"> & {
  children?: React.ReactNode;
  side?: SidebarSide;
  variant?: SidebarVariant;
  /** `icon` shrinks to an icon rail, `offcanvas` slides away, `none` stays expanded on every viewport. */
  collapsible?: SidebarCollapsible;
  ariaLabel?: string;
  /** Classes of the inner panel that paints the sidebar surface. */
  panelClassName?: string;
};

/**
 * Renders the sidebar: a width-morphing rail on desktop and a sheet on small screens.
 * @param props - Side, variant, collapse mode, accessible name and panel classes.
 * @returns The desktop rail, the mobile sheet portal, or an always-expanded panel.
 */
function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "icon",
  ariaLabel = "Sidebar",
  children,
  className,
  panelClassName,
  style,
  ...props
}: SidebarProps) {
  const context = useSidebar();
  const collapsed = collapsible !== "none" && !context.open;
  const offcanvas = collapsed && collapsible === "offcanvas";
  const width = offcanvas
    ? "0px"
    : collapsed
      ? "var(--sidebar-width-icon)"
      : "var(--sidebar-width)";

  if (context.isMobile && collapsible !== "none") {
    return (
      <MobileSidebar ariaLabel={ariaLabel} className={className} side={side}>
        {children}
      </MobileSidebar>
    );
  }

  return (
    <motion.aside
      {...props}
      initial={false}
      aria-label={ariaLabel}
      data-slot="sidebar"
      data-state={collapsed ? "collapsed" : "expanded"}
      data-collapsible={collapsible}
      data-variant={variant}
      data-side={side}
      animate={{ width }}
      transition={context.reduce ? INSTANT_TRANSITION : SIDEBAR_MORPH_TRANSITION}
      style={style}
      className={cn(
        "group/sidebar peer relative h-auto shrink-0 text-sidebar-foreground will-change-[width]",
        collapsible === "none" ? "block" : "hidden md:block",
        side === "right" && "order-last",
        className,
      )}
    >
      <motion.div
        initial={false}
        animate={{
          opacity: offcanvas ? 0 : 1,
          x: offcanvas ? (side === "left" ? "-100%" : "100%") : "0%",
        }}
        transition={context.reduce ? REDUCED_TRANSITION : PANEL_TRANSITION}
        data-slot="sidebar-inner"
        className={cn(
          "sticky top-0 flex h-svh w-full flex-col overflow-hidden bg-sidebar",
          collapsible === "offcanvas" && "w-(--sidebar-width)",
          collapsible === "none" && "h-auto",
          variant === "sidebar" &&
            (side === "left" ? "border-r border-sidebar-border" : "border-l border-sidebar-border"),
          variant === "floating" &&
            "m-2 h-[calc(100svh-1rem)] rounded-2xl border border-sidebar-border shadow-sm",
          variant === "inset" && "m-2 h-[calc(100svh-1rem)] rounded-2xl",
          panelClassName,
        )}
      >
        <SidebarPanelContext.Provider value={{ collapsed, collapsible, side }}>
          {children}
        </SidebarPanelContext.Provider>
      </motion.div>
    </motion.aside>
  );
}

/**
 * Button that toggles the desktop rail or the mobile sheet; shows a panel icon unless given children.
 * @param props - Native button attributes.
 * @returns The toggle button.
 */
function SidebarTrigger({
  children,
  className,
  onClick,
  ref,
  type = "button",
  ...props
}: React.ComponentProps<"button">) {
  const context = useSidebar();
  const expanded = context.isMobile ? context.openMobile : context.open;

  return (
    <button
      {...props}
      ref={(node) => {
        context.triggerRef.current = node;
        if (typeof ref === "function") return ref(node);
        if (ref) ref.current = node;
      }}
      type={type}
      aria-label={props["aria-label"] ?? "Toggle sidebar"}
      aria-expanded={expanded}
      data-slot="sidebar-trigger"
      data-state={expanded ? "expanded" : "collapsed"}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) context.toggleSidebar();
      }}
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-xl outline-none [&_svg]:size-4",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      {children ?? <PanelLeftIcon aria-hidden="true" />}
    </button>
  );
}

/**
 * Button that closes the sidebar on the current viewport.
 * @param props - Native button attributes; the content is the consumer's icon or text.
 * @returns The close button.
 */
function SidebarClose({
  className,
  onClick,
  type = "button",
  ...props
}: React.ComponentProps<"button">) {
  const context = useSidebar();

  return (
    <button
      {...props}
      type={type}
      aria-label={props["aria-label"] ?? "Close sidebar"}
      data-slot="sidebar-close"
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (context.isMobile) context.setOpenMobile(false);
        else context.setOpen(false);
      }}
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-xl outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    />
  );
}

/**
 * Thin hit area on the sidebar edge that toggles it with the pointer.
 * @param props - Native button attributes.
 * @returns The rail button, outside the tab order.
 */
function SidebarRail({
  className,
  onClick,
  type = "button",
  ...props
}: React.ComponentProps<"button">) {
  const context = useSidebar();
  const panel = useSidebarPanel();

  return (
    <button
      {...props}
      type={type}
      data-slot="sidebar-rail"
      data-side={panel.side}
      aria-label={props["aria-label"] ?? "Toggle sidebar"}
      title="Toggle sidebar"
      tabIndex={-1}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) context.toggleSidebar();
      }}
      className={cn(
        "absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 outline-none md:block",
        "after:absolute after:inset-y-0 after:left-1/2 after:w-px after:bg-transparent after:transition-colors hover:after:bg-sidebar-border",
        "data-[side=left]:left-full data-[side=right]:right-0 data-[side=right]:translate-x-1/2",
        className,
      )}
    />
  );
}

/**
 * Main content area laid out next to the sidebar.
 * @param props - Motion-enabled `main` attributes.
 * @returns The content landmark.
 */
function SidebarInset({ className, ...props }: HTMLMotionProps<"main">) {
  return (
    <motion.main
      {...props}
      data-slot="sidebar-inset"
      className={cn(
        "relative flex min-h-svh min-w-0 flex-1 flex-col bg-background",
        "md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-2xl md:peer-data-[variant=inset]:shadow-sm",
        className,
      )}
    />
  );
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      {...props}
      data-slot="sidebar-header"
      className={cn("flex shrink-0 flex-col gap-2 p-3", className)}
    />
  );
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      {...props}
      data-slot="sidebar-content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-x-hidden overflow-y-auto overscroll-contain px-2 py-2",
        className,
      )}
    />
  );
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      {...props}
      data-slot="sidebar-footer"
      className={cn(
        "flex shrink-0 flex-col gap-2 border-t border-sidebar-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        className,
      )}
    />
  );
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      {...props}
      data-slot="sidebar-group"
      className={cn("flex w-full min-w-0 flex-col px-1 py-1.5", className)}
    />
  );
}

/** Section heading that fades out of the icon rail and is hidden from assistive technology there. */
function SidebarGroupLabel({ className, ...props }: React.ComponentProps<"div">) {
  const { collapsed } = useSidebarPanel();

  return (
    <div
      {...props}
      aria-hidden={collapsed}
      data-slot="sidebar-group-label"
      className={cn(
        "mb-1 h-7 overflow-hidden px-2 text-[10px] font-medium tracking-[0.14em] text-sidebar-foreground/70 uppercase transition-opacity",
        collapsed ? "opacity-0" : "opacity-100",
        className,
      )}
    />
  );
}

function SidebarGroupContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      {...props}
      data-slot="sidebar-group-content"
      className={cn("w-full min-w-0", className)}
    />
  );
}

/** Menu list whose items share a hover pill that glides between them. */
function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <SharedLayoutBg
      {...props}
      inset={0}
      pillClassName="rounded-xl bg-sidebar-accent/70"
      pillContainerClassName="inset-y-auto top-0 h-9"
      data-slot="sidebar-menu"
      className={cn("flex w-full min-w-0 list-none flex-col gap-0.5", className)}
    />
  );
}

function SidebarMenuItem({ className, ...props }: HTMLMotionProps<"li">) {
  return (
    <motion.li
      {...props}
      layout="position"
      transition={SPRING_LAYOUT}
      data-slot="sidebar-menu-item"
      className={cn("relative", className)}
    />
  );
}

export type SidebarMenuSubProps = Omit<HTMLMotionProps<"ul">, "children"> & {
  /** Whether the submenu is unfolded; it never renders inside the icon rail. */
  open: boolean;
  children?: React.ReactNode;
};

/**
 * Nested list that unfolds with a clip and staggered items.
 * @param props - Open state and motion-enabled list attributes.
 * @returns The submenu while open and the sidebar is expanded.
 */
function SidebarMenuSub({ open, children, className, ...props }: SidebarMenuSubProps) {
  const context = useSidebar();
  const panel = useSidebarPanel();

  return (
    <AnimatePresence initial={false} mode="popLayout">
      {open && !panel.collapsed ? (
        <motion.ul
          {...props}
          key="sidebar-submenu"
          variants={context.reduce ? undefined : SUBMENU_VARIANTS}
          initial={context.reduce ? false : "closed"}
          animate={context.reduce ? { opacity: 1 } : "open"}
          exit={context.reduce ? { opacity: 0 } : "closed"}
          transition={context.reduce ? { duration: MOTION_TIMING.exit } : undefined}
          data-slot="sidebar-menu-sub"
          className={cn(
            "relative mt-1 ml-5 flex min-w-0 flex-col gap-0.5 border-l border-sidebar-border pl-3",
            className,
          )}
        >
          {children}
        </motion.ul>
      ) : null}
    </AnimatePresence>
  );
}

function SidebarMenuSubItem({ className, ...props }: HTMLMotionProps<"li">) {
  return (
    <motion.li
      {...props}
      variants={SUBMENU_ITEM_VARIANTS}
      data-slot="sidebar-menu-sub-item"
      className={cn("relative min-w-0", className)}
    />
  );
}

type SidebarActionProps = {
  children: React.ReactNode;
  icon?: React.ReactNode;
  /** Renders a link through the `BeezUIProvider` routing adapter instead of a button. */
  href?: string;
  isActive?: boolean;
  disabled?: boolean;
  target?: SidebarLinkTarget;
  rel?: string;
  onSelect?: () => void;
  className?: string;
};

type SidebarPressableProps = Pick<SidebarActionProps, "href" | "disabled" | "target" | "rel"> & {
  slot: string;
  isActive: boolean;
  ariaExpanded?: boolean;
  ariaLabel?: string;
  title?: string;
  className: string;
  children: React.ReactNode;
  onClick: (event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void;
};

/** Renders a menu action as a routed link or a button, both with the subtle press feedback. */
function SidebarPressable({
  slot,
  href,
  disabled,
  target,
  rel,
  isActive,
  ariaExpanded,
  ariaLabel,
  title,
  className,
  children,
  onClick,
}: SidebarPressableProps) {
  const sharedProps = {
    "data-slot": slot,
    "data-active": isActive,
    "aria-current": isActive ? ("page" as const) : undefined,
    "aria-expanded": ariaExpanded,
    "aria-label": ariaLabel,
    title,
    className,
    onClick,
  };
  const element = href ? (
    <Link
      {...sharedProps}
      href={href}
      target={target}
      rel={rel ?? (target === EXTERNAL_LINK_TARGET ? EXTERNAL_LINK_REL : undefined)}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
    >
      {children}
    </Link>
  ) : (
    <button {...sharedProps} type="button" disabled={disabled}>
      {children}
    </button>
  );
  return disabled ? element : <MotionSlot kind="subtle-press">{element}</MotionSlot>;
}

export type SidebarMenuSubButtonProps = SidebarActionProps & {
  /** Closes the mobile sheet after selecting; on by default. */
  closeOnSelect?: boolean;
};

/**
 * Submenu entry; shows a dot when no icon is given.
 * @param props - Label, icon, link or select handler, active and disabled state.
 * @returns The submenu link or button.
 */
function SidebarMenuSubButton({
  children,
  icon,
  href,
  isActive = false,
  disabled = false,
  closeOnSelect = true,
  target,
  rel,
  onSelect,
  className,
}: SidebarMenuSubButtonProps) {
  const context = useSidebar();

  const select = (event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    onSelect?.();
    if (context.isMobile && closeOnSelect) context.setOpenMobile(false);
  };

  return (
    <SidebarPressable
      slot="sidebar-menu-sub-button"
      href={href}
      disabled={disabled}
      target={target}
      rel={rel}
      isActive={isActive}
      onClick={select}
      className={cn(
        "flex min-h-8 w-full min-w-0 items-center gap-2 rounded-lg px-2 text-left text-xs outline-none",
        "text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
        "focus-visible:bg-sidebar-accent/70 focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        isActive && "bg-sidebar-accent/70 text-sidebar-accent-foreground",
        disabled && "cursor-not-allowed opacity-40",
        className,
      )}
    >
      <span aria-hidden="true" className="grid size-4 shrink-0 place-items-center">
        {icon ?? <span className="size-1 rounded-full bg-current" />}
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </SidebarPressable>
  );
}

export type SidebarMenuButtonProps = SidebarActionProps & {
  /** Trailing content such as a counter, hidden in the icon rail. */
  badge?: React.ReactNode;
  /** Marks the button as a submenu toggle and shows a rotating chevron. */
  ariaExpanded?: boolean;
  /** Closes the mobile sheet after selecting; defaults to on, except for submenu toggles. */
  closeOnSelect?: boolean;
};

/**
 * Top-level menu entry: the active one carries a pill that glides between entries, and the label
 * fades out of the icon rail, leaving a string label as accessible name and native tooltip.
 * @param props - Label, icon, badge, link or select handler, submenu and active state.
 * @returns The menu link or button.
 */
function SidebarMenuButton({
  children,
  icon,
  badge,
  href,
  isActive = false,
  ariaExpanded,
  disabled = false,
  closeOnSelect,
  target,
  rel,
  onSelect,
  className,
}: SidebarMenuButtonProps) {
  const context = useSidebar();
  const panel = useSidebarPanel();
  const textLabel = typeof children === "string" ? children : undefined;
  const collapsedLabel = panel.collapsed ? textLabel : undefined;

  const select = (event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    onSelect?.();
    const shouldCloseOnSelect = closeOnSelect ?? ariaExpanded === undefined;
    if (context.isMobile && shouldCloseOnSelect) context.setOpenMobile(false);
    // A submenu cannot render in the icon rail, so opening one from there
    // leaves its children unreachable — a pointer can still fall back to the
    // rail or the shortcut, a finger has nothing. Selecting a group unfolds
    // the panel that is about to hold it.
    if (ariaExpanded !== undefined && panel.collapsed && !context.isMobile) {
      context.setOpen(true);
    }
  };

  return (
    <SidebarPressable
      slot="sidebar-menu-button"
      href={href}
      disabled={disabled}
      target={target}
      rel={rel}
      isActive={isActive}
      ariaExpanded={ariaExpanded}
      ariaLabel={collapsedLabel}
      title={collapsedLabel}
      onClick={select}
      className={cn(
        "relative flex min-h-9 w-full min-w-0 items-center gap-2.5 overflow-hidden rounded-xl px-3 text-left text-sm font-medium outline-none",
        "text-sidebar-foreground/70 transition-colors hover:text-sidebar-accent-foreground",
        "focus-visible:bg-sidebar-accent/70 focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        isActive && "text-sidebar-accent-foreground",
        disabled && "cursor-not-allowed opacity-40",
        className,
      )}
    >
      {isActive ? (
        <motion.span
          data-slot="sidebar-menu-active-indicator"
          layoutId={context.layoutId}
          transition={context.reduce ? INSTANT_TRANSITION : SPRING_LAYOUT}
          className="absolute inset-0 rounded-xl bg-sidebar-accent"
        />
      ) : null}
      {icon ? (
        <span
          aria-hidden="true"
          className="relative z-10 grid size-5 shrink-0 place-items-center [&_svg]:size-4"
        >
          {icon}
        </span>
      ) : null}
      <motion.span
        initial={false}
        animate={{
          opacity: panel.collapsed ? 0 : 1,
          x: panel.collapsed ? -SIDEBAR_LABEL_DRIFT_PX : 0,
        }}
        transition={
          context.reduce
            ? REDUCED_TRANSITION
            : panel.collapsed
              ? LABEL_EXIT_TRANSITION
              : LABEL_ENTER_TRANSITION
        }
        aria-hidden={panel.collapsed}
        className={cn(
          "relative z-10 min-w-0 flex-1 truncate",
          panel.collapsed && "pointer-events-none",
        )}
      >
        {children}
      </motion.span>
      {badge && !panel.collapsed ? (
        <span className="relative z-10 shrink-0 text-xs text-sidebar-foreground/70">
          {badge}
        </span>
      ) : null}
      {ariaExpanded !== undefined ? (
        <motion.span
          aria-hidden="true"
          initial={false}
          animate={{
            opacity: panel.collapsed ? 0 : 1,
            rotate: ariaExpanded ? SIDEBAR_CHEVRON_EXPANDED_DEGREES : 0,
            x: panel.collapsed ? SIDEBAR_LABEL_DRIFT_PX : 0,
          }}
          transition={context.reduce ? INSTANT_TRANSITION : SPRING_LAYOUT}
          className="relative z-10 grid size-4 shrink-0 place-items-center text-sidebar-foreground/70"
        >
          <ChevronRight className="size-3.5" />
        </motion.span>
      ) : null}
    </SidebarPressable>
  );
}

export {
  Sidebar,
  SidebarClose,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
};
