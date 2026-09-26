/** @module release-workflow Coordinates version creation, the release commit, validation, push and publication. */
import { createReleaseVersion } from "./release-version.js";
import { readReleaseMetadata } from "./release-git.js";

/** Command that resumes an interrupted release from its first missing stage. */
const RESUME_COMMAND = "pnpm create-version";

/**
 * Creates the version (releasing the CHANGELOG `[Unreleased]` block), commits package.json and CHANGELOG.md right away, then
 * validates, pushes and publishes exactly the prepared artifact. Committing
 * before the long validation means an interruption always leaves a local
 * release commit that `pnpm create-version` resumes without a new version.
 * @param {string} root - Repository owning the version metadata.
 * @param {string} target - Requested version increment or stable version.
 * @param {{
 *   commit: (version: string, metadata: Record<string, string>) => string,
 *   prepare: () => string,
 *   push: (commit: string) => void,
 *   publish: (archive: string) => void,
 * }} operations - Git commit, preparation, Git push and publication operations.
 * @returns {{version: string, commit: string, archive: string}} Successfully published release.
 * @throws {Error} When a stage fails; preserves its cause and explains how to resume.
 */
export function createAndPublishRelease(root, target, operations) {
  const version = createReleaseVersion(root, target);
  const metadata = readReleaseMetadata(root);
  let commit;
  try {
    commit = operations.commit(version, metadata);
  } catch (error) {
    throw new Error(`create-version: ${version} metadata is written, but the release commit failed; fix Git state and run ${RESUME_COMMAND}, which commits it and resumes. Do not increment the version again`, { cause: error });
  }
  let archive;
  try {
    archive = operations.prepare();
  } catch (error) {
    throw new Error(`create-version: ${version} is committed locally, but preparation failed; fix the reported issue and run ${RESUME_COMMAND} to prepare, push and publish it. Do not increment the version again`, { cause: error });
  }
  try {
    operations.push(commit);
  } catch (error) {
    throw new Error(`create-version: ${version} was prepared, but its Git push failed; resolve Git state and run ${RESUME_COMMAND} to push and publish it. Do not increment the version again`, { cause: error });
  }
  try {
    operations.publish(archive);
  } catch (error) {
    throw new Error(`create-version: ${version} was pushed, but publication did not complete; check npm before retrying with ${RESUME_COMMAND}. Do not increment the version again`, { cause: error });
  }
  return { version, commit, archive };
}
