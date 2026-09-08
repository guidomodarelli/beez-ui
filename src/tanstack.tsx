"use client";

/** Integrates TanStack navigation without making the router a core dependency. */
import { useMemo, type ReactNode } from "react";
import { Link as RouterLink, defaultParseSearch, useRouter } from "@tanstack/react-router";
import { BeezUIProvider as BaseBeezUIProvider, type BeezUIProviderProps as BaseBeezUIProviderProps } from "./providers/native-provider.js";
import type { BeezLinkProps } from "./providers/beez-ui-provider.js";

/** Leaves absolute destinations to the router's built-in external-link handling. */
const ABSOLUTE_URL_PATTERN = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/iu;
/** Uses TanStack's intent preloading only when explicitly requested. */
const INTENT_PRELOAD = "intent";

/** Configures routing hints and shared theme behavior; the consumer owns RouterProvider. */
export interface BeezUIProviderProps {
  children: ReactNode;
  prefetch?: boolean;
  themeOptions?: BaseBeezUIProviderProps["themeOptions"];
}

/** Converts a native href into TanStack's pathname/search/hash options. */
function splitHref(href: string) {
  const hashIndex = href.indexOf("#");
  const beforeHash = hashIndex < 0 ? href : href.slice(0, hashIndex);
  const searchIndex = beforeHash.indexOf("?");
  return {
    pathname: searchIndex < 0 ? beforeHash : beforeHash.slice(0, searchIndex),
    search: searchIndex < 0 ? undefined : beforeHash.slice(searchIndex),
    hash: hashIndex < 0 ? "" : href.slice(hashIndex + 1),
  };
}

/** Combines TanStack links with responsive Unpic images and shared theme behavior. */
export function BeezUIProvider({ children, prefetch = false, themeOptions }: BeezUIProviderProps) {
  const components = useMemo(() => ({
    /** Uses the real router parser so application search configuration remains authoritative. */
    Link: function TanStackLinkAdapter({ href, prefetch: linkPrefetch, ...props }: BeezLinkProps) {
      const router = useRouter();
      const preload = (linkPrefetch ?? prefetch) ? INTENT_PRELOAD : false;
      if (ABSOLUTE_URL_PATTERN.test(href)) return <RouterLink {...props} to={href} preload={preload} />;
      const location = splitHref(href);
      const parseSearch = router.options.parseSearch ?? defaultParseSearch;
      const search = location.search === undefined ? (location.pathname ? {} : true) : parseSearch(location.search);
      return <RouterLink {...props} to={location.pathname || "."} search={search} hash={location.hash} preload={preload} />;
    },
  }), [prefetch]);
  return <BaseBeezUIProvider components={components} themeOptions={themeOptions}>{children}</BaseBeezUIProvider>;
}
