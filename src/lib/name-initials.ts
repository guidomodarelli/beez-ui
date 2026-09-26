/** Builds avatar initials from display names, shared by account and member avatars. */

const NAME_PART_SEPARATOR = /\s+/;
const MAX_INITIALS = 2;

/**
 * Builds up to two uppercase initials from a display name, ignoring repeated spaces.
 * @param name - Display name, possibly blank.
 * @returns The initials, or an empty string for a blank name.
 */
export function getNameInitials(name: string): string {
  return name
    .trim()
    .split(NAME_PART_SEPARATOR)
    .filter(Boolean)
    .slice(0, MAX_INITIALS)
    .map((namePart) => namePart.charAt(0).toUpperCase())
    .join("");
}
