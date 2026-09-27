"use client";

/** Account menu: avatar trigger, account identity and the sign-in or sign-out action. */
import type { ReactNode } from "react";
import { ChevronDownIcon, LogInIcon, LogOutIcon, PlusIcon } from "lucide-react";

import { cn } from "../lib/utils.js";
import { getNameInitials } from "../lib/name-initials.js";
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "./avatar.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu.js";
import { Link } from "./link.js";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip.js";

export type AccountMenuStatus = "authenticated" | "unauthenticated";

const ACCOUNT_MENU_DEFAULT_LABELS = {
  signIn: "Iniciar sesión",
  signOut: "Cerrar sesión",
  trigger: "Menú de cuenta",
} as const;
/** Shown when the name yields no initials, so the avatar never renders empty. */
const DEFAULT_AVATAR_FALLBACK = "?";

export interface AccountMenuLabels {
  signIn?: string;
  signOut?: string;
  /** Accessible name of the trigger button. */
  trigger?: string;
}

export interface AccountMenuClassNames {
  trigger?: string;
  triggerAvatar?: string;
  /** Name and email block of the `sidebar` trigger, for example to hide it in a collapsed sidebar. */
  triggerText?: string;
  triggerName?: string;
  triggerEmail?: string;
  triggerChevron?: string;
  content?: string;
  /** Identity header at the top of the menu. */
  header?: string;
  headerAvatar?: string;
  /** Sign-in and sign-out item. */
  item?: string;
  /** Badge shown while authenticated, when `showStatusBadge` is enabled. */
  connectedBadge?: string;
  /** Badge shown while signed out, when `showStatusBadge` is enabled. */
  disconnectedBadge?: string;
}

export interface AccountMenuProps {
  name: string;
  email: string;
  status: AccountMenuStatus;
  image?: string | null;
  /** Avatar text when there is no image; defaults to the name initials. */
  avatarFallback?: string;
  /** Called by the sign-out item. The menu stays mounted while a returned promise settles. */
  onSignOut: () => void | Promise<void>;
  signOutDisabled?: boolean;
  /** Called by the sign-in item. Ignored when `signInHref` is set. */
  onSignIn?: () => void;
  /** Navigates to a sign-in page through the configured router adapter instead of calling `onSignIn`. */
  signInHref?: string;
  /** `avatar` shows only the avatar; `sidebar` also shows name, email and a chevron. */
  triggerVariant?: "avatar" | "sidebar";
  /** Adds a connected/disconnected badge to the avatar and greys it out while signed out. */
  showStatusBadge?: boolean;
  /** Optional hint shown when hovering or focusing the trigger. */
  tooltipLabel?: ReactNode;
  labels?: AccountMenuLabels;
  classNames?: AccountMenuClassNames;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  /** Extra items rendered between the identity header and the session action. */
  children?: ReactNode;
}

interface AccountAvatarProps {
  name: string;
  image: string | null;
  fallback: string;
  status: AccountMenuStatus;
  showStatusBadge: boolean;
  /** Hides the image from assistive technology when the name is already shown next to it. */
  isDecorative?: boolean;
  className?: string;
  classNames?: AccountMenuClassNames;
}

/**
 * Renders the account avatar with an optional status badge.
 * @param props - Identity, status and class names.
 * @returns The avatar.
 */
function AccountAvatar({ name, image, fallback, status, showStatusBadge, isDecorative = false, className, classNames }: AccountAvatarProps) {
  const isAuthenticated = status === "authenticated";

  return (
    <Avatar className={cn(showStatusBadge && !isAuthenticated && "grayscale", className)}>
      {image ? <AvatarImage alt={isDecorative ? "" : name} loading="eager" src={image} /> : null}
      <AvatarFallback aria-hidden={isDecorative || undefined}>{fallback}</AvatarFallback>
      {showStatusBadge ? (
        <AvatarBadge
          data-status={status}
          className={cn(
            isAuthenticated ? "bg-green-600 dark:bg-green-800" : undefined,
            isAuthenticated ? classNames?.connectedBadge : classNames?.disconnectedBadge,
          )}
        >
          {isAuthenticated ? null : <PlusIcon aria-hidden="true" />}
        </AvatarBadge>
      ) : null}
    </Avatar>
  );
}

