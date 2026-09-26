/** Detects in-app browsers and builds deep links that reopen a URL in the default browser. */

/** User-agent fragments of apps that open links in their own embedded browser. */
const IN_APP_BROWSER_USER_AGENT_TOKENS = [
  "MercadoPago",
  "MercadoLibre",
  "MLWebKit",
  "FBAN",
  "FBAV",
  "Instagram",
  "Line/",
  "MicroMessenger",
  "Twitter",
] as const;

const IOS_DEVICE_TOKENS = ["iPhone", "iPad", "iPod"] as const;
const ANDROID_DEVICE_TOKEN = "Android";

const SAFARI_USER_AGENT_TOKEN = "Safari/";
const IOS_MOBILE_USER_AGENT_TOKEN = "Mobile/";
const MERCADO_PAGO_USER_AGENT_TOKENS = [
  "MercadoPago",
  "MercadoLibre",
  "MLWebKit",
] as const;

export type InAppBrowserDetectionResult = {
  isInAppBrowser: boolean;
  isIos: boolean;
  isAndroid: boolean;
  isMercadoPago: boolean;
};

/**
 * Classifies a user agent: in-app browsers (social, messaging and payment apps, iOS web views)
 * often block sign-in popups or lose sessions, so callers can offer to continue elsewhere.
 * Safe on the server: pass the request `User-Agent` header.
 *
 * @param userAgent - User agent string, or nothing when unknown.
 * @returns Whether it is an in-app browser and which platform it runs on.
 */
export function detectInAppBrowser(
  userAgent: string | null | undefined
): InAppBrowserDetectionResult {
  if (!userAgent) {
    return {
      isInAppBrowser: false,
      isIos: false,
      isAndroid: false,
      isMercadoPago: false,
    };
  }

  const isIos = IOS_DEVICE_TOKENS.some((token) => userAgent.includes(token));
  const isAndroid = userAgent.includes(ANDROID_DEVICE_TOKEN);
  const isMercadoPago = MERCADO_PAGO_USER_AGENT_TOKENS.some((token) =>
    userAgent.includes(token)
  );
  const hasInAppToken = IN_APP_BROWSER_USER_AGENT_TOKENS.some((token) =>
    userAgent.includes(token)
  );
  const isIosWebView =
    isIos &&
    userAgent.includes(IOS_MOBILE_USER_AGENT_TOKEN) &&
    !userAgent.includes(SAFARI_USER_AGENT_TOKEN);

  return {
    isInAppBrowser: hasInAppToken || isIosWebView,
    isIos,
    isAndroid,
    isMercadoPago,
  };
}

const HTTPS_PROTOCOL = "https://";
const SAFARI_URL_SCHEME = "x-safari-https://";
const CHROME_ANDROID_NAVIGATION_URL_PREFIX = "googlechrome://navigate?url=";

export const EXTERNAL_BROWSER_PLATFORM = {
  android: "android",
  ios: "ios",
} as const;

export type ExternalBrowserPlatform =
  (typeof EXTERNAL_BROWSER_PLATFORM)[keyof typeof EXTERNAL_BROWSER_PLATFORM];

type BuildExternalBrowserUrlInput = {
  platform: ExternalBrowserPlatform;
  targetHttpsUrl: string;
};

/**
 * Builds a deep link that asks the OS to open the given https URL in the
 * user's default external browser instead of the in-app browser.
 *
 * @param input - Target URL and detected platform.
 * @returns A deep-link URL for iOS Safari or Android Chrome. Returns null when
 *          the target URL does not use the https scheme.
 */
export function buildExternalBrowserUrl({
  platform,
  targetHttpsUrl,
}: BuildExternalBrowserUrlInput): string | null {
  if (!targetHttpsUrl.startsWith(HTTPS_PROTOCOL)) {
    return null;
  }

  const urlWithoutScheme = targetHttpsUrl.slice(HTTPS_PROTOCOL.length);

  if (platform === EXTERNAL_BROWSER_PLATFORM.ios) {
    return SAFARI_URL_SCHEME + urlWithoutScheme;
  }

  return CHROME_ANDROID_NAVIGATION_URL_PREFIX + encodeURIComponent(targetHttpsUrl);
}
