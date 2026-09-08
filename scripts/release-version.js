/** @module release-version Creates consistent version metadata before release preparation. */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import semver from "semver";
import { ownedPath } from "./owned-path.js";
import { validateReleaseMetadata } from "./release-checks.js";

/** Supported stable release increments. @type {ReadonlyArray<import("semver").ReleaseType>} */
const VERSION_INCREMENTS = ["patch", "minor", "major"];
/** Preserves the existing document title while prepending new release notes. */
const CHANGELOG_TITLE = /^# [^\r\n]+(?:\r?\n)+/u;

/**
 * Updates the version and changelog after validating all inputs.
 * @param {string} root - Repository owning the release files.
 * @param {string} target - Patch, minor, major or an explicit newer stable version.
 * @param {string[]} [notes] - Optional release notes; omission generates a basic version entry.
 * @param {Date} date - Release date; defaults to the current UTC date.
 * @returns {string} The new version, ready for release:prepare.
 * @throws {Error} When metadata, target or notes are invalid, or a file cannot be updated.
 */
export function createReleaseVersion(root, target, notes = [], date = new Date()) {
  const packagePath = ownedPath(root, join(root, "package.json"));
  const changelogPath = ownedPath(root, join(root, "CHANGELOG.md"));
  const originalPackage = readFileSync(packagePath, "utf8");
  const changelog = readFileSync(changelogPath, "utf8");
  const metadata = JSON.parse(originalPackage);
  validateReleaseMetadata(metadata, changelog);
  const increment = VERSION_INCREMENTS.find((value) => value === target);
  const version = increment ? semver.inc(metadata.version, increment) : semver.valid(target);
  if (!version || semver.prerelease(version) || !semver.gt(version, metadata.version)) {
    throw new Error(`create-version: choose patch, minor, major or a stable version greater than ${metadata.version}`);
  }
  if (notes.some((note) => !note.trim())) {
    throw new Error("create-version: provide nonempty --notes for the changes in this release");
  }
  if (!CHANGELOG_TITLE.test(changelog)) throw new Error("create-version: CHANGELOG.md must begin with a level-one title");
  const releaseNotes = notes.length ? notes : [`Actualiza el paquete a la versión ${version}.`];
  const items = releaseNotes.map((note) => `- ${note.trim().replace(/[\r\n]+/gu, " ")}`).join("\n");
  const releaseDate = date.toISOString().split("T")[0];
  const nextChangelog = changelog.replace(CHANGELOG_TITLE, (title) => `${title.trimEnd()}\n\n## ${version} - ${releaseDate}\n\n${items}\n\n`);
  const nextMetadata = { ...metadata, version };
  validateReleaseMetadata(nextMetadata, nextChangelog);
  writeFileSync(packagePath, `${JSON.stringify(nextMetadata, null, 2)}\n`);
  try {
    writeFileSync(changelogPath, nextChangelog);
  } catch (error) {
    writeFileSync(packagePath, originalPackage);
    throw new Error("create-version: could not update CHANGELOG.md; package.json was restored", { cause: error });
  }
  return version;
}