/**
 * Presentational account menu: the session and its side effects stay with the caller. Signed in,
 * the menu offers sign-out; signed out, it offers sign-in as a link (`signInHref`) or a callback.
 * @param props - Identity, session status, callbacks, copy and layout.
 * @returns The trigger and its menu.
 */
export function AccountMenu({
  name,
  email,
  status,
  image = null,
  avatarFallback,
  onSignOut,
  signOutDisabled = false,
  onSignIn,
  signInHref,
  triggerVariant = "avatar",
  showStatusBadge = false,
  tooltipLabel,
  labels,
  classNames,
  align = "end",
  side = "bottom",
  sideOffset = 4,
  children,
}: AccountMenuProps) {
  const resolvedLabels = { ...ACCOUNT_MENU_DEFAULT_LABELS, ...labels };
  const isAuthenticated = status === "authenticated";
  const fallback = avatarFallback ?? (getNameInitials(name) || DEFAULT_AVATAR_FALLBACK);
  const avatarProps = { name, image, fallback, status, showStatusBadge, classNames };

  const triggerButton = (
    <button
      data-slot="account-menu-trigger"
      data-variant={triggerVariant}
      aria-label={resolvedLabels.trigger}
      type="button"
      className={cn(
        "inline-flex items-center rounded-full outline-none [-webkit-tap-highlight-color:transparent] transition-[box-shadow,opacity,transform] hover:opacity-90 active:scale-[0.96] focus-visible:shadow-[0_0_0_2px_var(--background),0_0_0_4px_var(--ring)] data-[state=open]:shadow-[0_0_0_2px_var(--background),0_0_0_4px_var(--ring)]",
        triggerVariant === "sidebar" && "w-full min-w-0 gap-2.5 rounded-lg p-1.5 text-left",
        classNames?.trigger,
      )}
    >
      <AccountAvatar {...avatarProps} className={classNames?.triggerAvatar} />
      {triggerVariant === "sidebar" ? (
        <>
          <span className={cn("grid min-w-0 flex-1", classNames?.triggerText)}>
            <span className={cn("truncate text-sm font-semibold", classNames?.triggerName)}>{name}</span>
            <span className={cn("truncate text-xs text-muted-foreground", classNames?.triggerEmail)}>{email}</span>
          </span>
          <ChevronDownIcon aria-hidden="true" className={cn("size-4 shrink-0 text-muted-foreground", classNames?.triggerChevron)} />
        </>
      ) : null}
    </button>
  );
  const trigger = <DropdownMenuTrigger asChild>{triggerButton}</DropdownMenuTrigger>;

  const menu = (
    <DropdownMenu>
      {tooltipLabel ? <TooltipTrigger asChild>{trigger}</TooltipTrigger> : trigger}
      <DropdownMenuContent
        data-slot="account-menu-content"
        align={align}
        side={side}
        sideOffset={sideOffset}
        className={cn("min-w-56", classNames?.content)}
      >
        <div className={cn("grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5 px-2 py-1.5", classNames?.header)}>
          <AccountAvatar {...avatarProps} isDecorative className={classNames?.headerAvatar} />
          <span className="grid min-w-0 gap-px">
            <span className="truncate text-sm leading-tight font-semibold">{name}</span>
            <span className="truncate text-xs leading-tight text-muted-foreground">{email}</span>
          </span>
        </div>
        <DropdownMenuSeparator />
        {children}
        {isAuthenticated ? (
          <DropdownMenuItem className={classNames?.item} disabled={signOutDisabled} onSelect={() => void onSignOut()}>
            <LogOutIcon aria-hidden="true" />
            {resolvedLabels.signOut}
          </DropdownMenuItem>
        ) : signInHref ? (
          <DropdownMenuItem asChild className={classNames?.item}>
            <Link href={signInHref}>
              <LogInIcon aria-hidden="true" />
              {resolvedLabels.signIn}
            </Link>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem className={classNames?.item} onSelect={() => onSignIn?.()}>
            <LogInIcon aria-hidden="true" />
            {resolvedLabels.signIn}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (!tooltipLabel) return menu;

  return (
    <Tooltip>
      {menu}
      <TooltipContent side="bottom" sideOffset={8}>
        {tooltipLabel}
      </TooltipContent>
    </Tooltip>
  );
}
