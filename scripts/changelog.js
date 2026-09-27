/**
 * @module changelog Reads the released blocks of CHANGELOG.md in the Keep a Changelog format.
 *
 * Every change adds its entries under `## [Unreleased]`; `beez-rp create-version`
 * moves that block under `## [X.Y.Z] - YYYY-MM-DD` and leaves an empty
 * `## [Unreleased]` on top. Headings of older releases without brackets
 * (`## 0.6.0 - 2026-09-23`) remain valid. Release checks only need the newest
 * released block, so this module reads nothing else.
 */

/** Any release-level heading: `## [Unreleased]`, `## [0.7.0] - 2026-09-26` or `## 0.6.0 - 2026-09-23`. */
const RELEASE_HEADING = /^## +\[?([^\]\s]+)\]?[^\n]*$/gmu;
/** Unreleased heading, case-insensitive, as its own line. */
const UNRELEASED_LINE = /^## +\[Unreleased\][ \t]*$/imu;
/** A change entry line. */
const ENTRY_LINE = /^\s*- +\S/mu;

/**
 * Splits the changelog into release blocks in document order.
 * @param {string} changelog - CHANGELOG.md contents.
 * @returns {{ label: string, heading: string, bodyStart: number, end: number }[]} Blocks.
 */
function listBlocks(changelog) {
  const headings = [...changelog.matchAll(RELEASE_HEADING)];
  return headings.map((match, index) => ({
    label: match[1],
    heading: match[0],
    bodyStart: /** @type {number} */ (match.index) + match[0].length,
    end: headings[index + 1]?.index ?? changelog.length,
  }));
}

/**
 * Counts the change entries of a block body.
 * @param {string} body - Block text below its heading.
 * @returns {number} Number of `- ` lines.
 */
function countEntries(body) {
  return body.split(/\r?\n/u).filter((line) => ENTRY_LINE.test(line)).length;
}

/**
 * Returns the newest released block (the first one that is not `[Unreleased]`).
 * @param {string} changelog - CHANGELOG.md contents.
 * @returns {{ version: string, entryCount: number } | null} Latest release entry.
 */
export function readLatestRelease(changelog) {
  const block = listBlocks(changelog).find((candidate) => !UNRELEASED_LINE.test(candidate.heading));
  return block ? { version: block.label, entryCount: countEntries(changelog.slice(block.bodyStart, block.end)) } : null;
}
