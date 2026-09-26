/** @module release-version Creates consistent version metadata before release preparation. */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import semver from "semver";
import { releaseUnreleased } from "./changelog.js";
import { ownedPath } from "./owned-path.js";
import { validateReleaseMetadata } from "./release-checks.js";

/** Supported stable release increments. @type {ReadonlyArray<import("semver").ReleaseType>} */
const VERSION_INCREMENTS = ["patch", "minor", "major"];

/**
 * Updates the version and releases the `[Unreleased]` CHANGELOG block after validating all inputs.
 * @param {string} root - Repository owning the release files.
 * @param {string} target - Patch, minor, major or an explicit newer stable version.
 * @param {Date} date - Release date; defaults to the current UTC date.
 * @returns {string} The new version, ready for release:prepare.
 * @throws {Error} When metadata, target or the `[Unreleased]` block are invalid, or a file cannot be updated.
 */
export function createReleaseVersion(root, target, date = new Date()) {
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
  const releaseDate = date.toISOString().split("T")[0];
  const nextChangelog = releaseUnreleased(changelog, version, releaseDate);
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
