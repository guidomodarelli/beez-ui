/** Defines the cookie contract shared by the UI and server-side consumers. */

/** Number of days the navigation preference remains valid. */
const SIDEBAR_COOKIE_MAX_AGE_DAYS = 7;
/** Converts preference days into hours. */
const SIDEBAR_COOKIE_MAX_AGE_HOURS_PER_DAY = 24;
/** Converts preference hours into minutes. */
const SIDEBAR_COOKIE_MAX_AGE_MINUTES_PER_HOUR = 60;
/** Converts preference minutes into cookie max-age seconds. */
const SIDEBAR_COOKIE_MAX_AGE_SECONDS_PER_MINUTE = 60;

/** Stable cookie key read by server entrypoints and written by the sidebar. */
export const SIDEBAR_COOKIE_NAME = "sidebar_state";
/** Serialized value representing expanded navigation. */
export const SIDEBAR_COOKIE_OPEN_VALUE = "true";
/** Serialized value representing collapsed navigation. */
export const SIDEBAR_COOKIE_COLLAPSED_VALUE = "false";
/** Preference lifetime in seconds, as required by the cookie max-age field. */
export const SIDEBAR_COOKIE_MAX_AGE =
  SIDEBAR_COOKIE_MAX_AGE_SECONDS_PER_MINUTE *
  SIDEBAR_COOKIE_MAX_AGE_MINUTES_PER_HOUR *
  SIDEBAR_COOKIE_MAX_AGE_HOURS_PER_DAY *
  SIDEBAR_COOKIE_MAX_AGE_DAYS;

