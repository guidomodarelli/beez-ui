/**
 * Asks people inside an in-app browser to continue in their regular browser: a Safari deep link
 * on iOS, manual steps elsewhere, and the destination URL ready to copy. Server-safe.
 */
import { cn } from "../lib/utils.js";
import { EXTERNAL_BROWSER_PLATFORM, buildExternalBrowserUrl } from "../lib/in-app-browser.js";

const ENTER_CLASS_NAME = "animate-in fade-in slide-in-from-bottom-1.5 fill-mode-both duration-300";

export interface OpenInBrowserCtaCopy {
  title: string;
  description: string;
  iosButtonLabel: string;
  iosHint: string;
  manualHint: string;
}

const OPEN_IN_BROWSER_DEFAULT_COPY: OpenInBrowserCtaCopy = {
  title: "Abrí este sitio en tu navegador",
  description:
    "Estás dentro del navegador interno de la app que te trajo hasta acá. Para continuar, abrí este sitio en tu navegador habitual.",
  iosButtonLabel: "Abrir en Safari",
  iosHint: "Tocá el botón para abrir el sitio en Safari y continuá desde ahí.",
  manualHint:
    "Tocá los tres puntos arriba a la derecha y elegí “Abrir en el navegador”, o copiá este link y pegalo en tu navegador.",
};

export interface OpenInBrowserCtaProps {
  /** Absolute https URL to continue with, such as the sign-in page. */
  url: string;
  /** iOS gets a Safari deep link; other platforms get manual steps. */
  isIos: boolean;
  copy?: Partial<OpenInBrowserCtaCopy>;
  className?: string;
}

/**
 * Renders the handoff section. The URL is selectable with one tap, since copying is the only
 * universal escape from embedded browsers.
 * @param props - Destination URL, platform and optional copy.
 * @returns The call to action.
 */
export function OpenInBrowserCta({ url, isIos, copy, className }: OpenInBrowserCtaProps) {
  const resolvedCopy = { ...OPEN_IN_BROWSER_DEFAULT_COPY, ...copy };
  const safariUrl = buildExternalBrowserUrl({ platform: EXTERNAL_BROWSER_PLATFORM.ios, targetHttpsUrl: url }) ?? url;

  return (
    <section data-slot="open-in-browser-cta" className={cn("mt-6 flex flex-col gap-4", className)}>
      <h2 className={cn("m-0 text-lg font-semibold text-foreground", ENTER_CLASS_NAME)}>{resolvedCopy.title}</h2>
      <p className={cn("m-0 text-sm leading-6 text-muted-foreground", ENTER_CLASS_NAME, "delay-35")}>{resolvedCopy.description}</p>
      {isIos ? (
        <>
          <a
            className={cn(
              "inline-flex h-10 items-center justify-center self-stretch rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground no-underline [-webkit-tap-highlight-color:transparent] transition-[background-color,box-shadow,scale] outline-none active:scale-[0.98] focus-visible:shadow-[0_0_0_2px_var(--background),0_0_0_4px_var(--ring)] [@media(hover:hover)]:hover:bg-primary/80",
              ENTER_CLASS_NAME,
              "delay-70",
            )}
            href={safariUrl}
            rel="noopener noreferrer"
          >
            {resolvedCopy.iosButtonLabel}
          </a>
          <p className={cn("m-0 text-[0.8125rem] leading-5 text-muted-foreground", ENTER_CLASS_NAME, "delay-105")}>{resolvedCopy.iosHint}</p>
        </>
      ) : (
        <p className={cn("m-0 text-[0.8125rem] leading-5 text-muted-foreground", ENTER_CLASS_NAME, "delay-70")}>{resolvedCopy.manualHint}</p>
      )}
      <p
        className={cn(
          "m-0 rounded-lg border border-border bg-muted/50 p-3 font-mono text-xs leading-[1.125rem] break-all text-muted-foreground select-all",
          ENTER_CLASS_NAME,
          "delay-140",
        )}
      >
        {url}
      </p>
    </section>
  );
}
