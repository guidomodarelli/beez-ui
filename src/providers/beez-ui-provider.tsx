"use client";

/** Shares optional rendering adapters without importing a framework into the core. */
import { createContext, useContext, useMemo, type ComponentProps, type ComponentType, type ReactNode } from "react";

/** Defines the native link contract accepted by routing adapters. */
export type BeezLinkProps = ComponentProps<"a"> & { href: string };
/** Defines the native image contract accepted by image adapters. */
export type BeezImageProps = ComponentProps<"img">;
/** Lets each application select only the adapters it needs. */
export interface BeezUIComponents {
  Link?: ComponentType<BeezLinkProps>;
  Image?: ComponentType<BeezImageProps>;
}
/** Configures descendants while leaving theme and application state to the consumer. */
export interface BeezUIProviderProps {
  children: ReactNode;
  components?: BeezUIComponents;
}

/** Native elements remain the implicit fallback for unconfigured adapters. */
const EMPTY_COMPONENTS: BeezUIComponents = {};
const AdapterContext = createContext<BeezUIComponents>(EMPTY_COMPONENTS);

/** Merges nested overrides while preserving stable adapter identities. */
export function BeezUIProvider({ children, components = EMPTY_COMPONENTS }: BeezUIProviderProps) {
  const parent = useContext(AdapterContext);
  const value = useMemo(() => ({ ...parent, ...components }), [parent, components]);
  return <AdapterContext.Provider value={value}>{children}</AdapterContext.Provider>;
}

/** Reads adapters internally; native components work without a provider. */
export function useBeezUIComponents(): BeezUIComponents {
  return useContext(AdapterContext);
}
