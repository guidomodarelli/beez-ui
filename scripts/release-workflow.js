/** @module release-workflow Coordinates version creation, validated preparation and publication. */
import { createReleaseVersion } from "./release-version.js";

/**
 * Publishes only the artifact returned by successful release preparation.
 * @param {string} root - Repository owning the version metadata.
 * @param {string} target - Requested version increment or stable version.
 * @param {string[]} notes - Optional release notes.
 * @param {{prepare: () => string, publish: (archive: string) => void}} operations - Preparation and publication operations.
 * @returns {{version: string, archive: string}} Successfully published release.
 * @throws {Error} When a stage fails; preserves its cause and supplies the appropriate retry command.
 */
export function createAndPublishRelease(root, target, notes, operations) {
  const version = createReleaseVersion(root, target, notes);
  let archive;
  try {
    archive = operations.prepare();
  } catch (error) {
    throw new Error(`create-version: ${version} metadata is ready, but preparation failed; fix the reported issue and run pnpm release:prepare, then pnpm release:publish with its resulting archive`, { cause: error });
  }
  try {
    operations.publish(archive);
  } catch (error) {
    throw new Error(`create-version: ${version} was prepared, but publication did not complete; check npm before retrying with pnpm release:publish "${archive}". Do not increment the version again`, { cause: error });
  }
  return { version, archive };
}
