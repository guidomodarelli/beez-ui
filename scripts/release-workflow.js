/** @module release-workflow Coordinates version creation, validation, Git persistence and publication. */
import { createReleaseVersion } from "./release-version.js";
import { readReleaseMetadata } from "./release-git.js";

/**
 * Publishes only the artifact returned by successful release preparation.
 * @param {string} root - Repository owning the version metadata.
 * @param {string} target - Requested version increment or stable version.
 * @param {string[]} notes - Optional release notes.
 * @param {{prepare: () => string, commitAndPush: (version: string, metadata: Record<string, string>) => void, publish: (archive: string) => void}} operations - Preparation, Git and publication operations.
 * @returns {{version: string, archive: string}} Successfully published release.
 * @throws {Error} When a stage fails; preserves its cause and supplies the appropriate retry command.
 */
export function createAndPublishRelease(root, target, notes, operations) {
  const version = createReleaseVersion(root, target, notes);
  const metadata = readReleaseMetadata(root);
  let archive;
  try {
    archive = operations.prepare();
  } catch (error) {
    throw new Error(`create-version: ${version} metadata is ready, but preparation failed; fix the reported issue and run pnpm release:prepare, commit and push the metadata, then run pnpm release:publish with its resulting archive`, { cause: error });
  }
  try {
    operations.commitAndPush(version, metadata);
  } catch (error) {
    throw new Error(`create-version: ${version} was prepared, but its Git commit or push failed; resolve Git state and push the release commit before running pnpm release:publish "${archive}". Do not increment the version again`, { cause: error });
  }
  try {
    operations.publish(archive);
  } catch (error) {
    throw new Error(`create-version: ${version} was prepared, but publication did not complete; check npm before retrying with pnpm release:publish "${archive}". Do not increment the version again`, { cause: error });
  }
  return { version, archive };
}
